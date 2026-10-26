import Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripeMode } from "@/lib/server/stripe-mode.mjs";
export const dynamic = "force-dynamic";
export async function GET() {
  const key = process.env.STRIPE_MODE === "live" ? process.env.STRIPE_LIVE_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
  const id = process.env.STRIPE_PRICE_ID;
  if (!key || !id) return NextResponse.json({ error: "Plan de prueba no configurado" }, { status: 503 });
  try {
    const {live} = stripeMode();
    const price = await new Stripe(key).prices.retrieve(id);
    if (price.livemode !== live || !price.active || price.type !== "recurring" || price.recurring?.interval !== "month" || price.recurring.interval_count !== 1 || price.unit_amount === null || price.billing_scheme !== "per_unit") {
      return NextResponse.json({ error: "El plan debe tener precio mensual fijo" }, { status: 503 });
    }
    return NextResponse.json({ amount: price.unit_amount / 100, currency: price.currency, trialDays: 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "No fue posible consultar el plan" }, { status: 503 }); }
}
