// Only read-only checks belong here. Wait for ALL results before allowing either
// Stripe creation or releasing a lock after failure; no background checks outlive it.
export class CheckoutCheckFailure extends Error {
 constructor(stage,cause){super('CHECKOUT_CHECK_FAILED',{cause});this.stage=stage;}
}
export async function parallelCheckoutChecks(tasks){
 const entries=Object.entries(tasks);
 const results=await Promise.allSettled(entries.map(([,task])=>Promise.resolve().then(task.run)));
 const failed=results.findIndex(result=>result.status==='rejected');
 if(failed!==-1)throw new CheckoutCheckFailure(entries[failed][1].stage,results[failed].reason);
 return Object.fromEntries(entries.map(([key],index)=>[key,results[index].value]));
}
