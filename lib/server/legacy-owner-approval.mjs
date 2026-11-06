// This endpoint can request owner approval only. It never performs preview/execute.
const ORGANIZATION_ID = '6aac0718ff3a5154cb00ddb1';
const MEMBER_ID = '6aac0719be8a03dcc9d4562a';
export function approvalSessionReady(session, now = Date.now() / 1000) {
  return typeof session?.googleAuthenticatedAt === 'number' &&
    session.googleAuthenticatedAt <= now && now - session.googleAuthenticatedAt < 540 &&
    typeof session.googleIdToken === 'string' && !!session.googleIdToken &&
    typeof session.googleTokenExpires === 'number' && session.googleTokenExpires > now + 30;
}
export function approvalPilotAllowed(session, env = process.env) {
  return !!env.BILLING_LINK_PILOT_GOOGLE_SUB && session?.sub === env.BILLING_LINK_PILOT_GOOGLE_SUB &&
    env.BILLING_LINK_PILOT_ORGANIZATION_ID === ORGANIZATION_ID;
}
export async function requestOwnerApproval(session, consent, {
  env = process.env, fetcher = fetch, now = Date.now() / 1000,
} = {}) {
  if (env.LEGACY_OWNER_APPROVAL_ENABLED !== 'true') return {status:503,code:'OWNER_APPROVAL_DISABLED'};
  if (!session?.sub) return {status:401,code:'SIGN_IN_REQUIRED'};
  if (!approvalPilotAllowed(session,env)) return {status:403,code:'OWNER_APPROVAL_FORBIDDEN'};
  if (!approvalSessionReady(session,now)) return {status:401,code:'FRESH_SIGN_IN_REQUIRED'};
  if (consent !== true) return {status:400,code:'CONSENT_REQUIRED'};
  if (!env.TRUCKY_SERVER_SECRET) return {status:503,code:'OWNER_APPROVAL_NOT_CONFIGURED'};
  try {
    const response = await fetcher('https://trucky-17a283d5.base44.app/api/functions/migrateLegacyMembershipProvenance', {
      method:'POST', redirect:'error', cache:'no-store', signal:AbortSignal.timeout(15000),
      headers:{Authorization:`Bearer ${env.TRUCKY_SERVER_SECRET}`,'Content-Type':'application/json'},
      body:JSON.stringify({mode:'owner_approval', organization_id:ORGANIZATION_ID, member_id:MEMBER_ID,
        google_id_token:session.googleIdToken, owner_consent:true}),
    });
    if (response.status === 200) {
      const data = await response.json();
      if (data?.code === 'OWNER_APPROVAL_RECORDED') return {status:200,code:'OWNER_APPROVAL_RECORDED'};
      return {status:503,code:'OWNER_APPROVAL_REQUIRES_REVIEW'};
    }
    const codes={400:'OWNER_APPROVAL_INVALID_REQUEST',401:'OWNER_APPROVAL_AUTH_FAILED',403:'OWNER_APPROVAL_FORBIDDEN',
      409:'OWNER_APPROVAL_CONFLICT',410:'MEMBERSHIP_ALREADY_MIGRATED',503:'OWNER_APPROVAL_UNAVAILABLE'};
    return {status:response.status in codes ? response.status : 503,
      code:codes[response.status] || 'OWNER_APPROVAL_REQUIRES_REVIEW'};
  } catch { return {status:503,code:'OWNER_APPROVAL_REQUIRES_REVIEW'}; }
}
