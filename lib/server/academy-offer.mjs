import {createHash} from 'node:crypto';
export function academyRequested(value,plan,{live,env=process.env}){
 if(value==null||(typeof value==='string'&&!value.trim()))return false;
 if(typeof value!=='string'||value.trim().toUpperCase()!=='ACADEMY')throw Error('INVALID_ACADEMY_CODE');
 if(!live||plan!=='owner_op')throw Error('ACADEMY_PLAN_REQUIRED');
 if(env.STRIPE_ACADEMY_ENABLED!=='true')throw Error('ACADEMY_NOT_READY');
 return true;
}
export async function academyDiscount(stripe,price,env=process.env){
 const id=env.STRIPE_LIVE_ACADEMY_COUPON;
 if(typeof id!=='string'||!id||id.length>128||/[\s\x00-\x1f]/.test(id))throw Error('ACADEMY_NOT_READY');
 const product=typeof price.product==='string'?price.product:price.product?.id;
 const c=await stripe.coupons.retrieve(id,{expand:['applies_to']});
 if(price.unit_amount!==2900||price.currency!=='usd'||price.livemode!==true||c.id!==id||c.deleted||!c.valid||!c.livemode||c.duration!=='once'||c.percent_off!==100||c.amount_off!=null||c.redeem_by!=null||c.max_redemptions!=null||c.applies_to?.products?.length!==1||c.applies_to.products[0]!==product)throw Error('ACADEMY_COUPON_INVALID');
 return [{coupon:id}];
}
export const academyAccount=sub=>createHash('sha256').update(`google:${sub}`).digest('hex');
export const ACADEMY_RESERVE=`
local p=redis.call('GET',KEYS[1])
if p then
 local old=cjson.decode(p)
 if old.orgId==ARGV[1] and old.attemptId==ARGV[2] and old.couponId==ARGV[3] and old.priceId==ARGV[4] and not old.subscriptionId then return 2 end
 return 0
end
redis.call('SET',KEYS[1],cjson.encode({orgId=ARGV[1],attemptId=ARGV[2],couponId=ARGV[3],priceId=ARGV[4]}),'NX')
return 1`;
// No TTL: an uncertain Stripe creation must not allow the benefit a second time.
export async function reserveAcademy(redis,sub,orgId,attemptId,couponId,priceId){
 const account=academyAccount(sub);
 const result=await redis(['EVAL',ACADEMY_RESERVE,'1',`trucky:billing:academy:v1:account:${account}`,orgId,attemptId,couponId,priceId]);
 if(result!==1&&result!==2)throw Error('ACADEMY_ALREADY_USED_OR_PENDING');
 return {academy_offer:'ACADEMY',academy_account:account};
}
export const ACADEMY_COMPLETE=`
local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end
local p=cjson.decode(raw)
if p.orgId~=ARGV[1] or p.attemptId~=ARGV[2] then return 0 end
if p.subscriptionId and p.subscriptionId~=ARGV[3] then return 0 end
p.subscriptionId=ARGV[3];redis.call('SET',KEYS[1],cjson.encode(p));return 1`;
export async function completeAcademy(redis,sub){
 if(!sub.metadata?.academy_offer)return;
 const m=sub.metadata;
 if(!sub.livemode||m.academy_offer!=='ACADEMY'||!/^[a-f0-9]{64}$/.test(m.academy_account||'')||!/^sub_[A-Za-z0-9]+$/.test(sub.id))throw Error('ACADEMY_RECONCILIATION_REQUIRED');
 if(await redis(['EVAL',ACADEMY_COMPLETE,'1',`trucky:billing:academy:v1:account:${m.academy_account}`,m.org_id,m.reservation_id,sub.id])!==1)throw Error('ACADEMY_RECONCILIATION_REQUIRED');
}
