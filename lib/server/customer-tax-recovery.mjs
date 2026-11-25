// This one attempt is audited by Stripe request req_I6hz6QYvDqwRdz (HTTP400,
// missing customer_update.name). Never apply this recovery to other attempts.
const AUDITED_ATTEMPT='bf44d462-b26e-4e3a-ac4c-5ab366ac8217';
export const TAKE_AUDITED_LOCK=`
if redis.call('EXISTS',KEYS[4])==1 then return 0 end
if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end
if redis.call('GET',KEYS[2])~=ARGV[2] then return 0 end
if redis.call('GET',KEYS[3])~=ARGV[3] then return 0 end
redis.call('SET',KEYS[4],ARGV[4]);redis.call('SET',KEYS[1],ARGV[4]);return 1`;
const missingName=p=>typeof p?.customer==='string'&&p.tax_id_collection?.enabled===true&&p.customer_update?.name!=='auto';
export function taxRecoveryShape(payload,attempt){
 return {auditedAttempt:attempt?.id===AUDITED_ATTEMPT,hasSession:!!attempt?.sessionId,
 hasCustomer:typeof payload?.customer==='string',taxIdType:typeof payload?.tax_id_collection?.enabled,
 taxIdEnabled:payload?.tax_id_collection?.enabled===true,nameAuto:payload?.customer_update?.name==='auto',
 originalKey:attempt?.idempotencyKey===`trucky_checkout_${AUDITED_ATTEMPT}`};
}
export function safeTaxError(e){
 const message=typeof e?.message==='string'?e.message:'';
 if(/tax id collection/i.test(message)&&/customer_update\[name\]/i.test(message))return 'TAX_ID_CUSTOMER_NAME_REQUIRED';
 if(e?.type==='StripeIdempotencyError')return 'STRIPE_IDEMPOTENCY_CONFLICT';
 return 'UNRECOGNIZED_STRIPE_REJECTION';
}
const emit=(phase,fields)=>console.info('tax_recovery_diagnostic',{phase,...fields});
const specificReject=e=>e?.type==='StripeInvalidRequestError'&&e.statusCode===400&&typeof e.message==='string'&&/tax id collection/i.test(e.message)&&/customer_update\[name\]/i.test(e.message);
export async function takeAuditedTaxLock(redis,stripe,{orgId,sub,owner,mode}){
 const denied=reason=>{emit('lock_denied',{reason});return false;};
 if(mode!=='live')return denied('NOT_LIVE');
 const lock=`trucky:checkout:live:mutation:${orgId}`,attemptKey=`trucky:checkout:live:v1:${orgId}`;
 const oldOwner=await redis(['GET',lock]),raw=await redis(['GET',attemptKey]);
 if(typeof oldOwner!=='string'||typeof raw!=='string')return denied('LOCK_OR_ATTEMPT_MISSING');
 const attempt=JSON.parse(raw);
 emit('lock_inspection',{auditedAttempt:attempt.id===AUDITED_ATTEMPT,hasSession:!!attempt.sessionId,actorMatches:attempt.actorSub===sub,orgMatches:attempt.orgId===orgId});
 if(attempt.id!==AUDITED_ATTEMPT||attempt.sessionId||attempt.orgId!==orgId||attempt.actorSub!==sub)return denied('ATTEMPT_SCOPE_MISMATCH');
 const payloadKey=`trucky:checkout:live:payload:${attempt.id}`,rawPayload=await redis(['GET',payloadKey]);
 if(typeof rawPayload!=='string')return denied('PAYLOAD_MISSING');const payload=JSON.parse(rawPayload);
 emit('payload_inspection',taxRecoveryShape(payload,attempt));
 if(!missingName(payload)||payload.client_reference_id!==orgId||payload.metadata?.reservation_id!==attempt.id)return denied('PAYLOAD_SHAPE_MISMATCH');
 // Replay EXACTLY the rejected request/key: do not infer absence from a missing ID.
 try{await stripe.checkout.sessions.create(payload,{idempotencyKey:attempt.idempotencyKey});return false;}
 catch(e){emit('original_replay',{httpStatus:typeof e?.statusCode==='number'?e.statusCode:null,rejection:safeTaxError(e),exactTaxRejection:specificReject(e)});if(!specificReject(e))return denied('ORIGINAL_REJECTION_NOT_PROVEN');}
 const transferred=await redis(['EVAL',TAKE_AUDITED_LOCK,'4',lock,attemptKey,payloadKey,`trucky:checkout:live:tax-name-takeover:${attempt.id}`,oldOwner,raw,rawPayload,owner])===1;
 emit('lock_transfer',{transferred});return transferred;
}
export async function correctedTaxPayload(redis,stripe,attempt,payload,{mode='',now=Date.now()}={}){
 emit('corrected_payload',taxRecoveryShape(payload,attempt));
 if(!missingName(payload))return null;
 if(mode!=='live'||attempt.id!==AUDITED_ATTEMPT||attempt.sessionId)throw Error('RECONCILIATION_REQUIRED');
 const key=`trucky:checkout:live:tax-name-recovery:${attempt.id}`;
 const existing=await redis(['GET',key]);if(existing)return validate(JSON.parse(existing),attempt,now);
 try{await stripe.checkout.sessions.create(payload,{idempotencyKey:attempt.idempotencyKey});throw Error('RECONCILIATION_REQUIRED');}
 catch(e){if(!specificReject(e))throw Error('RECONCILIATION_REQUIRED');}
 const fixed={payload:{...payload,customer_update:{...payload.customer_update,name:'auto'},expires_at:Math.floor(now/1000)+1800},idempotencyKey:`${attempt.idempotencyKey}_tax_name_v1`};
 await redis(['SET',key,JSON.stringify(fixed),'NX']);
 const raw=await redis(['GET',key]);if(!raw)throw Error('RECONCILIATION_REQUIRED');return validate(JSON.parse(raw),attempt,now);
}
function validate(stored,attempt,now){
 if(stored.idempotencyKey!==`${attempt.idempotencyKey}_tax_name_v1`||stored.payload?.metadata?.reservation_id!==attempt.id||stored.payload?.customer_update?.name!=='auto'||stored.payload.expires_at<=now/1000+60)throw Error('RECONCILIATION_REQUIRED');
 return stored;
}
