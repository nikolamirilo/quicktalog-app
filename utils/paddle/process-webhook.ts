import { cancelSubscription } from "@/actions/paddle";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { sendSubscriptionCancelationEmail } from "@/lib/email/transactional";
import { applyPlanDowngrade } from "@/lib/entitlements/catalogue";
import { tierForPlanId } from "@/lib/entitlements/plan";
import {
	type PaddleCustomData,
	resolveUserId,
} from "@/lib/paddle/resolve-user";
import { asAdmin } from "@/utils/db/admin";
import {
	CustomerCreatedEvent,
	CustomerUpdatedEvent,
	EventEntity,
	EventName,
	SubscriptionActivatedEvent,
	SubscriptionCanceledEvent,
	SubscriptionCreatedEvent,
	SubscriptionResumedEvent,
	SubscriptionTrialingEvent,
	SubscriptionUpdatedEvent,
} from "@paddle/paddle-node-sdk";
import { schema, tiers } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { and, eq, sql } from "drizzle-orm";

const { subscriptions, users } = schema;

type SubscriptionEvent =
	| SubscriptionCreatedEvent
	| SubscriptionUpdatedEvent
	| SubscriptionActivatedEvent
	| SubscriptionCanceledEvent
	| SubscriptionTrialingEvent
	| SubscriptionResumedEvent;

type SubscriptionOutcome =
	| { kind: "unresolved"; reason: "conflict" | "unlinked" }
	| { kind: "stored" }
	| { kind: "activated"; otherActiveSubscriptionIds: string[] }
	| {
			kind: "downgraded";
			user: { name: string | null; email: string | null };
			deactivated: string[];
	  };

/**
 * Applies Paddle webhook events to the database. Errors are not caught here:
 * they reach the route, which answers 500 so Paddle retries the event. Every
 * write is idempotent, so a retry is safe. An event that cannot be tied to
 * exactly one user is reported and answered 200, because retrying it would
 * never resolve it.
 */
export class ProcessWebhook {
	async processEvent(eventData: EventEntity) {
		switch (eventData.eventType) {
			case EventName.SubscriptionCreated:
			case EventName.SubscriptionUpdated:
			case EventName.SubscriptionActivated:
			case EventName.SubscriptionCanceled:
				await this.handleSubscriptionData(eventData as SubscriptionEvent);
				break;
			case EventName.CustomerCreated:
			case EventName.CustomerUpdated:
				this.handleCustomerData(
					eventData as CustomerCreatedEvent | CustomerUpdatedEvent,
				);
				break;
			default:
				console.log(`Unhandled event type: ${eventData.eventType}`);
		}
	}

	private async handleSubscriptionData(eventData: SubscriptionEvent) {
		const subscription = {
			subscriptionId: eventData.data.id,
			subscriptionStatus: eventData.data.status,
			priceId: eventData.data.items?.[0]?.price?.id ?? null,
			productId: eventData.data.items?.[0]?.price?.productId ?? null,
			scheduledChange: eventData.data.scheduledChange?.effectiveAt ?? null,
			customerId: eventData.data.customerId,
		};
		const occurredAt = eventData.occurredAt;
		const customData = (eventData.data.customData ?? null) as PaddleCustomData;

		const outcome = await asAdmin(
			"paddle:subscription",
			async (tx): Promise<SubscriptionOutcome> => {
				const resolution = await resolveUserId(
					tx,
					customData,
					subscription.customerId,
				);
				if ("unresolved" in resolution) {
					return { kind: "unresolved", reason: resolution.unresolved };
				}
				const userId = resolution.userId;

				// Paddle does not guarantee delivery order: an older event must not
				// overwrite a newer state.
				await tx
					.insert(subscriptions)
					.values({ ...subscription, updatedAt: occurredAt })
					.onConflictDoUpdate({
						target: subscriptions.subscriptionId,
						set: {
							subscriptionStatus: subscription.subscriptionStatus,
							priceId: subscription.priceId,
							productId: subscription.productId,
							scheduledChange: subscription.scheduledChange,
							customerId: subscription.customerId,
							updatedAt: occurredAt,
						},
						setWhere: sql`${subscriptions.updatedAt} <= ${occurredAt}`,
					});

				const activeSubscriptions = () =>
					tx
						.select({ subscriptionId: subscriptions.subscriptionId })
						.from(subscriptions)
						.where(
							and(
								eq(subscriptions.customerId, subscription.customerId),
								eq(subscriptions.subscriptionStatus, "active"),
							),
						);

				if (
					eventData.eventType === EventName.SubscriptionActivated ||
					eventData.eventType === EventName.SubscriptionTrialing ||
					eventData.eventType === EventName.SubscriptionResumed
				) {
					const active = await activeSubscriptions();
					if (active.length === 0) return { kind: "stored" };

					await tx
						.update(users)
						.set({ planId: subscription.priceId })
						.where(
							and(
								eq(users.id, userId),
								eq(users.customerId, subscription.customerId),
							),
						);

					return {
						kind: "activated",
						otherActiveSubscriptionIds: active
							.map((row) => row.subscriptionId)
							.filter((id) => id !== subscription.subscriptionId),
					};
				}

				if (eventData.eventType === EventName.SubscriptionCanceled) {
					const active = await activeSubscriptions();
					if (active.length > 0) return { kind: "stored" };

					const [user] = await tx
						.select({ name: users.name, email: users.email })
						.from(users)
						.where(eq(users.id, userId))
						.limit(1);
					if (!user) return { kind: "stored" };

					const freePlanId = tiers[0].priceId.month;
					await tx
						.update(users)
						.set({ planId: freePlanId })
						.where(
							and(
								eq(users.id, userId),
								eq(users.customerId, subscription.customerId),
							),
						);

					// The user keeps only what the free plan includes.
					const deactivated = await applyPlanDowngrade(
						tx,
						userId,
						tierForPlanId(freePlanId),
					);

					return { kind: "downgraded", user, deactivated };
				}

				return { kind: "stored" };
			},
		);

		// Side effects run only after the transaction committed.
		if (outcome.kind === "unresolved") {
			Sentry.captureMessage("Paddle event could not be tied to one user", {
				level: "error",
				tags: { domain: "paddle", op: "resolve-user", reason: outcome.reason },
				extra: {
					customerId: subscription.customerId,
					subscriptionId: subscription.subscriptionId,
					eventType: eventData.eventType,
				},
			});
			return;
		}

		if (outcome.kind === "activated") {
			for (const subscriptionId of outcome.otherActiveSubscriptionIds) {
				await cancelSubscription(subscriptionId);
			}
		}

		if (outcome.kind === "downgraded") {
			for (const name of outcome.deactivated) revalidateCatalogue(name);
			if (outcome.deactivated.length > 0) revalidateDashboard();
			if (outcome.user.email) {
				await sendSubscriptionCancelationEmail({
					email: outcome.user.email,
					name: outcome.user.name ?? "",
				});
			}
		}
	}

	/**
	 * Customers are linked at checkout (`ensurePaddleCustomer`) and through the
	 * signed user id on the event, never by matching an email address: two
	 * accounts can share an email at Paddle, and matching on it would hand one
	 * user's subscription to another.
	 */
	private handleCustomerData(
		eventData: CustomerCreatedEvent | CustomerUpdatedEvent,
	) {
		console.log(
			`Paddle customer event ${eventData.eventType} for ${eventData.data.id}; linking happens at checkout`,
		);
	}
}
