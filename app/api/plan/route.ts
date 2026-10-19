import Stripe from "stripe";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  const id = process.env.STRIPE_PRICE_ID;
  if (!key?.startsWith("sk_test_") || !id) return NextResponse.json({ error: "Plan de prueba no configurado" }, { status: 503 });
  try {
    const price = await new Stripe(key).prices.retrieve(id);
    if (!price.active || price.type !== "recurring" || price.recurring?.interval !== "month" || price.recurring.interval_count !== 1 || price.unit_amount === null || price.billing_scheme !== "per_unit") {
      return NextResponse.json({ error: "El plan debe tener precio mensual fijo" }, { status: 503 });
    }
    return NextResponse.json({ amount: price.unit_amount / 100, currency: price.currency, trialDays: 30 }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "No fue posible consultar el plan" }, { status: 503 }); }
}
