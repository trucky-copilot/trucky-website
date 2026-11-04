# Demo request CRM capture

Server-only HUBSPOT_ACCESS_TOKEN is required in the deployed environment. HubSpot service key scopes: crm.objects.contacts.read and crm.objects.contacts.write. Existing Google session, origin, field validation and quota checks run before CRM writes.

Find contact by exact verified email; PATCH name/phone if present, otherwise create (resolve concurrent 409 by email). The single full-name field is preserved in firstname, not split by assumption. No lifecycle stage, marketing consent, owner or subscription is overwritten. Add an associated timeline note identifying the demo request and time. The note records a request, not a successful trial/email; these subsequent operations keep their existing behavior. No commercial notification/workflow is configured by this code.

A CRM failure prevents this attempt from activating the trial or sending Gmail. Contact may already be saved if note creation fails. CRM_NOT_CONFIGURED: missing token. CRM_NOT_SAVED: provider rejected request. CRM_REQUIRES_REVIEW: unknown network or malformed outcome; inspect provider activity before retrying. No automatic retries of writes or notes. Repeated manual submissions update the same contact but can create additional request notes, each representing a submission. Existing daily quota still applies, including failed requests.

Uses HubSpot contacts and notes REST API version 2026-09, note-to-contact association 202. Errors contain only controlled codes. No token or contact data logged. Preview needs its own token if real CRM testing is desired; production credentials are not copied to Preview.

Acceptance: submit once with an authorized Google test account and valid form; verify exactly one matching contact with name/phone and a demo request note. Confirm trial and email continue. Do not treat mock tests or successful build as evidence of live HubSpot permissions. No changes to Stripe, DNS or Base44 schemas.
