# Billing (Paddle)

How a Paddle subscription turns into the user's plan. Code: [`src/utils/paddle/process-webhook.ts`](../../src/utils/paddle/process-webhook.ts), route `src/app/api/paddle/route.ts`.

## Checkout

`createCheckout` ([`src/lib/paddle/checkout.ts`](../../src/lib/paddle/checkout.ts)) creates the Paddle transaction on the server, pinned to the signed-in user's Paddle customer and carrying their signed user id in `customData`. The browser only opens it. Webhooks tie events to a user through the linked customer or that signature ([`resolve-user.ts`](../../src/lib/paddle/resolve-user.ts)), never by email.

## Plan changes

A plan change is a **new checkout**, so for a moment the user has two subscriptions.

1. `subscription.activated` for the new one sets `users.plan_id` to its price, then cancels every other active subscription of that customer through the Paddle API.
2. The old subscription's `subscription.canceled` arrives afterwards. It changes nothing, because the new subscription is still live.

No email is sent for a plan change.

## Cancellation

`subscription.canceled` is decided by [`cancelDecision`](../../src/lib/paddle/downgrade.ts), looking at the customer's other subscriptions and the user's `plan_id`:

| Situation | Result |
|---|---|
| Another subscription of the customer is not `canceled` | Nothing changes (plan change, re-subscribe) |
| Nothing else is live, and the canceled price is the user's `plan_id` | Downgrade to Starter (`tiers[0]`) and email |
| Nothing else is live, but `plan_id` is a different price | Nothing changes; Sentry warning "Paddle cancel left the user on a plan no live subscription pays for". Support checks the account |

The downgrade runs `applyPlanDowngrade`, which takes catalogues over the Starter quota offline and clears analytics tags. After the transaction commits, the changed catalogues are revalidated and `CancellationEmail` is sent, listing the catalogues that went offline.

## Not handled

- `subscription.trialing` and `subscription.resumed` are not routed by `processEvent`.
- A price change inside an existing subscription (`subscription.updated` with a new price) does not update `plan_id`. The app's own checkout never does this; a change made from the Paddle side would, and a later cancel of that subscription lands in the "different price" row above.
- `cancelSubscription` returns an error instead of throwing, and the webhook does not check it, so a failed cancel of the old subscription after a plan change goes unnoticed.
