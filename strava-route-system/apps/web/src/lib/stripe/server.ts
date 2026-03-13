import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** 延遲初始化，避免 build 時因未設定 env 而失敗 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY 未設定");
    _stripe = new Stripe(secretKey, { typescript: true });
  }
  return _stripe;
}

/** @deprecated 請改用 getStripe()，保留以相容既有程式碼 */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (typeof prop === "symbol") return undefined;
    return (getStripe() as unknown as Record<string, unknown>)[prop];
  },
});
