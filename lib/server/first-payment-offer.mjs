// Optional business-authorized REAL $1 purchase test: retain the $29 recurring
// price and use a single-redemption $28 coupon on the initial invoice only.
// No request/body flag can opt into or configure this offer.
export async function firstPaymentOffer(stripe,price,plan,{live=false,env=process.env,now=Date.now(),log=entry=>console.info('first_payment_offer_validation',entry)}={}) {
 const id=env.STRIPE_LIVE_OWNER_OP_FIRST_INVOICE_COUPON;
 if(!live||plan!=='owner_op'||!id)return [];
 if(typeof id!=='string'||id.length>128||/[\s\x00-\x1f]/.test(id)){log({valid:false,failed:['coupon_id_format']});throw Error('FIRST_PAYMENT_OFFER_INVALID');}
 const product=typeof price.product==='string'?price.product:price.product?.id;
 const priceChecks={price_live:price.livemode===true,price_amount:price.unit_amount===2900,price_currency:price.currency==='usd',price_monthly:price.type==='recurring'&&price.recurring?.interval==='month'&&price.recurring?.interval_count===1,price_product:!!product};
 const invalidPrice=Object.keys(priceChecks).filter(key=>!priceChecks[key]);
 if(invalidPrice.length){log({valid:false,failed:invalidPrice});throw Error('FIRST_PAYMENT_OFFER_INVALID');}
 // Stripe omits applies_to unless explicitly expanded.
 const coupon=await stripe.coupons.retrieve(id,{expand:['applies_to']});
 const checks={
  coupon_id_matches:coupon.id===id,
  coupon_not_deleted:!coupon.deleted,
  coupon_live:coupon.livemode===true,
  coupon_valid:coupon.valid===true,
  duration_once:coupon.duration==='once',
  amount_28_usd:coupon.amount_off===2800&&coupon.currency==='usd',
  not_percentage:coupon.percent_off==null,
  max_redemptions_one:coupon.max_redemptions===1,
  not_redeemed:coupon.times_redeemed===0,
  not_expired:!coupon.redeem_by||coupon.redeem_by>now/1000,
  single_product:Array.isArray(coupon.applies_to?.products)&&coupon.applies_to.products.length===1,
  product_matches:coupon.applies_to?.products?.[0]===product,
 };
 const failed=Object.keys(checks).filter(key=>!checks[key]);
 log({valid:failed.length===0,failed,checks});
 if(failed.length)throw Error('FIRST_PAYMENT_OFFER_INVALID');
 return [{coupon:id}];
}
export function assertSameCheckoutOffer(payload,discounts){
 const existing=payload.discounts||[];
 if(!Array.isArray(existing)||existing.length!==discounts.length||existing.some((item,i)=>item.coupon!==discounts[i]?.coupon||item.promotion_code))throw Error('CHECKOUT_OFFER_CHANGED');
 if(payload.allow_promotion_codes===true)throw Error('CHECKOUT_OFFER_CHANGED');
}

// Runs under the existing persistent checkout mutation lock. Never change an
// immutable request after an uncertain create or infer absence from no sessionId.
export async function replaceUnconfirmedOffer(stripe,coordinator,command,orgId,attempt,discounts,actorSub,mode){
 const raw=await command(['GET',`trucky:checkout:${mode}:payload:${attempt.id}`]);
 if(!raw)return attempt;
 const stored=JSON.parse(raw);
 try{assertSameCheckoutOffer(stored,discounts);return attempt;}catch(error){if(error.message!=='CHECKOUT_OFFER_CHANGED')throw error;}
 if(!attempt.sessionId)throw Error('CHECKOUT_OFFER_CHANGED');
 const previous=await stripe.checkout.sessions.retrieve(attempt.sessionId);
 if(previous.id!==attempt.sessionId||previous.livemode!==(mode==='live')||previous.client_reference_id!==orgId||previous.metadata?.reservation_id!==attempt.id)throw Error('STRIPE_SESSION_MISMATCH');
 if(previous.status==='complete')throw Error('ALREADY_SUBSCRIBED');
 if(previous.status==='open'){
  const closed=await stripe.checkout.sessions.expire(previous.id);
  if(closed.status!=='expired')throw Error('RECONCILIATION_REQUIRED');
 }else if(previous.status!=='expired')throw Error('RECONCILIATION_REQUIRED');
 if(!await coordinator.releaseExpired(orgId,attempt.id,stripe))throw Error('RESERVATION_MISMATCH');
 return coordinator.reserve(orgId,actorSub);
}
