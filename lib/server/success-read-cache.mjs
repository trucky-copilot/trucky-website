// Process-local, short-lived cache for STATIC configuration checks only.
// Never use for eligibility, subscription status, coupon redemptions or permissions.
export function successfulReadCache({ttlMs=30000,maxEntries=8,now=Date.now}={}){
 const cache=new Map();
 return async function read(key,load){
  const existing=cache.get(key);
  if(existing&&(existing.pending||existing.expires>now()))return existing.promise;
  if(cache.size>=maxEntries)cache.delete(cache.keys().next().value);
  const entry={pending:true,expires:0,promise:null};
  entry.promise=Promise.resolve().then(load).then(value=>{entry.pending=false;entry.expires=now()+ttlMs;return value;},error=>{if(cache.get(key)===entry)cache.delete(key);throw error;});
  cache.set(key,entry);return entry.promise;
 };
}
