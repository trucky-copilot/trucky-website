"use client";
import { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
export function PlanCheckoutButton({plan,lang,label,className}:{plan:string;lang:string;label:string;className:string}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[login,setLogin]=useState(false);
 const [choices,setChoices]=useState<Array<{id:string;name:string}>>([]);
 const es=lang==='es';
 const inFlight=useRef(false), resumed=useRef(false);
 useEffect(()=>{const back=(event:PageTransitionEvent)=>{if(event.persisted){inFlight.current=false;setBusy(false);}};window.addEventListener('pageshow',back);return()=>window.removeEventListener('pageshow',back);},[]);
 useEffect(()=>{
  if(resumed.current)return;
  const url=new URL(window.location.href);
  if(url.searchParams.get('checkout_plan')!==plan)return;
  resumed.current=true;url.searchParams.delete('checkout_plan');
  window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
  try{if(sessionStorage.getItem('trucky.checkout.intent')!==plan)return;sessionStorage.removeItem('trucky.checkout.intent');}catch{return;}
  void start();
 },[plan]);
 function loginAndContinue(){
  try{sessionStorage.setItem('trucky.checkout.intent',plan);}catch{}
  void signIn('google',{callbackUrl:`/?lang=${lang}&checkout_plan=${plan}#pricing`});
 }
 async function start(id?:string){
  // Synchronous guard covers two clicks before React has rendered disabled.
  if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
  let navigating=false;
  try{
   const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...(id?{organization_id:id}:{}),plan})});
   const data=await r.json();
   if(r.status===401){setLogin(true);return;}
   if(data.error==='ORGANIZATION_SELECTION_REQUIRED'&&Array.isArray(data.organizations)){setChoices(data.organizations);return;}
   if(!r.ok)throw Error(data.error||'CHECKOUT_UNAVAILABLE');
   const url=new URL(data.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('INVALID_CHECKOUT');
   // Navigate from the landing page so browser Back returns to it.
   window.location.assign(url.href);navigating=true;
  }catch(e){setError(e instanceof Error?e.message:'CHECKOUT_UNAVAILABLE');}
  finally{if(!navigating){inFlight.current=false;setBusy(false);}}
 }
 return <><button className={className} disabled={busy} aria-busy={busy} onClick={()=>void start()}>{busy?(es?'Abriendo pago…':'Opening checkout…'):label}</button>
 {error&&<p role="alert">{error==='LIVE_IDENTITY_LINK_REQUIRED'?<>{es?'Antes de pagar, confirma tu cuenta en Trucky. Después regresa y selecciona el plan.':'Before paying, confirm your account in Trucky. Then return and select your plan.'} <a href="/billing-link">{es?'Vincular mi cuenta':'Link my account'}</a></>:<>{error==='BILLING_ACCOUNT_REVIEW_REQUIRED'?(es?'Tu empresa existente necesita confirmar la titularidad antes de pagar.':'Your existing company needs ownership verification before payment.'):<>{es?'No se pudo abrir Stripe: ':'Unable to open Stripe: '}{error}</>} <a href="/billing-link/existing">{es?'¿Ya tienes empresa en Trucky?':'Already have a Trucky company?'}</a></>}</p>}
 {(login||choices.length>0)&&<div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget){setLogin(false);setChoices([]);}}}><section className="demo-card" role="dialog" aria-modal="true" aria-label={es?'Continuar al pago':'Continue to checkout'}>
 {login?<><h2>{es?'Inicia sesión':'Sign in'}</h2><button className="btn google-login-btn" onClick={loginAndContinue}>{es?'Continuar con Google':'Continue with Google'}</button><p>{es?'Continuaremos al pago después de iniciar sesión.':'We will continue to checkout after sign-in.'}</p></>:<><h2>{es?'Elige tu cuenta':'Choose your account'}</h2>{choices.map(org=><button key={org.id} className="btn btn-ghost" disabled={busy} onClick={()=>void start(org.id)}>{org.name}</button>)}</>}
 <button className="btn btn-ghost" onClick={()=>{setLogin(false);setChoices([]);}}>{es?'Cerrar':'Close'}</button>
 </section></div>}</>;
}
