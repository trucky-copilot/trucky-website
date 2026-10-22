"use client";
import { useFlowLanguage } from '@/lib/useFlowLanguage';
import { useEffect, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
export default function DemoForm() {
 const t=useFlowLanguage();
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState('');
 const [busy,setBusy]=useState(true),[result,setResult]=useState('');
 useEffect(()=>{getSession().then(session=>{if(!session?.user?.email){void signIn('google',{callbackUrl:window.location.pathname+window.location.search});return;}setBusy(false);}).catch(()=>{setResult(new URLSearchParams(window.location.search).get('lang')==='en'?'Unable to verify your session. Refresh the page.':'No se pudo verificar la sesión. Actualiza la página.');});},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setResult('');try{const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,email})});const b=await r.json();if(r.ok){window.location.assign('/?demo=sent&lang='+(document.documentElement.lang==='en'?'en':'es'));}else{setResult(t(`No pudimos confirmar el envío (${b.code}). No repitas de inmediato si el estado es desconocido.`,`Unable to confirm delivery (${b.code}). Do not retry immediately if the outcome is unknown.`));setBusy(false);}}catch{setResult(t('No se pudo confirmar el envío. No repitas de inmediato.','Unable to confirm delivery. Do not retry immediately.'));}}
 return <main className="demo-page"><section className="demo-card"><a href="/">{t('← Inicio','← Home')}</a><h1>{t('Probar demo','Try demo')}</h1><p>{t('Completa tus datos y te enviaremos el enlace a Trucky. No necesitas tarjeta.','Enter your details and we will email you the Trucky link. No card required.')}</p><form onSubmit={submit}>
 <label>{t('Nombre','Name')}<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} /></label>
 <label>{t('Teléfono','Phone')}<input required type="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} /></label>
 <label>{t('Correo de tu cuenta Google','Google account email')}<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={t("El mismo correo con el que iniciaste sesión","The email you used to sign in")} /></label>
 <p>{t('Usaremos estos datos para atender tu solicitud de demo. El enlace no crea automáticamente una sesión en la aplicación.','We will use these details to handle your demo request. The link does not automatically sign you into the app.')}</p>
 <button className="btn btn-primary" disabled={busy}>{t('Enviar','Send')}</button></form><p role="status">{result}</p></section></main>;
}
