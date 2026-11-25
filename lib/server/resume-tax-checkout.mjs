// Recovery is intentionally restricted to ONE operator-audited failed attempt.
// No generic lock reset. The caller is authenticated and freshly authorized.
const AUDITED='bf44d462-b26e-4e3a-ac4c-5ab366ac8217';
export const CLAIM_RECOVERY=`
if redis.call('GET',KEYS[1])~=ARGV[1] or redis.call('GET',KEYS[2])~=ARGV[2] then return 0 end
if redis.call('EXISTS',KEYS[3])==1 then return 0 end
redis.call('SET',KEYS[3],ARGV[3]);return 1`;
export const FINISH_RECOVERY=`
if redis.call('GET',KEYS[1])~=ARGV[1] or redis.call('GET',KEYS[2])~=ARGV[2] or redis.call('GET',KEYS[3])~=ARGV[3] then return 0 end
redis.call('RPUSH',KEYS[4],ARGV[5])
redis.call('SET',KEYS[2],ARGV[4]);redis.call('DEL',KEYS[1]);redis.call('DEL',KEYS[3]);return 1`;
export const RELEASE_RECOVERY="if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end";
const taxReject=e=>e?.type==='StripeInvalidRequestError'&&e.statusCode===400&&/tax id collection/i.test(e.message||'')&&/customer_update\[(?:name|address)\]/i.test(e.message||'');
const expiredReject=e=>e?.type==='StripeInvalidRequestError'&&e.statusCode===400&&e.param==='expires_at';
const log=(phase,details={})=>console.info('audited_checkout_recovery',{phase,...details});
function matches(session,attempt,payload){
 if(!session?.id?.startsWith('cs_live_')||session.livemode!==true||session.client_reference_id!==attempt.orgId||session.metadata?.reservation_id!==attempt.id||session.customer!==payload.customer)throw Error('STRIPE_SESSION_MISMATCH');
 return session;
}
async function replay(stripe,attempt,record,{allowExpired=false}={}){
 try{return matches(await stripe.checkout.sessions.create(structuredClone(record.payload),{idempotencyKey:record.idempotencyKey}),attempt,record.payload);}
 catch(error){
  if(taxReject(error)){log('confirmed_rejection',{httpStatus:400,reason:/customer_update\[address\]/i.test(error.message||'')?'TAX_ID_CUSTOMER_ADDRESS_REQUIRED':'TAX_ID_CUSTOMER_NAME_REQUIRED'});return null;}
  if(allowExpired&&expiredReject(error)){log('confirmed_rejection',{httpStatus:400,reason:'EXPIRES_AT_INVALID'});return null;}
  // Never rotate a key after timeout/5xx/idempotency conflict/unknown rejection.
  log('blocked',{httpStatus:typeof error?.statusCode==='number'?error.statusCode:null,reason:error?.type==='StripeIdempotencyError'?'IDEMPOTENCY_CONFLICT':'UNEXPECTED_STRIPE_RESULT'});
  throw error;
 }
}
export async function resumeAuditedTaxCheckout(redis,stripe,{orgId,sub,owner,mode,priceId,authorize,now=Date.now()}){
 if(mode!=='live')return null;
 const lock=`trucky:checkout:live:mutation:${orgId}`,attemptKey=`trucky:checkout:live:v1:${orgId}`;
 const oldOwner=await redis(['GET',lock]),raw=await redis(['GET',attemptKey]);
 if(typeof oldOwner!=='string'||typeof raw!=='string')return null;
 const attempt=JSON.parse(raw);
 if(attempt.id!==AUDITED||attempt.actorSub!==sub||attempt.orgId!==orgId||attempt.idempotencyKey!==`trucky_checkout_${AUDITED}`)return null;
 // Do not replay keys beyond provider retention. Never infer absence from search.
 if(!Number.isSafeInteger(attempt.createdAt)||now-attempt.createdAt<0||now-attempt.createdAt>20*3600000)throw Error('RECONCILIATION_REQUIRED');
 const rawPayload=await redis(['GET',`trucky:checkout:live:payload:${AUDITED}`]);
 if(typeof rawPayload!=='string')throw Error('RECONCILIATION_REQUIRED');
 const original=JSON.parse(rawPayload);
 if(typeof original.customer!=='string'||original.tax_id_collection?.enabled!==true||original.client_reference_id!==orgId||original.metadata?.reservation_id!==AUDITED||original.subscription_data?.metadata?.reservation_id!==AUDITED||original.line_items?.length!==1||original.line_items[0].price!==priceId)throw Error('RECONCILIATION_REQUIRED');
 const recoveryLock=`trucky:checkout:live:tax-name-worker-v3:${AUDITED}`;
 if(await redis(['EVAL',CLAIM_RECOVERY,'3',lock,attemptKey,recoveryLock,oldOwner,raw,owner])!==1)throw Error('CHECKOUT_LOCKED');
 let canReleaseWorker=true,finished=false;
 try{
  // Same checks as ordinary checkout; no cached authorization or bypass of duplicates.
  await authorize();
  let session;
  if(attempt.sessionId){session=matches(await stripe.checkout.sessions.retrieve(attempt.sessionId),attempt,original);}
  else{
   // An old request may have reached Stripe even if its session ID was never attached.
   canReleaseWorker=false;
   session=await replay(stripe,attempt,{payload:original,idempotencyKey:attempt.idempotencyKey});
   // Replay all previous recovery keys verbatim. An unknown result must never
   // be treated as rejection just because its session ID was not attached.
   for(const version of [1,2]){
    if(session)break;
    const previousKey=version===1?`trucky:checkout:live:tax-name-recovery:${AUDITED}`:`trucky:checkout:live:tax-name-recovery-v2:${AUDITED}`;
    const previousRaw=await redis(['GET',previousKey]);
    if(!previousRaw)continue;
    const previous=JSON.parse(previousRaw);
    if(previous.idempotencyKey!==`${attempt.idempotencyKey}_tax_name_v${version}`||previous.payload?.metadata?.reservation_id!==AUDITED||previous.payload.customer!==original.customer)throw Error('RECONCILIATION_REQUIRED');
    session=await replay(stripe,attempt,previous,{allowExpired:true});
   }
   if(!session){
    // Freeze corrected parameters ONCE. Retry this same key after an uncertain response.
    const key=`trucky:checkout:live:tax-name-recovery-v3:${AUDITED}`;
    await redis(['SET',key,JSON.stringify({payload:{...original,customer_update:{...original.customer_update,name:'auto',address:'auto'},expires_at:Math.floor(now/1000)+1860},idempotencyKey:`${attempt.idempotencyKey}_tax_name_v3`}), 'NX']);
    const fixed=JSON.parse(await redis(['GET',key]));
    if(fixed.idempotencyKey!==`${attempt.idempotencyKey}_tax_name_v3`||fixed.payload?.customer_update?.name!=='auto'||fixed.payload?.customer_update?.address!=='auto'||fixed.payload?.metadata?.reservation_id!==AUDITED||fixed.payload.customer!==original.customer)throw Error('RECONCILIATION_REQUIRED');
    log('corrected_request',{nameAuto:true,addressAuto:true,taxIdEnabled:true,recoveryVersion:3});
    session=await replay(stripe,attempt,fixed,{allowExpired:false});
    if(!session){canReleaseWorker=true;throw Error('RECONCILIATION_REQUIRED');}
   }
  }
  if(session.status!=='open'||!session.url)throw Error(session.status==='complete'?'ALREADY_SUBSCRIBED':'RECONCILIATION_REQUIRED');
  const audit=JSON.stringify({event:'tax_checkout_recovered',attemptId:AUDITED,sessionId:session.id,at:new Date(now).toISOString()});
  if(await redis(['EVAL',FINISH_RECOVERY,'4',lock,attemptKey,recoveryLock,'trucky:checkout:live:recovery:audit',oldOwner,raw,owner,JSON.stringify({...attempt,sessionId:session.id}),audit])!==1)throw Error('RECONCILIATION_REQUIRED');
  finished=true;log('session_recovered',{status:'open'});return session;
 }finally{
  // Unknown Stripe writes keep this worker lock. Ordinary lock/attempt never erased on error.
  if(!finished&&canReleaseWorker)await redis(['EVAL',RELEASE_RECOVERY,'1',recoveryLock,owner]);
 }
}
