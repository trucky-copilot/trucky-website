# Google and Stripe — staging only

This stage adds Google login and a single monthly plan fetched from Stripe test mode. It does NOT create subscriptions, start trials, charge cards or provision Base44 access. Checkout remains unavailable until durable subscription storage, duplicate prevention and signed idempotent webhooks are implemented against an agreed provisioning API.

## Preview configuration
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET: Google web OAuth credentials (server only).
- NEXTAUTH_SECRET: independently generated random secret (at least 32 random bytes); store as Sensitive. Never use the Google secret as this value.
- NEXTAUTH_URL: stable HTTPS preview origin; do not use the existing production domain during testing.
- STRIPE_SECRET_KEY: test secret only. Live keys are intentionally rejected at this stage.
- STRIPE_PRICE_ID: active fixed recurring monthly test price. Public display reads its actual amount/currency from Stripe; no fallback price.

In Google Clients, register exactly `${NEXTAUTH_URL}/api/auth/callback/google` as an authorized redirect URI (substitute the actual origin; no trailing slash). Add test users under Audience while OAuth remains in Testing. Configure a stable preview domain rather than registering each commit URL. Google login requests only openid, email and profile; verified Google emails are required. Session JWT cookies are managed by NextAuth; no access tokens are put in URLs or localStorage by this application.

## Manual acceptance (pending)
1. Missing config must not show a made-up price or permit checkout.
2. Verified Google test user signs in, persists session and signs out.
3. Price matches Stripe test catalog; failed price lookup shows error.
4. Existing landing presentation and language toggle remain usable on mobile.
5. Current production domain is unchanged.

## Before any checkout activation
Agree whether Base44 entitlement is per User or Organization and obtain a supported server-side provisioning contract. Store stable Google subject/customer/subscription mapping with transactional uniqueness, reserve a trial once, use 30 trial days and require a card, collect billing address/name/tax data as applicable, verify raw-body webhook signatures and deduplicate event IDs durably. Handle trialing, paid renewals, failures, cancellation and out-of-order events. A success redirect alone must never grant access. No short placeholder endpoint should acknowledge successful provisioning.

## Redis coordinator (implemented, not wired to checkout)
`lib/server/checkout-coordinator.mjs` reads provider-managed `KV_REST_API_URL` and `KV_REST_API_TOKEN`. It reserves with atomic SET NX, and attaches/releases using owner-checked Lua scripts. No credential is exposed to the browser. Keys are test-namespaced. A pending attempt deliberately has no automatic expiration: otherwise an old open checkout or unknown create result could coexist with a new purchase. Release requires a server-retrieved expired test session. Complete/open/unknown outcomes remain blocked.

Retries by the same authorized Google subject reuse the original attempt. Other actors are blocked. Unknown creates must be recovered using the original Stripe request and idempotency key; after Stripe's idempotency retention window, DO NOT blindly repeat create: manual/durable reconciliation is required. Keep the full canonical Stripe creation payload stable (including absolute expiration time) in the eventual integration. This coordinator is not an entitlement database and does not grant access.

Remaining work: server-side Google token retrieval with expiration handling, Base44 organization APIs and UI, immutable canonical checkout request persistence and Stripe creation/recovery, webhook and entitlement reconciliation, secure legacy-account linking. Never generate account-claim signatures based solely on email. All checkout creation paths must use this coordinator; old bypass paths must remain disabled.

Local checks: `node --test tests/checkout-coordinator.test.mjs`. Tests use an atomic command model, not a live Redis instance; actual Redis/Lua, Base44, OAuth and Stripe end-to-end acceptance remains pending. Do not enable purchase buttons yet.

## Organization connection (implemented, gated)
The web now has `/subscribe` and server-only `/api/organizations`. Google ID tokens remain in encrypted HttpOnly session JWTs and are not included in the public session response. Expired credentials require Google sign-in again; no refresh token is requested or stored. POST uses exact-origin checks; all organization operations require a valid server session and server-to-server secret. Responses omit tokens and secrets.

Deploy the backend identity fix PR before setting `BASE44_ORGANIZATIONS_ENABLED=true` for Preview. Keep this flag unset until testing the backend. Existing memberships without verified Google sub will not be auto-linked. Organization creation still requires durable concurrency/rate limiting and recovery if membership creation fails; this phase is not production-ready. Review Base44 OrganizationMember RLS before accepting memberships for billing: the existing client create rule is email-based, not a server-only billing role assignment policy.

Checks: build, separate tsc, `node --test tests/*.test.mjs` (HTTP suite requires built output). OAuth exchange and actual Base44 requests are not tested locally. Checkout and webhook remain unimplemented/disabled; no URL for a webhook should be registered yet.

## Test checkout endpoint (implemented, disabled)
POST /api/checkout now authorizes the organization server-side, verifies test monthly price and reserves through Redis. Full creation parameters are SET NX persisted before Stripe is called; retries use the same payload/idempotency key. Card, billing address, tax ID collection and 30-day trial are configured. Price amount is never hardcoded. Session metadata includes org_id and reservation_id on both checkout and subscription. User email is collected by Checkout rather than trusted from request. No redirect grants access.

Endpoint is gated by STRIPE_CHECKOUT_TEST_ENABLED=true AND VERCEL_ENV=preview. DO NOT set this flag yet: provisioning webhook, RLS audit, live Redis acceptance and subscription recovery remain pending. Frontend button remains disabled. Attempts older than 20 hours require reconciliation (no blind create after Stripe idempotency retention). Completed or expired sessions do not create a new attempt. Missing/unknown session outcomes remain reserved. This phase intentionally does not call Base44's unsafe reserve implementation.
