/**
 * POST /api/stripe/sync-session
 * 從 Stripe 取得 checkout session 並寫入 Firestore（webhook 失敗時的 fallback）
 * Body: { sessionId: string }
 */

import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/server";
import { upsertSubscriptionFirestore } from "@/lib/background/subscription.firestore";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth?.uid) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = body?.sessionId as string | undefined;
    if (!sessionId?.startsWith("cs_")) {
      return NextResponse.json(
        { error: "無效的 session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json(
        { error: "該結帳尚未完成" },
        { status: 400 }
      );
    }

    const userId = session.metadata?.userId as string | undefined;
    if (!userId || userId !== auth.uid) {
      return NextResponse.json(
        { error: "session 與當前使用者不符" },
        { status: 403 }
      );
    }

    const subExpanded = session.subscription;
    const subId =
      typeof subExpanded === "string"
        ? subExpanded
        : (subExpanded as { id?: string })?.id;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    let currentPeriodEnd: number | undefined;
    let priceId: string | undefined;
    if (subExpanded && typeof subExpanded === "object") {
      const sub = subExpanded as { items?: { data?: Array<{ current_period_end?: number; price?: { id?: string } }> } };
      const item = sub.items?.data?.[0];
      currentPeriodEnd = item?.current_period_end;
      priceId = typeof item?.price?.id === "string" ? item.price.id : undefined;
    } else if (subId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subId);
        const item = sub.items?.data?.[0];
        currentPeriodEnd = (item as { current_period_end?: number })?.current_period_end;
        priceId =
          typeof sub.items.data[0]?.price?.id === "string"
            ? sub.items.data[0].price.id
            : undefined;
      } catch {
        // 略過
      }
    }

    await upsertSubscriptionFirestore(auth.uid, {
      status: "active",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subId,
      priceId,
      currentPeriodEnd,
    });

    return NextResponse.json({ success: true, isPro: true });
  } catch (err) {
    console.error("sync-session 失敗", err);
    const message = err instanceof Error ? err.message : "同步失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
