"use client";
import {useEffect,useState} from 'react';
import {signIn,getSession} from 'next-auth/react';
const messages:Record<string,string>={
 OWNER_APPROVAL_RECORDED:'Aprobación registrada. El administrador dispone de 15 minutos desde su registro para revisarla y ejecutar la migración. Aquí no se ha ejecutado la migración.',
 OWNER_APPROVAL_DISABLED:'Esta prueba todavía no está habilitada.',
 OWNER_APPROVAL_FORBIDDEN:'Esta cuenta no está autorizada para la prueba de Testing-Pro.',
 FRESH_SIGN_IN_REQUIRED:'Vuelve a iniciar sesión con Google antes de aprobar.',
 SIGN_IN_REQUIRED:'Inicia sesión con Google antes de aprobar.',
 CONSENT_REQUIRED:'Debes confirmar tu consentimiento.',
 OWNER_APPROVAL_CONFLICT:'Base44 informó un conflicto. El administrador debe revisar si hay una aprobación vigente u otra verificación pendiente. No repitas el envío.',
 MEMBERSHIP_ALREADY_MIGRATED:'Base44 informa que la membresía ya fue migrada. Solicita al administrador verificar el resultado.',
};
export default function OwnerApproval(){
 const [state,setState]=useState<{enabled:boolean;signedIn:boolean;eligible:boolean;fresh:boolean}|null>(null);
 const [email,setEmail]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[submitted,setSubmitted]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{Promise.all([fetch('/api/billing/legacy-approval',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}),getSession()]).then(([data,session])=>{setState(data);setEmail(session?.user?.email||'');}).catch(()=>setMessage('No se pudo comprobar la sesión. No envíes la aprobación.'));},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy||submitted||!consent)return;setBusy(true);setSubmitted(true);try{
  const r=await fetch('/api/billing/legacy-approval',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner_consent:true})});
  const data=await r.json();setMessage(messages[data.code]||`No se pudo confirmar la aprobación (${typeof data.code==='string'?data.code:'ERROR'}). Pide al administrador revisar el estado antes de repetir.`);
 }catch{setMessage('Resultado desconocido. Pide al administrador revisar si recibió la aprobación; no repitas el envío.');}finally{setBusy(false);}}
 return <main className="demo-page"><section className="demo-card"><a href="/">← Inicio</a><h1>Aprobar migración de Testing-Pro</h1>
 <p>Esta prueba solo registra tu consentimiento para que un administrador verifique la procedencia de tu membresía existente. No cobra, no inicia otra demo y no vincula automáticamente tu cuenta de la aplicación.</p>
 <button className="btn btn-primary" disabled={busy||submitted} onClick={()=>void signIn('google',{callbackUrl:'/billing-link/legacy-approval'},{prompt:'select_account',max_age:'0'})}>1. Iniciar sesión de nuevo con Google</button>
 {email&&<p>Cuenta de la web: {email}</p>}
 {state&&!state.enabled&&<p>La aprobación está deshabilitada hasta coordinar la prueba con el administrador.</p>}
 {state?.signedIn&&!state.eligible&&<p>Esta cuenta no está autorizada para Testing-Pro.</p>}
 {state?.signedIn&&!state.fresh&&<p>Debes iniciar sesión de nuevo. Se exige una autorización reciente.</p>}
 <form onSubmit={submit}><label style={{display:'flex',gap:12,alignItems:'flex-start'}}><input type="checkbox" style={{width:20,marginTop:4}} checked={consent} disabled={busy||submitted} onChange={e=>setConsent(e.target.checked)}/><span>Autorizo al administrador a verificar y migrar una sola vez la procedencia de mi membresía de propietario en Testing-Pro. No autoriza pagos ni cambios de suscripción.</span></label>
 <button className="btn btn-primary" disabled={!state?.enabled||!state?.fresh||!state?.eligible||!consent||busy||submitted}>2. Registrar mi consentimiento</button></form>
 <p role="status">{message}</p></section></main>;
}
