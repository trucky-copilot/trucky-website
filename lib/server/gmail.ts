import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
export const SENDER = 'trucky.road.copilot@gmail.com';
export const TOKEN_KEY = 'trucky:gmail:sender:encrypted:v1';
export async function senderSession(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub || token.email?.toLowerCase() !== SENDER) throw Error('SENDER_LOGIN_REQUIRED');
  return token.sub;
}
export function gmailRedirect() {
  const origin = new URL(process.env.NEXTAUTH_URL || '');
  if (origin.protocol !== 'https:') throw Error('HTTPS_REQUIRED');
  return `${origin.origin}/api/gmail/callback`;
}
function encryptionKey() {
  const secret = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw Error('GMAIL_ENCRYPTION_NOT_CONFIGURED');
  return createHash('sha256').update(secret).digest();
}
export function encryptGmailToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}
export function decryptGmailToken(value: string) {
  const raw = Buffer.from(value, 'base64');
  const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), raw.subarray(0, 12));
  cipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([cipher.update(raw.subarray(28)), cipher.final()]).toString('utf8');
}
