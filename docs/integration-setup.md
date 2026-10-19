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
