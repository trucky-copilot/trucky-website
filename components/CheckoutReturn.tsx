"use client";
import {useEffect,useState} from 'react';
const APP_URL='https://trucky-17a283d5.base44.app/';
export function CheckoutReturn({english=false}:{english?:boolean}){
 const [state,setState]=useState<'pending'|'ready'|'error'>('pending');
 const t=(es:string,en:string)=>english?en:es;
 useEffect(()=>{
  let stopped=false;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  const deadline=setTimeout(()=>{controller.abort();if(!stopped)setState('error');},35000);
  async function poll(attempt=0):Promise<void>{
   try{
    const response=await fetch('/api/organizations',{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('CONFIRMATION_PENDING');
    const body=await response.json();
    if(stopped)return;
    if(Array.isArray(body.organizations)&&body.organizations.some((o:any)=>['active','trialing'].includes(o.subscription_status))){clearTimeout(deadline);setState('ready');return;}
    if(attempt>=14){clearTimeout(deadline);setState('error');return;}
    timer=setTimeout(()=>void poll(attempt+1),2000);
   }catch{if(!stopped){clearTimeout(deadline);setState('error');}}
  }
  void poll();return()=>{stopped=true;controller.abort();clearTimeout(timer);clearTimeout(deadline);};
 },[]);
 return <main className="demo-page"><section className="demo-card" aria-live="polite">
 <a href="/">← Trucky</a>
 <h1 className="h2" style={{textAlign:'center'}}>{state==='ready'?t('Tu suscripción está activa.','Your subscription is active.'):state==='error'?t('La confirmación está pendiente','Confirmation is pending'):t('Estamos activando tu cuenta…','We are activating your account…')}</h1>
 {state==='pending'&&<><div className="checkout-loading" role="status"><span className="checkout-spinner" aria-hidden="true"/><span>{t('Estamos confirmando el pago con el servidor.','We are confirming your payment with the server.')}</span></div><p>{t('Puedes continuar a Trucky mientras llega la confirmación.','You can continue to Trucky while confirmation arrives.')}</p></>}
 {state==='error'&&<div role="alert"><p>{t('No vuelvas a pagar. Entra a la app para consultar tu cuenta o escríbenos con el correo del pago.','Do not pay again. Open the app to check your account or contact us with the email used for payment.')}</p><a href="mailto:trucky.road.copilot@gmail.com">trucky.road.copilot@gmail.com</a></div>}
 <a className="btn btn-primary btn-block" style={{marginTop:24}} href={APP_URL}>{t('Ir a la app','Go to the app')}</a>
 <p>{t('La app verifica tu suscripción antes de habilitar el acceso.','The app verifies your subscription before granting access.')}</p>
 </section></main>;
}
