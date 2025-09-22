import { tiers } from '@/constants/pricing';
import { createClient } from '@/utils/supabase/server';
import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  EventEntity,
  EventName,
  SubscriptionActivatedEvent,
  SubscriptionCanceledEvent,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
} from '@paddle/paddle-node-sdk';

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
            | SubscriptionCanceledEvent
          );
          break;
        case EventName.CustomerCreated:
        case EventName.CustomerUpdated:
          await this.handleCustomerData(
            eventData as CustomerCreatedEvent | CustomerUpdatedEvent
          );
          break;
        default:
          console.log(`Unhandled event type: ${eventData.eventType}`);
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
    }
  }

  private async handleSubscriptionData(
    eventData:
      | SubscriptionCreatedEvent
      | SubscriptionUpdatedEvent
      | SubscriptionActivatedEvent
      | SubscriptionCanceledEvent
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

    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(subscription, { onConflict: 'subscription_id' });

    if (subError) {
      console.error("Failed to upsert subscription:", subError);
      return;
    }

    // Update user plan when subscription is activated
    if (eventData.eventType === EventName.SubscriptionActivated) {
      const { error: userError } = await supabase
        .from('users')
        .update({ plan_id: subscription.price_id })
        .eq('customer_id', subscription.customer_id);

      if (userError) console.error("Failed to update user plan:", userError);
    }
    if (eventData.eventType === EventName.SubscriptionCanceled) {
      const { error: userError } = await supabase
        .from('users')
        .update({ plan_id: tiers[0].priceId.month })
        .eq('customer_id', subscription.customer_id);

      if (userError) console.error("Failed to update user plan:", userError);
    }

  }

  private async handleCustomerData(
    eventData: CustomerCreatedEvent | CustomerUpdatedEvent
  ) {
    const supabase = await createClient();

    if (eventData.data.email) {
      // Link Paddle customer to user by email
      const { error } = await supabase
        .from('users')
        .update({ customer_id: eventData.data.id })
        .eq('email', eventData.data.email);

      if (error) {
        console.error("Failed to update user with customer_id:", error);
      }
    } else {
      // Optional: ensure customers are tracked even if no email present
      const { error } = await supabase
        .from('customers')
        .upsert(
          {
            customer_id: eventData.data.id,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'customer_id' }
        );

      if (error) console.error("Failed to upsert customer:", error);
    }
  }
}
