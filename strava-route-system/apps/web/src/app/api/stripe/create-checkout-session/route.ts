/**
 * POST /api/stripe/create-checkout-session
 * 建立 Stripe Checkout Session，回傳導向 URL
 *
 * 1. getAuthFromRequest 取得 uid，未登入 → 401
 * 2. 依 planId 取得 Stripe Price ID
 * 3. 建立 checkout session，metadata 帶 userId
 * 4. 回傳 { url } 供前端導向
 */

import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/server";
import { getPriceId, type PlanId } from "@/lib/stripe/prices";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth?.uid) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = (body?.planId ?? "day") as PlanId;
    const validPlans: PlanId[] = ["day", "monthly", "yearly"];
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: "無效的方案" },
        { status: 400 }
      );
    }

    const priceId = getPriceId(planId);
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "尚未設定 Stripe 價格，請設定 STRIPE_PRICE_DAY（0 元）/ STRIPE_PRICE_MONTHLY（NT$50/月）/ STRIPE_PRICE_YEARLY（NT$500/年）",
        },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") ?? request.headers.get("referer")?.replace(/\/$/, "") ?? baseUrl;
    const successUrl = `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/billing/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: auth.uid },
      subscription_data: { metadata: { userId: auth.uid } },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "無法建立結帳連結" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe create-checkout-session 失敗", err);
    const message = err instanceof Error ? err.message : "建立結帳失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
