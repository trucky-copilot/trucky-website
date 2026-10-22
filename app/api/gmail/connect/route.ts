import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { senderSession, gmailRedirect, encryptGmailToken } from '@/lib/server/gmail';
import { sameOrigin } from '@/lib/server/base44';
import { redisCommandFromEnv } from '@/lib/server/checkout-coordinator.mjs';
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  try {
    const sub = await senderSession(req);
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) throw Error();
    encryptGmailToken('configuration-check');
    const state = randomBytes(32).toString('hex');
    const verifier = randomBytes(48).toString('base64url');
    const redis = redisCommandFromEnv();
    await redis(['SET', `trucky:gmail:oauth:${state}`, JSON.stringify({ sub, verifier }), 'EX', '600', 'NX']);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: gmailRedirect(), response_type: 'code', scope: 'openid email https://www.googleapis.com/auth/gmail.send', access_type: 'offline', prompt: 'consent', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' }).toString();
    return NextResponse.redirect(url, 303);
  } catch { return NextResponse.json({ error: 'SENDER_LOGIN_OR_CONFIGURATION_REQUIRED' }, { status: 403 }); }
}
