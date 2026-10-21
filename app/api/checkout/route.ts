import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { base44Call, googleIdentity, sameOrigin } from "@/lib/server/base44";
import { createCheckoutCoordinator, redisCommandFromEnv } from "@/lib/server/checkout-coordinator.mjs";
import { canonicalCheckoutPayload, recoverRejectedPayload } from "@/lib/server/checkout-payload.mjs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  // Do not enable until provisioning webhook is deployed and acceptance tested.
  if (process.env.STRIPE_CHECKOUT_TEST_ENABLED !== "true" || process.env.VERCEL_ENV !== "preview") return NextResponse.json({ error: "CHECKOUT_NOT_READY" }, { status: 503 });
  let stage = "identity";
  try {
    const identity = await googleIdentity(req);
    const body = await req.json();
    if (typeof body.organization_id !== "string") return NextResponse.json({ error: "INVALID_ORGANIZATION" }, { status: 400 });
    const allowedTestOrganizations = new Set((process.env.STRIPE_TEST_ORGANIZATION_IDS || "")
      .split(",").map(value => value.trim()).filter(Boolean));
    if (!allowedTestOrganizations.has(body.organization_id)) return NextResponse.json({ error: "TEST_ORGANIZATION_NOT_ALLOWED" }, { status: 403 });
    stage = "base44";
    const result = await base44Call("resolveUserOrganizations", { google_id_token: identity.idToken });
    if (result.user?.google_sub !== identity.sub || !Array.isArray(result.organizations)) throw Error("BASE44_UNAVAILABLE");
    const org = result.organizations.find((o: any) => o.id === body.organization_id && ["owner", "admin"].includes(o.role));
    if (!org) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    // Strictly permit first subscriptions only. Recovery/resubscription needs a separate flow.
    if (org.subscription_status !== "none" || org.can_checkout !== true) return NextResponse.json({ error: "ALREADY_SUBSCRIBED" }, { status: 409 });
    stage = "configuration";
    const key = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!key?.startsWith("sk_test_") || !priceId || !process.env.NEXTAUTH_URL) throw Error("CONFIGURATION_REQUIRED");
    const stripe = new Stripe(key);
    stage = "stripe_price";
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.livemode || price.type !== "recurring" || price.recurring?.interval !== "month" || price.recurring.interval_count !== 1 || price.unit_amount === null || price.billing_scheme !== "per_unit") throw Error("INVALID_PRICE");
    stage = "redis_reserve";
    const command = redisCommandFromEnv();
    const coordinator = createCheckoutCoordinator(command);
    const attempt = await coordinator.reserve(org.id, identity.sub);
    if (Date.now() - attempt.createdAt > 20 * 60 * 60 * 1000) throw Error("RECONCILIATION_REQUIRED");
    const origin = new URL(process.env.NEXTAUTH_URL).origin;
    stage = "redis_payload";
    const payload = await canonicalCheckoutPayload(command, attempt, {
      mode: "subscription",
      client_reference_id: org.id,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: "always",
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      metadata: { org_id: org.id, reservation_id: attempt.id },
      subscription_data: { trial_period_days: 30, metadata: { org_id: org.id, reservation_id: attempt.id } },
      expires_at: Math.floor(attempt.createdAt / 1000) + 1800,
      success_url: `${origin}/subscribe?checkout=returned`,
      cancel_url: `${origin}/subscribe?checkout=canceled`,
    });
    let supportedPayload = payload;
    let idempotencyKey = attempt.idempotencyKey;
    if (Object.hasOwn(payload, "payment_method_types") && !attempt.sessionId) {
      stage = "audited_recovery";
      const recovery = await recoverRejectedPayload(command, attempt, payload,
        process.env.STRIPE_AUDITED_REJECTED_ATTEMPT_ID);
      supportedPayload = recovery.payload;
      idempotencyKey = recovery.idempotencyKey;
    }
    stage = "stripe_session";
    const session = attempt.sessionId
      ? await stripe.checkout.sessions.retrieve(attempt.sessionId)
      : await stripe.checkout.sessions.create(supportedPayload, { idempotencyKey });
    if (session.livemode || session.client_reference_id !== org.id || session.metadata?.reservation_id !== attempt.id) throw Error("STRIPE_SESSION_MISMATCH");
    stage = "redis_attach";
    await coordinator.attach(org.id, attempt.id, session.id);
    if (session.status !== "open" || !session.url) throw Error("RECONCILIATION_REQUIRED");
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKOUT_UNAVAILABLE";
    // Whitelist diagnostics only: never log SDK messages, URLs, tokens or payloads.
    const sdk = error as { type?: string; code?: string; statusCode?: number; requestId?: string };
    const safe = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : undefined;
    console.error("checkout_failure", { stage, category: safe(code), type: safe(sdk.type), code: safe(sdk.code), status: typeof sdk.statusCode === "number" ? sdk.statusCode : undefined, stripeRequestId: safe(sdk.requestId) });
    const allowed = ["SIGN_IN_REQUIRED", "CHECKOUT_LOCKED", "RECONCILIATION_REQUIRED"];
    return NextResponse.json({ error: allowed.includes(code) ? code : "CHECKOUT_UNAVAILABLE" }, { status: code === "SIGN_IN_REQUIRED" ? 401 : allowed.includes(code) ? 409 : 503 });
  }
}
