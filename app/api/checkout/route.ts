import {takeAuditedTaxLock,correctedTaxPayload} from '@/lib/server/customer-tax-recovery.mjs';
import {academyProfile,prepareNativeAcademy,replaceLegacyAcademySession} from '@/lib/server/academy-native.mjs';
import {resolveCheckoutTarget} from '@/lib/server/checkout-target.mjs';
import { getToken } from 'next-auth/jwt';
import {parallelCheckoutChecks,CheckoutCheckFailure} from '@/lib/server/checkout-read-checks.mjs';
import {cachedLivePricePreflight} from '@/lib/server/live-price-preflight.mjs';
import {testCheckoutEligible} from '@/lib/server/test-checkout-eligibility.mjs';
import {verifyLiveCheckoutEligibility,expectedLivePrice,assertNoExistingLiveSubscription} from '@/lib/server/live-checkout-pilot.mjs';
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { base44Call, googleIdentity, sameOrigin } from "@/lib/server/base44";
import { createCheckoutCoordinator, redisCommandFromEnv } from "@/lib/server/checkout-coordinator.mjs";
import { canonicalCheckoutPayload, recoverRejectedPayload } from "@/lib/server/checkout-payload.mjs";
import { replaceUnconfirmedPlan } from "@/lib/server/change-checkout-plan.mjs";
import { stripeMode } from "@/lib/server/stripe-mode.mjs";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  // Do not enable until provisioning webhook is deployed and acceptance tested.
  if ((process.env.STRIPE_MODE === "live" ? process.env.STRIPE_LIVE_PAYMENTS_ENABLED !== "true" : process.env.STRIPE_CHECKOUT_TEST_ENABLED !== "true") || (process.env.VERCEL_ENV !== "production" && process.env.VERCEL_ENV !== "preview")) return NextResponse.json({ error: "CHECKOUT_NOT_READY" }, { status: 503 });
  let stage = "identity";
  let mutationKey: string | undefined;
  let redis: ReturnType<typeof redisCommandFromEnv> | undefined;
  let outcomeCertain = true;
  const owner = crypto.randomUUID();
  try {
    const identity = await googleIdentity(req);
    const body = await req.json();
    if (!body || !["owner_op","fleet"].includes(body.plan)) return NextResponse.json({error:"PLAN_REQUIRED"},{status:400});
    if (body.organization_id !== undefined && typeof body.organization_id !== "string") return NextResponse.json({ error: "INVALID_ORGANIZATION" }, { status: 400 });
    const allowedTestOrganizations = new Set((process.env.STRIPE_TEST_ORGANIZATION_IDS || "")
      .split(",").map(value => value.trim()).filter(Boolean));
    const {mode,live} = stripeMode();
    const publicDemo = process.env.PUBLIC_TEST_DEMO_ENABLED === "true";
    stage = "base44";
    const authSession=body.organization_id===undefined?await getToken({req,secret:process.env.NEXTAUTH_SECRET}):null;
    const target=await resolveCheckoutTarget({requested:body.organization_id,sub:identity.sub,idToken:identity.idToken,live,
      creationEnabled:live?process.env.BILLING_PUBLIC_ENROLLMENT_ENABLED==='true':publicDemo,
      name:authSession?.name},base44Call);
    if(target.choices)return NextResponse.json({error:'ORGANIZATION_SELECTION_REQUIRED',organizations:target.choices},{status:409,headers:{'Cache-Control':'no-store'}});
    const {org,result}=target;
    if (!org) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (!live && !testCheckoutEligible(org,allowedTestOrganizations,publicDemo)) return NextResponse.json({ error: "DEMO_ORGANIZATION_REQUIRED" }, { status: 403 });
    if(live){
      // Base44's fresh eligibility call below owns company authorization.
      if(result.mode!=='live')throw Error('LIVE_BACKEND_NOT_READY');
    }
    // Strictly permit first subscriptions only. Recovery/resubscription needs a separate flow.
    if (org.subscription_status !== "none" || org.can_checkout !== true) return NextResponse.json({ error: "ALREADY_SUBSCRIBED" }, { status: 409 });
    stage = "configuration";
    const key = live ? process.env.STRIPE_LIVE_SECRET_KEY : process.env.STRIPE_SECRET_KEY;
    const plan = body.plan;
    if (plan !== "owner_op" && plan !== "fleet") return NextResponse.json({ error: "PLAN_REQUIRED" }, { status: 400 });
    const priceId = live ? (plan === "owner_op" ? process.env.STRIPE_LIVE_PRICE_OWNER_OP : process.env.STRIPE_LIVE_PRICE_FLEET) : (plan === "owner_op" ? process.env.STRIPE_PRICE_OWNER_OP : process.env.STRIPE_PRICE_FLEET);
    if (!key || !priceId || !process.env.NEXTAUTH_URL) throw Error("CONFIGURATION_REQUIRED");
    const stripe = new Stripe(key);
    stage = "redis_reserve";
    const command = redisCommandFromEnv();
    redis = command;
    const candidateMutationKey = `trucky:checkout:${mode}:mutation:${org.id}`;
    if (await command(["SET", candidateMutationKey, owner, "NX"]) !== "OK") {
      if(!await takeAuditedTaxLock(command,stripe,{orgId:org.id,sub:identity.sub,owner,mode}))throw Error("CHECKOUT_LOCKED");
    }
    mutationKey = candidateMutationKey;
    // One fresh eligibility check INSIDE the mutation lock, concurrent with
    // independent static/Stripe reads. Never cache tenant authorization.
    const checked = await parallelCheckoutChecks({
      eligibility: {stage:'live_checkout_eligibility',run:async()=>{
        if(live)await verifyLiveCheckoutEligibility(identity.sub,org.id,{enrollmentValidated:org.billing_public_enrollment===true});
      }},
      subscription: {stage:'live_existing_subscription',run:async()=>{
        if(live)await assertNoExistingLiveSubscription(stripe,org.id);
      }},
      preflight: {stage:'live_backend_preflight',run:async()=>{
        if(!live)return;
        const serverSecret=process.env.TRUCKY_SERVER_SECRET;
        if(!serverSecret)throw Error('CONFIGURATION_REQUIRED');
        await cachedLivePricePreflight({secret:serverSecret,prices:[process.env.STRIPE_LIVE_PRICE_OWNER_OP,process.env.STRIPE_LIVE_PRICE_FLEET]});
      }},
      pricing: {stage:'stripe_price',run:async()=>{
        const price=await stripe.prices.retrieve(priceId);
        if(!price.active||price.livemode!==live||price.type!=='recurring'||price.recurring?.interval!=='month'||price.recurring.interval_count!==1||price.unit_amount===null||price.billing_scheme!=='per_unit')throw Error('INVALID_PRICE');
        if(live&&!expectedLivePrice(price,plan))throw Error('INVALID_PRICE');
        return price;
      }},
    });
    const price = checked.pricing;
    // Resolve stable customer/private promotion before touching an existing checkout.
    // A missing API permission must not strand the checkout mutation lock.
    stage='academy_profile';
    const profile=await academyProfile(stripe,command,price,identity.sub,{live,plan});
    const coordinator = createCheckoutCoordinator(command, `trucky:checkout:${mode}:v1`, live);
    let attempt = await coordinator.reserve(org.id, identity.sub);
    stage = "stripe_previous_session";
    // All checkout creation/replacement requests share the persistent mutation lock.
    // Retain it on uncertain Stripe/Redis writes rather than allowing overlap.
    outcomeCertain = false;
    attempt = await replaceUnconfirmedPlan(stripe, coordinator, org.id, attempt, priceId, identity.sub, live);
    attempt = await replaceLegacyAcademySession(stripe,coordinator,command,org.id,attempt,identity.sub,mode,live&&plan==='owner_op'&&process.env.STRIPE_ACADEMY_ENABLED==='true'&&process.env.STRIPE_ACADEMY_NATIVE_ENABLED==='true');
    if (Date.now() - attempt.createdAt > 20 * 60 * 60 * 1000) throw Error("RECONCILIATION_REQUIRED");
    // Reserve once per verified Google identity, across companies and concurrent requests.
    stage="academy_reservation";
    const nativeOffer=await prepareNativeAcademy(stripe,command,price,identity.sub,org.id,attempt,{profile});
    const academyMetadata:Record<string,string>=nativeOffer.metadata||{};
    const origin = new URL(process.env.NEXTAUTH_URL).origin;
    stage = "redis_payload";
    const payload = await canonicalCheckoutPayload(command, { ...attempt, mode }, {
      mode: "subscription",
      client_reference_id: org.id,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(nativeOffer.customer?{customer:nativeOffer.customer,customer_update:{name:'auto'}}:{}),
      ...(nativeOffer.allow_promotion_codes?{allow_promotion_codes:true}:{}),
      payment_method_collection: "always",
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      custom_fields: [{ key: "company_name", label: { type: "custom", custom: "Nombre de la empresa" }, type: "text", optional: false, text: { maximum_length: 120 } }],
      metadata: { org_id: org.id, reservation_id: attempt.id, ...academyMetadata },
      subscription_data: { metadata: { org_id: org.id, reservation_id: attempt.id, ...academyMetadata } },
      expires_at: Math.floor(attempt.createdAt / 1000) + 1800,
      success_url: `${origin}/subscribe?checkout=returned`,
      cancel_url: `${origin}/#pricing`,
    });
    // Old requests remain immutable. Never create a second session on a mismatch.
    if((payload.discounts||[]).length)throw Error('CHECKOUT_OFFER_CHANGED');
    if(nativeOffer.allow_promotion_codes&&(payload.customer!==nativeOffer.customer||payload.allow_promotion_codes!==true||payload.subscription_data?.metadata?.academy_account!==academyMetadata.academy_account))throw Error('CHECKOUT_OFFER_CHANGED');
    // Cached attempts retain immutable Stripe parameters. Never silently reuse a
    // free-trial request after switching paid plans to immediate billing.
    if (payload.subscription_data?.trial_period_days || payload.subscription_data?.trial_end) throw Error("LEGACY_TRIAL_CHECKOUT_REQUIRES_REVIEW");
    if (payload.line_items?.[0]?.price !== priceId) throw Error("EXISTING_CHECKOUT_DIFFERENT_PLAN");
    let supportedPayload = payload;
    let idempotencyKey = attempt.idempotencyKey;
    if (Object.hasOwn(payload, "payment_method_types") && !attempt.sessionId) {
      stage = "audited_recovery";
      const recovery = await recoverRejectedPayload(command, attempt, payload,
        process.env.STRIPE_AUDITED_REJECTED_ATTEMPT_ID);
      supportedPayload = recovery.payload;
      idempotencyKey = recovery.idempotencyKey;
    }
    if(payload.customer&&payload.tax_id_collection?.enabled&&payload.customer_update?.name!=='auto'&&!attempt.sessionId){
      stage='audited_tax_name_recovery';
      const recovered=await correctedTaxPayload(command,stripe,attempt,payload,{mode});
      if(recovered){supportedPayload=recovered.payload;idempotencyKey=recovered.idempotencyKey;}
    }
    stage = "stripe_session";
    const session = attempt.sessionId
      ? await stripe.checkout.sessions.retrieve(attempt.sessionId)
      : await stripe.checkout.sessions.create(supportedPayload, { idempotencyKey });
    if (session.livemode !== live || session.client_reference_id !== org.id || session.metadata?.reservation_id !== attempt.id) throw Error("STRIPE_SESSION_MISMATCH");
    stage = "redis_attach";
    await coordinator.attach(org.id, attempt.id, session.id);
    if (session.status !== "open" || !session.url) throw Error("RECONCILIATION_REQUIRED");
    outcomeCertain = true;
    return NextResponse.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (caught) {
    let error: unknown = caught;
    // Preserve original Stripe type/code/requestId and failing stage, even when
    // checks ran in parallel. Never log the cause message or request payload.
    while(error instanceof CheckoutCheckFailure){stage=error.stage;error=error.cause;}
    const code = error instanceof Error ? error.message : "CHECKOUT_UNAVAILABLE";
    // Whitelist diagnostics only: never log SDK messages, URLs, tokens or payloads.
    const sdk = error as { type?: string; code?: string; statusCode?: number; requestId?: string };
    const safe = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : undefined;
    console.error("checkout_failure", { stage, category: safe(code), type: safe(sdk.type), code: safe(sdk.code), status: typeof sdk.statusCode === "number" ? sdk.statusCode : undefined, stripeRequestId: safe(sdk.requestId) });
    if (["ALREADY_SUBSCRIBED", "EXISTING_CHECKOUT_DIFFERENT_PLAN", "ACADEMY_ALREADY_USED_OR_PENDING"].includes(code)) outcomeCertain = true;
    const allowed = ["ACADEMY_GLOBAL_CODE_CONFLICT", "ACADEMY_CUSTOMER_REQUIRES_REVIEW", "ACADEMY_PROMOTION_REQUIRES_REVIEW", "INVALID_ACADEMY_CODE", "ACADEMY_PLAN_REQUIRED", "ACADEMY_NOT_READY", "ACADEMY_COUPON_INVALID", "ACADEMY_ALREADY_USED_OR_PENDING", "PUBLIC_SIGNUPS_CLOSED", "CHECKOUT_OFFER_CHANGED", "FIRST_PAYMENT_OFFER_INVALID", "BILLING_ACCOUNT_REVIEW_REQUIRED", "LIVE_IDENTITY_LINK_REQUIRED", "LIVE_PILOT_ONLY", "LIVE_BACKEND_NOT_READY", "LEGACY_TRIAL_CHECKOUT_REQUIRES_REVIEW", "ALREADY_SUBSCRIBED", "EXISTING_CHECKOUT_DIFFERENT_PLAN", "SIGN_IN_REQUIRED", "CHECKOUT_LOCKED", "RECONCILIATION_REQUIRED"];
    return NextResponse.json({ error: allowed.includes(code) ? code : "CHECKOUT_UNAVAILABLE" }, { status: code === "SIGN_IN_REQUIRED" ? 401 : allowed.includes(code) ? 409 : 503 });
  } finally {
    if (mutationKey && redis && outcomeCertain) {
      try { await redis(["EVAL", "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end", "1", mutationKey, owner]); } catch {}
    }
  }
}
