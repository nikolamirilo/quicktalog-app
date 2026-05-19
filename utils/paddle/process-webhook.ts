import * as Sentry from "@sentry/nextjs";
import { sendSubscriptionCancelationEmail } from "@/server_actions/email";
import { cancelSubscription } from "@/server_actions/paddle";
import { createClient } from "@/utils/supabase/server";
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
import { tiers } from "@quicktalog/common";

export class ProcessWebhook {
	async processEvent(eventData: EventEntity) {
		try {
			switch (eventData.eventType) {
				case EventName.SubscriptionCreated:
				case EventName.SubscriptionUpdated:
				case EventName.SubscriptionActivated:
				case EventName.SubscriptionCanceled:
					await this.handleSubscriptionData(
						eventData as
							| SubscriptionCreatedEvent
							| SubscriptionUpdatedEvent
							| SubscriptionActivatedEvent
							| SubscriptionCanceledEvent,
					);
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
		} catch (err) {
			Sentry.captureException(err);
			console.error("Webhook processing error:", err);
		}
	}

	private async handleSubscriptionData(
		eventData:
			| SubscriptionCreatedEvent
			| SubscriptionUpdatedEvent
			| SubscriptionActivatedEvent
			| SubscriptionCanceledEvent
			| SubscriptionTrialingEvent
			| SubscriptionResumedEvent,
	) {
		const supabase = await createClient();

		const subscription = {
			subscription_id: eventData.data.id,
			subscription_status: eventData.data.status,
			price_id: eventData.data.items?.[0]?.price?.id ?? null,
			product_id: eventData.data.items?.[0]?.price?.productId ?? null,
			scheduled_change: eventData.data.scheduledChange?.effectiveAt ?? null,
			customer_id: eventData.data.customerId,
		};

		const { data: linkedUser } = await supabase
			.from("users")
			.select("id")
			.eq("customer_id", subscription.customer_id)
			.maybeSingle();

		if (!linkedUser) {
			console.warn(
				"Skipping subscription upsert: no user linked to customer_id",
				subscription.customer_id,
			);
			return;
		}

		const { error: subError } = await supabase
			.from("subscriptions")
			.upsert(subscription, { onConflict: "subscription_id" });

		if (subError) {
			Sentry.captureException(subError);
			console.error("Failed to upsert subscription:", subError);
			return;
		}

		if (
			eventData.eventType === EventName.SubscriptionActivated ||
			eventData.eventType === EventName.SubscriptionTrialing ||
			eventData.eventType === EventName.SubscriptionResumed
		) {
			const { data: customerSubscriptions, error: customerSubscriptionsError } =
				await supabase
					.from("subscriptions")
					.select("subscription_id, subscription_status")
					.eq("customer_id", subscription.customer_id)
					.eq("subscription_status", "active");

			if (customerSubscriptionsError) {
				Sentry.captureException(customerSubscriptionsError);
				console.error(
					"Error fetching customer subscriptions:",
					customerSubscriptionsError,
				);
				return;
			}

			if (!customerSubscriptions || customerSubscriptions.length === 0) {
				return;
			}

			const subscriptionsToPause = customerSubscriptions.filter(
				(item) => item.subscription_id !== subscription.subscription_id,
			);

			for (const sub of subscriptionsToPause) {
				await cancelSubscription(sub.subscription_id);
			}

			const { error: userError } = await supabase
				.from("users")
				.update({ plan_id: subscription.price_id })
				.eq("customer_id", subscription.customer_id);
			if (userError) {
				Sentry.captureException(userError);
				console.error("Failed to update user plan:", userError);
			}
		}

		if (eventData.eventType === EventName.SubscriptionCanceled) {
			const { data: customerSubscriptions, error: customerSubscriptionsError } =
				await supabase
					.from("subscriptions")
					.select("subscription_id, subscription_status")
					.eq("customer_id", subscription.customer_id)
					.eq("subscription_status", "active");

			if (customerSubscriptionsError) {
				Sentry.captureException(customerSubscriptionsError);
				console.error(
					"Error fetching customer subscriptions:",
					customerSubscriptionsError,
				);
				return;
			}

			if (!customerSubscriptions || customerSubscriptions.length === 0) {
				const { data: user, error: fetchError } = await supabase
					.from("users")
					.select("name, email")
					.eq("customer_id", subscription.customer_id)
					.maybeSingle();

				if (fetchError) {
					Sentry.captureException(fetchError);
					console.error("Failed to fetch user:", fetchError);
					return;
				}
				if (!user) {
					console.warn(
						"User not found for customer_id:",
						subscription.customer_id,
					);
					return;
				}

				const { error: updateError } = await supabase
					.from("users")
					.update({ plan_id: tiers[0].priceId.month })
					.eq("customer_id", subscription.customer_id);

				if (updateError) {
					Sentry.captureException(updateError);
					console.error("Failed to update user plan:", updateError);
					return;
				}

				await sendSubscriptionCancelationEmail({
					email: user.email,
					name: user.name,
				});
			}
		}
	}

	private async handleCustomerData(
		eventData: CustomerCreatedEvent | CustomerUpdatedEvent,
	) {
		const supabase = await createClient();

		if (eventData.data.email) {
			const { error } = await supabase
				.from("users")
				.update({ customer_id: eventData.data.id })
				.eq("email", eventData.data.email);

			if (error) {
				Sentry.captureException(error);
				console.error("Failed to update user with customer_id:", error);
			}
		} else {
			// Optional: ensure customers are tracked even if no email present
			const { error } = await supabase.from("customers").upsert(
				{
					customer_id: eventData.data.id,
					createdAt: new Date().toISOString(),
				},
				{ onConflict: "customer_id" },
			);

			if (error) {
				Sentry.captureException(error);
				console.error("Failed to upsert customer:", error);
			}
		}
	}
}
