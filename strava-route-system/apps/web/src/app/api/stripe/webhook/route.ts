/**
 * Stripe Webhook
 * 處理 checkout.session.completed、invoice.payment_succeeded、customer.subscription.* 等事件
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import {
  upsertSubscriptionFirestore,
  type SubscriptionRecord,
} from "@/lib/background/subscription.firestore";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET 未設定，webhook 將回傳 500");
}

async function upsertFromSubscription(sub: Stripe.Subscription): Promise<boolean> {
  const userId = sub.metadata?.userId as string | undefined;
  if (!userId) {
    console.warn("[webhook] subscription 無 metadata.userId", sub.id);
    return false;
  }
  const priceId =
    typeof sub.items.data[0]?.price?.id === "string"
      ? sub.items.data[0].price.id
      : undefined;
  const firstItem = sub.items?.data?.[0];
  const periodEnd = (firstItem as { current_period_end?: number })?.current_period_end;
  await upsertSubscriptionFirestore(userId, {
    status: sub.status === "active" ? "active" : "canceled",
    stripeSubscriptionId: sub.id,
    priceId,
    currentPeriodEnd: periodEnd,
  });
  return true;
}

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook 未設定" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "缺少 stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "簽名驗證失敗";
    console.error("Stripe webhook 簽名驗證失敗", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId as string | undefined;
        if (!userId) {
          console.warn("[webhook] checkout.session.completed 無 userId metadata");
          break;
        }
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subData: Omit<SubscriptionRecord, "userId" | "updatedAt"> = {
          status: "active",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subId,
        };
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            subData.priceId =
              typeof sub.items.data[0]?.price?.id === "string"
                ? sub.items.data[0].price.id
                : undefined;
            const item = sub.items?.data?.[0];
            subData.currentPeriodEnd = (item as { current_period_end?: number })?.current_period_end;
          } catch (e) {
            console.warn("[webhook] stripe.subscriptions.retrieve 失敗", subId, e);
          }
        }
        await upsertSubscriptionFirestore(userId, subData);
        console.log("[webhook] checkout.session.completed 已寫入 Firestore", userId);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertFromSubscription(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId as string | undefined;
        if (!userId) break;
        const item = sub.items?.data?.[0];
        const periodEnd = (item as { current_period_end?: number })?.current_period_end;
        await upsertSubscriptionFirestore(userId, {
          status: "canceled",
          stripeSubscriptionId: sub.id,
          currentPeriodEnd: periodEnd,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id?: string } };
        if (invoice.billing_reason !== "subscription_create") break;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subId) break;
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertFromSubscription(sub);
          console.log("[webhook] invoice.payment_succeeded 已寫入 Firestore", sub.metadata?.userId);
        } catch (e) {
          console.error("[webhook] invoice.payment_succeeded 處理失敗", subId, e);
          throw e;
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[webhook] 處理失敗", {
      eventType: event.type,
      eventId: event.id,
      message: msg,
      stack,
    });
    return NextResponse.json(
      { error: "Webhook 處理失敗", eventType: event.type },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
