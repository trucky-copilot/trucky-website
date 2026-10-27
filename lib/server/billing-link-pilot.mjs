// Fail closed: pilot eligibility supplements, never replaces, server membership checks.
export function billingLinkPilotAllowed(sub, organizationId, env = process.env) {
  const expectedSub = env.BILLING_LINK_PILOT_GOOGLE_SUB;
  const expectedOrg = env.BILLING_LINK_PILOT_ORGANIZATION_ID;
  return typeof sub === 'string' && typeof organizationId === 'string' &&
    !!expectedSub && !!expectedOrg && sub === expectedSub && organizationId === expectedOrg;
}
