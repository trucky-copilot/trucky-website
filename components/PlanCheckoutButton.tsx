"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
export function PlanCheckoutButton({plan,lang,label,className}:{plan:string;lang:string;label:string;className:string}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[login,setLogin]=useState(false);
 const [choices,setChoices]=useState<Array<{id:string;name:string}>>([]);
 const es=lang==='es';
 async function checkout(id:string){
  const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({organization_id:id,plan})});
  const data=await r.json();if(!r.ok)throw Error(data.error||'CHECKOUT_UNAVAILABLE');
  const url=new URL(data.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('INVALID_CHECKOUT');
  // Navigate from the landing page so browser Back returns to it.
  window.location.assign(url.href);
 }
 async function start(id?:string){
  if(busy)return;setBusy(true);setError('');
  try{
   if(id){await checkout(id);return;}
   const r=await fetch('/api/organizations',{cache:'no-store'});
   if(r.status===401){setLogin(true);setBusy(false);return;}
   const data=await r.json();if(!r.ok)throw Error(data.error||'BACKEND_UNAVAILABLE');
   if(data.organizations.length>1){setChoices(data.organizations);setBusy(false);return;}
   let org=data.organizations[0];
   if(!org){const created=await fetch('/api/organizations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prepare_checkout:true})});const c=await created.json();if(!created.ok)throw Error(c.error||'BACKEND_UNAVAILABLE');org=c.organization;}
   await checkout(org.id);
  }catch(e){setError(e instanceof Error?e.message:'CHECKOUT_UNAVAILABLE');setBusy(false);}
 }
 return <><button className={className} disabled={busy} aria-busy={busy} onClick={()=>void start()}>{label}</button>
 {error&&<p role="alert">{error==='LIVE_IDENTITY_LINK_REQUIRED'?<>{es?'Antes de pagar, confirma tu cuenta en Trucky. Después regresa y selecciona el plan.':'Before paying, confirm your account in Trucky. Then return and select your plan.'} <a href="/billing-link">{es?'Vincular mi cuenta':'Link my account'}</a></>:<>{error==='BILLING_ACCOUNT_REVIEW_REQUIRED'?(es?'Tu empresa existente necesita confirmar la titularidad antes de pagar.':'Your existing company needs ownership verification before payment.'):<>{es?'No se pudo abrir Stripe: ':'Unable to open Stripe: '}{error}</>} <a href="/billing-link/existing">{es?'¿Ya tienes empresa en Trucky?':'Already have a Trucky company?'}</a></>}</p>}
 {(login||choices.length>0)&&<div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget){setLogin(false);setChoices([]);}}}><section className="demo-card" role="dialog" aria-modal="true" aria-label={es?'Continuar al pago':'Continue to checkout'}>
 {login?<><h2>{es?'Inicia sesión':'Sign in'}</h2><button className="btn google-login-btn" onClick={()=>signIn('google',{callbackUrl:`/?lang=${lang}#pricing`})}>{es?'Continuar con Google':'Continue with Google'}</button><p>{es?'Después selecciona Start en el plan.':'Then select Start on your plan.'}</p></>:<><h2>{es?'Elige tu cuenta':'Choose your account'}</h2>{choices.map(org=><button key={org.id} className="btn btn-ghost" disabled={busy} onClick={()=>void start(org.id)}>{org.name}</button>)}</>}
 <button className="btn btn-ghost" onClick={()=>{setLogin(false);setChoices([]);}}>{es?'Cerrar':'Close'}</button>
 </section></div>}</>;
}
