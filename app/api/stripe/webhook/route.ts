import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { redisCommandFromEnv } from "@/lib/server/checkout-coordinator.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const reply = (code: string, status: number) => NextResponse.json({ code }, { status });
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (process.env.VERCEL_ENV !== "preview" || !key?.startsWith("sk_test_") || !secret) return reply("TEST_CONFIGURATION_REQUIRED", 503);
  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    const body = await req.text();
    if (body.length > 1048576) return reply("PAYLOAD_TOO_LARGE", 413);
    event = stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature") || "", secret);
  } catch { return reply("INVALID_SIGNATURE", 400); }
  if (event.livemode) return reply("LIVE_EVENTS_NOT_ALLOWED", 400);
  if (process.env.STRIPE_WEBHOOK_TEST_ENABLED !== "true") return reply("PROVISIONING_NOT_ENABLED", 503);
  const supported = ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "customer.subscription.trial_will_end", "invoice.paid", "invoice.payment_failed", "checkout.session.completed", "checkout.session.expired"];
  if (!supported.includes(event.type)) return reply("IGNORED", 200);
  let lock: string | undefined;
  const owner = crypto.randomUUID();
  let acquired = false, writeStarted = false, done = false;
  const redis = redisCommandFromEnv();
  try {
    const object = event.data.object as any;
    const reference = event.type.startsWith("customer.subscription.") ? object.id : event.type.startsWith("checkout.session.") ? object.subscription : object.parent?.subscription_details?.subscription ?? object.subscription;
    const id = typeof reference === "string" ? reference : reference?.id;
    if (!id) return reply("NO_SUBSCRIPTION", 200);
    let sub = await stripe.subscriptions.retrieve(id);
    const orgId = sub.metadata.org_id;
    const allowed = new Set((process.env.STRIPE_TEST_ORGANIZATION_IDS || "").split(",").map(s => s.trim()).filter(Boolean));
    if (!orgId || !allowed.has(orgId)) return reply("TEST_ORGANIZATION_NOT_ALLOWED", 403);
    lock = `trucky:webhook:vercel:test:org:${orgId}`;
    acquired = await redis(["SET", lock, owner, "NX"]) === "OK";
    if (!acquired) return reply("RECONCILIATION_BUSY", 503);
    const processed = `trucky:webhook:vercel:test:event:${event.id}`;
    if (await redis(["GET", processed])) { done = true; return reply("ALREADY_PROCESSED", 200); }
    sub = await stripe.subscriptions.retrieve(id);
    if (sub.livemode || sub.metadata.org_id !== orgId) throw Error();
    const serverSecret = process.env.TRUCKY_SERVER_SECRET;
    if (!serverSecret) throw Error();
    writeStarted = true;
    const result = await fetch("https://trucky-17a283d5.base44.app/api/functions/syncBillingSubscription", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${serverSecret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ organization_id: orgId, subscription_id: sub.id }),
    });
    if (!result.ok || (await result.json()).code !== "SUBSCRIPTION_RECONCILED") throw Error();
    await redis(["SET", processed, sub.id]);
    done = true;
    return reply("SUBSCRIPTION_RECONCILED", 200);
  } catch { return reply("RECONCILIATION_REQUIRED", 503); }
  finally {
    // Uncertain writes retain their lock; operator reconciliation is required.
    if (acquired && lock && (!writeStarted || done)) {
      try { await redis(["EVAL", "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", "1", lock, owner]); } catch {}
    }
  }
}
