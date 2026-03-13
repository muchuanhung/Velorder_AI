/**
 * GET /api/stripe/subscription
 * 取得當前使用者的 Pro 訂閱狀態
 * 若 Firestore 缺少 currentPeriodEnd 但有 stripeSubscriptionId，會從 Stripe 拉取並更新
 */

import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import {
  getSubscriptionFirestore,
  isActiveSubscription,
  upsertSubscriptionFirestore,
} from "@/lib/background/subscription.firestore";
import { stripe } from "@/lib/stripe/server";

export async function GET(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth?.uid) {
      return NextResponse.json({ isPro: false, currentPeriodEnd: null }, { status: 200 });
    }

    let sub = await getSubscriptionFirestore(auth.uid);

    // 缺少 currentPeriodEnd 時從 Stripe 拉取並更新 Firestore
    if (
      sub?.stripeSubscriptionId &&
      !sub.currentPeriodEnd &&
      sub.status === "active"
    ) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(
          sub.stripeSubscriptionId
        );
        // Stripe API: current_period_end 在 SubscriptionItem 上，非 Subscription 頂層
        const firstItem = stripeSub.items?.data?.[0];
        const periodEnd =
          (firstItem as { current_period_end?: number } | undefined)
            ?.current_period_end;
        if (periodEnd) {
          await upsertSubscriptionFirestore(auth.uid, {
            status: "active",
            stripeSubscriptionId: sub.stripeSubscriptionId,
            stripeCustomerId: sub.stripeCustomerId,
            priceId: sub.priceId,
            currentPeriodEnd: periodEnd,
          });
          sub = { ...sub, currentPeriodEnd: periodEnd };
        }
      } catch {
        // 略過，回傳既有資料
      }
    }

    const isPro = isActiveSubscription(sub);

    return NextResponse.json({
      isPro,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    });
  } catch (err) {
    console.error("取得訂閱狀態失敗", err);
    return NextResponse.json({ isPro: false, currentPeriodEnd: null }, { status: 200 });
  }
}
