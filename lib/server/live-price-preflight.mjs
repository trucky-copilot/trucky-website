export async function checkLivePricePreflight({secret,prices},{fetcher=fetch,log=entry=>console.info('live_billing_preflight',entry)}={}) {
 const safePrices=prices.map(p=>typeof p==='string'&&/^price_[A-Za-z0-9]+$/.test(p)?p:'INVALID_OR_MISSING');
 let response;
 try {
  response=await fetcher('https://trucky-17a283d5.base44.app/api/functions/checkLiveBillingConfiguration',{
   method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
   headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({prices}),
  });
 }catch{
  log({httpStatus:null,code:'NETWORK_OR_TIMEOUT',prices:safePrices});
  throw Error('LIVE_BACKEND_NOT_READY');
 }
 const raw=await response.text().catch(()=>null);
 let data=null;try{data=raw&&raw.length<=512?JSON.parse(raw):null;}catch{}
 const safeBody=typeof raw==='string'&&data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length===1&&typeof data.code==='string'&&/^[A-Z][A-Z_]{1,99}$/.test(data.code)?raw:null;
 // Additional response properties or non-code text are never logged.
 const codes=['LIVE_CONFIGURATION_VALID','UNAUTHORIZED','METHOD_NOT_ALLOWED','INVALID_REQUEST','LIVE_KEY_REQUIRED','LIVE_CONFIGURATION_REQUIRED','INVALID_PRICES','PRICES_REQUIRED','INVALID_PRICE','LIVE_CONFIGURATION_UNAVAILABLE','LIVE_PRICE_MISMATCH','LIVE_CONFIGURATION_INVALID','LIVE_CONFIGURATION_REQUIRES_REVIEW','LIVE_PRICE_REQUIRES_REVIEW','LIVE_CHECKOUT_NOT_READY'];
 const code=safeBody!==null||codes.includes(data?.code)?data.code:'UNRECOGNIZED_RESPONSE';
 log({httpStatus:response.status,code,prices:safePrices,...(safeBody!==null?{responseBody:safeBody}:{})});
 if(!response.ok||data?.code!=='LIVE_CONFIGURATION_VALID')throw Error('LIVE_BACKEND_NOT_READY');
}
