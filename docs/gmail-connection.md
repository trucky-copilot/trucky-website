# Gmail sender connection (not deployed)

Sender: trucky.road.copilot@gmail.com. Existing Google login remains openid/email/profile only. Separate server connect flow requests gmail.send, offline access, explicit consent, PKCE and 10-minute single-use Redis state bound to signed-in sender subject. Callback verifies Google userinfo exact sender email, verified email and subject before storing refresh token encrypted AES-GCM in Redis. No access/refresh token exposed to client/session/logs.

Required protected env: GMAIL_TOKEN_ENCRYPTION_KEY (independent random >=32-byte secret, store in Production/Preview; rotate only with reauthorization), existing Google credentials, NEXTAUTH_SECRET, NEXTAUTH_URL and Redis REST credentials. Google authorized redirect for production: https://trucky.site/api/gmail/callback . Add gmail.send in consent data access; in testing authorize sender as test user. Sensitive scope may require Google verification and testing refresh tokens may expire. No client-secret/token pasted into chat.

After deploying: /admin/gmail -> login as sender -> authorize Gmail. Endpoint never allows a customer account to connect. This PR only prepares connection, not sending/form/plan restoration. No OAuth real acceptance or Gmail delivery tested. No production change performed. Base44 application login remains separate.
