export function livePilotAllowsIdentity(sub, orgId, env=process.env) {
 return typeof sub==='string'&&typeof orgId==='string'&&!!env.BILLING_LINK_PILOT_GOOGLE_SUB&&!!env.BILLING_LINK_PILOT_ORGANIZATION_ID&&sub===env.BILLING_LINK_PILOT_GOOGLE_SUB&&orgId===env.BILLING_LINK_PILOT_ORGANIZATION_ID;
}
export function livePilotAllowsOrganization(orgId,env=process.env) {
 return typeof orgId==='string'&&!!env.BILLING_LINK_PILOT_ORGANIZATION_ID&&orgId===env.BILLING_LINK_PILOT_ORGANIZATION_ID;
}
export async function verifyLiveCheckoutEligibility(sub,orgId,{
 env=process.env,fetcher=fetch,enrollmentValidated=false,
}={}) {
 if(!livePilotAllowsIdentity(sub,orgId,env)&&!enrollmentValidated&&env.BILLING_PUBLIC_ENROLLMENT_ENABLED!=='true')throw Error('LIVE_PILOT_ONLY');
 if(!env.TRUCKY_SERVER_SECRET)throw Error('LIVE_BACKEND_NOT_READY');
 const r=await fetcher('https://trucky-17a283d5.base44.app/api/functions/checkLiveCheckoutEligibility',{
  method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
  headers:{Authorization:`Bearer ${env.TRUCKY_SERVER_SECRET}`,'Content-Type':'application/json'},
  body:JSON.stringify({organization_id:orgId,google_sub:sub}),
 });
 const data=await r.json().catch(()=>null);
 if(r.status===409&&data?.code==='LIVE_IDENTITY_LINK_REQUIRED')throw Error('LIVE_IDENTITY_LINK_REQUIRED');
 if(r.status===409&&data?.code==='ALREADY_SUBSCRIBED')throw Error('ALREADY_SUBSCRIBED');
 if(r.status!==200||data?.code!=='LIVE_CHECKOUT_ELIGIBLE'||data?.organization_id!==orgId||data?.google_sub!==sub||data?.can_checkout!==true)throw Error('LIVE_BACKEND_NOT_READY');
}
export function expectedLivePrice(price,plan){
 return ['owner_op','fleet'].includes(plan)&&price?.livemode===true&&price.active===true&&price.currency==='usd'&&price.unit_amount===(plan==='owner_op'?2900:9900)&&price.type==='recurring'&&price.recurring?.interval==='month'&&price.recurring?.interval_count===1&&price.billing_scheme==='per_unit';
}

// Additional guard, not a replacement for persistent reservations: Stripe Search
// is eventually consistent. Retain uncertain creation attempts; never infer that
// a missing search result proves an earlier request did not create a purchase.
export async function assertNoExistingLiveSubscription(stripe,orgId) {
 if(typeof orgId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(orgId))throw Error('LIVE_BACKEND_NOT_READY');
 const result=await stripe.subscriptions.search({query:`metadata['org_id']:'${orgId}'`,limit:1});
 if(!result||!Array.isArray(result.data))throw Error('LIVE_BACKEND_NOT_READY');
 if(result.data.length||result.has_more)throw Error('ALREADY_SUBSCRIBED');
}
