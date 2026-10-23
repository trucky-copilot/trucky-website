import { NextRequest, NextResponse } from 'next/server';
import { senderSession, gmailRedirect, SENDER, TOKEN_KEY, encryptGmailToken } from '@/lib/server/gmail';
import { redisCommandFromEnv } from '@/lib/server/checkout-coordinator.mjs';
export async function GET(req: NextRequest) {
  try {
    const sub = await senderSession(req);
    const state = req.nextUrl.searchParams.get('state') || '';
    const code = req.nextUrl.searchParams.get('code');
    if (!/^[a-f0-9]{64}$/.test(state) || !code || req.nextUrl.searchParams.has('error')) throw Error();
    const redis = redisCommandFromEnv();
    const raw = await redis(['GETDEL', `trucky:gmail:oauth:${state}`]);
    if (!raw) throw Error();
    const saved = JSON.parse(raw);
    if (saved.sub !== sub) throw Error();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', redirect_uri: gmailRedirect(), grant_type: 'authorization_code', code_verifier: saved.verifier }),
    });
    if (!response.ok) throw Error();
    const tokens = await response.json();
    if (!tokens.refresh_token || !tokens.access_token || !String(tokens.scope).split(' ').includes('https://www.googleapis.com/auth/gmail.send')) throw Error();
    const profile = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(15000) });
    if (!profile.ok) throw Error();
    const user = await profile.json();
    if (user.sub !== sub || user.email?.toLowerCase() !== SENDER || user.email_verified !== true) throw Error();
    await redis(['SET', TOKEN_KEY, encryptGmailToken(tokens.refresh_token)]);
    return NextResponse.redirect(new URL('/admin/gmail?connected=1', req.url), 303);
  } catch { return NextResponse.redirect(new URL('/admin/gmail?error=authorization_failed', req.url), 303); }
}
