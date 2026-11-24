import {randomUUID} from 'node:crypto';
import {academyAccount,academyDiscount} from './academy-offer.mjs';
const idOf=value=>typeof value==='string'?value:value?.id;
export const CUSTOMER_ATTACH=`
local raw=redis.call('GET',KEYS[1]);if not raw then return 0 end
local p=cjson.decode(raw);if p.operation~=ARGV[1] or (p.customerId and p.customerId~=ARGV[2]) then return 0 end
p.customerId=ARGV[2];redis.call('SET',KEYS[1],cjson.encode(p));return 1`;
export async function accountCustomer(stripe,redis,sub,{now=Date.now(),uuid=randomUUID}={}){
 const account=academyAccount(sub),key=`trucky:billing:academy:v2:customer:${account}`;
 await redis(['SET',key,JSON.stringify({operation:uuid(),at:now}),'NX']);
 const raw=await redis(['GET',key]);if(typeof raw!=='string')throw Error('ACADEMY_CUSTOMER_REQUIRES_REVIEW');
 const state=JSON.parse(raw);
 if(typeof state.operation!=='string'||!Number.isSafeInteger(state.at))throw Error('ACADEMY_CUSTOMER_REQUIRES_REVIEW');
 let customer;
 if(state.customerId)customer=await stripe.customers.retrieve(state.customerId);
 else{
  // Idempotency expires at Stripe: never retry an unacknowledged create after 20h.
  if(now-state.at>20*3600000)throw Error('ACADEMY_CUSTOMER_REQUIRES_REVIEW');
  customer=await stripe.customers.create({metadata:{academy_account:account}},{idempotencyKey:`academy_customer_${state.operation}`});
 }
 if(customer.deleted||customer.livemode!==true||customer.metadata?.academy_account!==account||!/^cus_[A-Za-z0-9]+$/.test(customer.id))throw Error('ACADEMY_CUSTOMER_REQUIRES_REVIEW');
 if(await redis(['EVAL',CUSTOMER_ATTACH,'1',key,state.operation,customer.id])!==1)throw Error('ACADEMY_CUSTOMER_REQUIRES_REVIEW');
 return{account,customer:customer.id};
}
export async function customerAcademyCode(stripe,customer,coupon){
 const existing=await stripe.promotionCodes.list({customer,code:'ACADEMY',limit:100});
 if(existing.has_more||existing.data.length>1)throw Error('ACADEMY_PROMOTION_REQUIRES_REVIEW');
 let promo=existing.data[0];
 if(!promo){
  // Stripe enforces uniqueness against unrestricted codes. Never list all users'
  // private codes (unbounded) or mutate an existing global promotion.
  try{promo=await stripe.promotionCodes.create({promotion:{type:'coupon',coupon},code:'ACADEMY',customer,max_redemptions:1},{idempotencyKey:`academy_promotion_${customer}_${coupon}`});}
  catch(error){if(error?.type==='StripeInvalidRequestError'&&error?.param==='code')throw Error('ACADEMY_GLOBAL_CODE_CONFLICT');throw error;}
 }
 if(promo.livemode!==true||idOf(promo.customer)!==customer||String(promo.code).toUpperCase()!=='ACADEMY'||idOf(promo.promotion?.coupon??promo.coupon)!==coupon||promo.max_redemptions!==1||promo.expires_at!=null)throw Error('ACADEMY_PROMOTION_REQUIRES_REVIEW');
 return promo.active&&promo.times_redeemed===0?promo.id:null;
}
export const RESERVE_NATIVE=`
local raw=redis.call('GET',KEYS[1])
if raw then
 local p=cjson.decode(raw)
 if p.orgId==ARGV[1] and p.attemptId==ARGV[2] and p.couponId==ARGV[3] and p.priceId==ARGV[4] and p.customerId==ARGV[5] and p.promotionCodeId==ARGV[6] and not p.subscriptionId then return 2 end
 return 0
end
redis.call('SET',KEYS[1],cjson.encode({orgId=ARGV[1],attemptId=ARGV[2],couponId=ARGV[3],priceId=ARGV[4],customerId=ARGV[5],promotionCodeId=ARGV[6],native=true}),'NX');return 1`;
export async function academyProfile(stripe,redis,price,sub,{live=false,plan='',env=process.env}={}){
 if(!live||plan!=='owner_op'||env.STRIPE_ACADEMY_ENABLED!=='true'||env.STRIPE_ACADEMY_NATIVE_ENABLED!=='true')return null;
 await academyDiscount(stripe,price,env);
 const coupon=env.STRIPE_LIVE_ACADEMY_COUPON;
 const {account,customer}=await accountCustomer(stripe,redis,sub);
 const promotion=await customerAcademyCode(stripe,customer,coupon);
 return{account,customer,promotion,coupon};
}
export async function prepareNativeAcademy(stripe,redis,price,sub,orgId,attempt,options={}){
 const profile=Object.hasOwn(options,'profile')?options.profile:await academyProfile(stripe,redis,price,sub,options);
 if(!profile)return{};
 const {account,customer,promotion,coupon}=profile;
 // Redeemed accounts still open a normal paid checkout without the code field.
 if(!promotion)return{customer,metadata:{academy_checkout:'native-v1'}};
 const reserved=await redis(['EVAL',RESERVE_NATIVE,'1',`trucky:billing:academy:v1:account:${account}`,orgId,attempt.id,coupon,price.id,customer,promotion]);
 if(reserved!==1&&reserved!==2)return{customer,metadata:{academy_checkout:'native-v1'}};
 return{customer,allow_promotion_codes:true,metadata:{academy_checkout:'native-v1',academy_offer:'ACADEMY',academy_account:account,academy_native:'v1'}};
}
// Changing an existing Stripe request requires explicit expiry first. Never reuse
// an old automatically-discounted session or mutate its idempotent parameters.
export async function replaceLegacyAcademySession(stripe,coordinator,redis,org,attempt,sub,mode,nativeEnabled=false){
 const raw=await redis(['GET',`trucky:checkout:${mode}:payload:${attempt.id}`]);
 if(!raw)return attempt;
 const p=JSON.parse(raw);
 if(p.metadata?.academy_checkout==='native-v1'&&!p.discounts?.length)return attempt;
 if(!nativeEnabled&&!p.discounts?.length&&!p.metadata?.academy_offer)return attempt; // existing normal paid session is safe
 if(!attempt.sessionId)throw Error('CHECKOUT_OFFER_CHANGED');
 const s=await stripe.checkout.sessions.retrieve(attempt.sessionId);
 if(s.livemode!==(mode==='live')||s.client_reference_id!==org||s.metadata?.reservation_id!==attempt.id)throw Error('STRIPE_SESSION_MISMATCH');
 if(s.status==='complete')throw Error('ALREADY_SUBSCRIBED');
 if(s.status==='open'&&(await stripe.checkout.sessions.expire(s.id)).status!=='expired')throw Error('RECONCILIATION_REQUIRED');
 if(!['open','expired'].includes(s.status))throw Error('RECONCILIATION_REQUIRED');
 if(!await coordinator.releaseExpired(org,attempt.id,stripe))throw Error('RESERVATION_MISMATCH');
 // Preserve legacy claims. Do not erase a possibly consumed benefit.
 return coordinator.reserve(org,sub);
}
export async function completeNativeAcademy(stripe,redis,sub){
 const m=sub.metadata;
 if(m?.academy_native!=='v1')return false;
 if(!sub.livemode||m.academy_offer!=='ACADEMY'||!/^[a-f0-9]{64}$/.test(m.academy_account||''))throw Error('ACADEMY_RECONCILIATION_REQUIRED');
 const key=`trucky:billing:academy:v1:account:${m.academy_account}`;
 const raw=await redis(['GET',key]);if(typeof raw!=='string')throw Error('ACADEMY_RECONCILIATION_REQUIRED');
 const p=JSON.parse(raw);
 if(!p.native||p.orgId!==m.org_id||p.attemptId!==m.reservation_id||p.customerId!==idOf(sub.customer))throw Error('ACADEMY_RECONCILIATION_REQUIRED');
 if(p.subscriptionId){if(p.subscriptionId!==sub.id)throw Error('ACADEMY_RECONCILIATION_REQUIRED');return true;}
 const invoiceId=idOf(sub.latest_invoice);
 if(!invoiceId)return false;
 const invoice=await stripe.invoices.retrieve(invoiceId,{expand:['discounts']});
 const discounts=invoice.discounts||[];
 const matched=discounts.filter(d=>typeof d==='object'&&idOf(d.promotion_code)===p.promotionCodeId&&idOf(d.source?.coupon??d.coupon)===p.couponId);
 // Not using ACADEMY is a normal checkout, never a promotion receipt.
 // Let ordinary unpaid/canceled/renewal states synchronize; Base44 still denies generic zero credit.
 if(!matched.length)return false;

 if(discounts.length!==1||invoice.billing_reason!=='subscription_create'||invoice.status!=='paid'||invoice.total!==0||invoice.amount_paid!==0||!invoice.livemode||idOf(invoice.customer)!==p.customerId||idOf(invoice.parent?.subscription_details?.subscription??invoice.subscription)!==sub.id)throw Error('ACADEMY_RECONCILIATION_REQUIRED');
 return true;
}
