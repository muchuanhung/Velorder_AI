/**
 * Stripe Price ID 對應 planId
 * 於 Stripe Dashboard 建立產品與價格
 * STRIPE_PRICE_DAY：0 元方案，供 mock 測試用
 */
export type PlanId = "day" | "monthly" | "yearly";

const PRICE_DAY = process.env.STRIPE_PRICE_DAY ?? "";
const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? "";
const PRICE_YEARLY = process.env.STRIPE_PRICE_YEARLY ?? "";

export function getPriceId(planId: PlanId): string | null {
  const id =
    planId === "day"
      ? PRICE_DAY
      : planId === "monthly"
        ? PRICE_MONTHLY
        : PRICE_YEARLY;
  return id || null;
}
