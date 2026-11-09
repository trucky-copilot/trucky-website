// Called only after the authenticated server has resolved the user's billing membership.
export function testCheckoutEligible(organization, allowedIds, publicDemoEnabled) {
  if (!organization || typeof organization.id !== 'string') return false;
  return allowedIds.has(organization.id) ||
    (publicDemoEnabled === true && organization.billing_demo_enabled === true);
}
