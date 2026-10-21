import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { base44Call, googleIdentity, sameOrigin } from "@/lib/server/base44";
import { createCheckoutCoordinator, redisCommandFromEnv } from "@/lib/server/checkout-coordinator.mjs";
import { canonicalCheckoutPayload } from "@/lib/server/checkout-payload.mjs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  // Do not enable until provisioning webhook is deployed and acceptance tested.
  if (process.env.STRIPE_CHECKOUT_TEST_ENABLED !== "true" || process.env.VERCEL_ENV !== "preview") return NextResponse.json({ error: "CHECKOUT_NOT_READY" }, { status: 503 });
  try {
    const identity = await googleIdentity(req);
    const body = await req.json();
    if (typeof body.organization_id !== "string") return NextResponse.json({ error: "INVALID_ORGANIZATION" }, { status: 400 });
    const result = await base44Call("resolveUserOrganizations", { google_id_token: identity.idToken });
    if (result.user?.google_sub !== identity.sub || !Array.isArray(result.organizations)) throw Error("BASE44_UNAVAILABLE");
    const org = result.organizations.find((o: any) => o.id === body.organization_id && ["owner", "admin"].includes(o.role));
    if (!org) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    // Strictly permit first subscriptions only. Recovery/resubscription needs a separate flow.
    if (org.subscription_status !== "none" || org.can_checkout !== true) return NextResponse.json({ error: "ALREADY_SUBSCRIBED" }, { status: 409 });
    const key = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!key?.startsWith("sk_test_") || !priceId || !process.env.NEXTAUTH_URL) throw Error("CONFIGURATION_REQUIRED");
    const stripe = new Stripe(key);
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.livemode || price.type !== "recurring" || price.recurring?.interval !== "month" || price.recurring.interval_count !== 1 || price.unit_amount === null || price.billing_scheme !== "per_unit") throw Error("INVALID_PRICE");
    const command = redisCommandFromEnv();
    const coordinator = createCheckoutCoordinator(command);
    const attempt = await coordinator.reserve(org.id, identity.sub);
    if (Date.now() - attempt.createdAt > 20 * 60 * 60 * 1000) throw Error("RECONCILIATION_REQUIRED");
    const origin = new URL(process.env.NEXTAUTH_URL).origin;
    const payload = await canonicalCheckoutPayload(command, attempt, {
      mode: "subscription",
      client_reference_id: org.id,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: "always",
      payment_method_types: ["card"],
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      metadata: { org_id: org.id, reservation_id: attempt.id },
      subscription_data: { trial_period_days: 30, metadata: { org_id: org.id, reservation_id: attempt.id } },
      expires_at: Math.floor(attempt.createdAt / 1000) + 1800,
      success_url: `${origin}/subscribe?checkout=returned`,
      cancel_url: `${origin}/subscribe?checkout=canceled`,
    });
    const session = attempt.sessionId
      ? await stripe.checkout.sessions.retrieve(attempt.sessionId)
      : await stripe.checkout.sessions.create(payload, { idempotencyKey: attempt.idempotencyKey });
    if (session.livemode || session.client_reference_id !== org.id || session.metadata?.reservation_id !== attempt.id) throw Error("STRIPE_SESSION_MISMATCH");
    await coordinator.attach(org.id, attempt.id, session.id);
    if (session.status !== "open" || !session.url) throw Error("RECONCILIATION_REQUIRED");
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKOUT_UNAVAILABLE";
    const allowed = ["SIGN_IN_REQUIRED", "CHECKOUT_LOCKED", "RECONCILIATION_REQUIRED"];
    return NextResponse.json({ error: allowed.includes(code) ? code : "CHECKOUT_UNAVAILABLE" }, { status: code === "SIGN_IN_REQUIRED" ? 401 : allowed.includes(code) ? 409 : 503 });
  }
}
