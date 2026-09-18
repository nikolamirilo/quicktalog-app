import { sendSubscriptionCancelationEmail } from "@/actions/email";
import { cancelSubscription } from "@/actions/paddle";
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
	| { kind: "unlinked" }
	| { kind: "stored" }
	| { kind: "activated"; otherActiveSubscriptionIds: string[] }
	| { kind: "downgraded"; user: { name: string | null; email: string | null } };

/**
 * Applies Paddle webhook events to the database. Errors are not caught here:
 * they reach the route, which answers 500 so Paddle retries the event. Every
 * write is idempotent, so a retry is safe.
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
				await this.handleCustomerData(
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

		const outcome = await asAdmin(
			"paddle:subscription",
			async (tx): Promise<SubscriptionOutcome> => {
				const [linkedUser] = await tx
					.select({ id: users.id })
					.from(users)
					.where(eq(users.customerId, subscription.customerId))
					.limit(1);

				if (!linkedUser) return { kind: "unlinked" };

				await tx
					.insert(subscriptions)
					.values(subscription)
					.onConflictDoUpdate({
						target: subscriptions.subscriptionId,
						set: {
							subscriptionStatus: subscription.subscriptionStatus,
							priceId: subscription.priceId,
							productId: subscription.productId,
							scheduledChange: subscription.scheduledChange,
							customerId: subscription.customerId,
							updatedAt: sql`now()`,
						},
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
						.where(eq(users.customerId, subscription.customerId));

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
						.where(eq(users.customerId, subscription.customerId))
						.limit(1);
					if (!user) return { kind: "stored" };

					await tx
						.update(users)
						.set({ planId: tiers[0].priceId.month })
						.where(eq(users.customerId, subscription.customerId));

					return { kind: "downgraded", user };
				}

				return { kind: "stored" };
			},
		);

		// Side effects run only after the transaction committed.
		if (outcome.kind === "unlinked") {
			console.warn(
				"Skipping subscription upsert: no user linked to customer_id",
				subscription.customerId,
			);
			return;
		}

		if (outcome.kind === "activated") {
			for (const subscriptionId of outcome.otherActiveSubscriptionIds) {
				await cancelSubscription(subscriptionId);
			}
		}

		if (outcome.kind === "downgraded" && outcome.user.email) {
			await sendSubscriptionCancelationEmail({
				email: outcome.user.email,
				name: outcome.user.name ?? "",
			});
		}
	}

	private async handleCustomerData(
		eventData: CustomerCreatedEvent | CustomerUpdatedEvent,
	) {
		const email = eventData.data.email?.trim().toLowerCase();

		if (!email) {
			// Without an email there is nothing to match the Paddle customer to a
			// user row, so record it for follow-up instead of writing to the DB.
			Sentry.captureMessage("Paddle customer event without an email", {
				level: "warning",
				tags: { domain: "paddle", op: "link-customer-noemail" },
				extra: { customerId: eventData.data.id },
			});
			return;
		}

		const matched = await asAdmin("paddle:link-customer", async (tx) => {
			const candidates = await tx
				.select({ id: users.id })
				.from(users)
				.where(sql`lower(${users.email}) = ${email}`)
				.limit(2);

			// Link only when exactly one user has this email.
			if (candidates.length !== 1) return candidates.length;

			await tx
				.update(users)
				.set({ customerId: eventData.data.id })
				.where(eq(users.id, candidates[0].id));
			return 1;
		});

		if (matched !== 1) {
			Sentry.captureMessage("Paddle customer not linked to a single user", {
				level: "warning",
				tags: { domain: "paddle", op: "link-customer" },
				extra: { customerId: eventData.data.id, matches: matched },
			});
		}
	}
}
