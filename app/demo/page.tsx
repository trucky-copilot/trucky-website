"use client";
import {demoCodeError} from '@/lib/demo-code-message.mjs';
import {invalidDemoFields} from '@/lib/demo-details.mjs';
import {useFlowLanguage} from '@/lib/useFlowLanguage';
import {useEffect,useRef,useState} from 'react';
import {getSession,signIn} from 'next-auth/react';
export default function DemoForm(){
 const t=useFlowLanguage();
 const [sent,setSent]=useState(false);
 const successRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(sent)successRef.current?.focus();},[sent]);
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState(''),[sessionEmail,setSessionEmail]=useState('');
 const [fields,setFields]=useState<string[]>([]),[dispatcherCode,setDispatcherCode]=useState(''),[codeError,setCodeError]=useState(false);
 const [busy,setBusy]=useState(true),[result,setResult]=useState('');
 useEffect(()=>{getSession().then(session=>{if(!session?.user?.email){void signIn('google',{callbackUrl:window.location.pathname+window.location.search});return;}setSessionEmail(session.user.email);setBusy(false);}).catch(()=>{setResult(new URLSearchParams(window.location.search).get('lang')==='en'?'Unable to verify your session. Refresh the page.':'No se pudo verificar la sesión. Actualiza la página.');});},[]);
 const message=t('Datos incorrectos','Incorrect details');
 function invalid(errors:string[]){setFields(errors);setResult(message);setBusy(false);document.getElementById(`demo-${errors[0]}`)?.focus();}
 function clear(field:string){setFields(previous=>previous.filter(value=>value!==field));setResult('');}
 const marker=(field:string)=>fields.includes(field)?<span aria-hidden="true" style={{color:'#ffb4b4'}}> *</span>:null;
 const detail=(field:string,text:string)=>fields.includes(field)?<span id={`demo-${field}-error`} role="alert" style={{display:'block',color:'#ffb4b4',marginTop:8,fontSize:14}}>{text}</span>:null;
 async function submit(e:React.FormEvent){
  e.preventDefault();if(busy||sent)return;
  const errors=invalidDemoFields({name,phone,email},sessionEmail);if(errors.length){invalid(errors);return;}
  setFields([]);setCodeError(false);setBusy(true);setResult('');
  try{
   const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,email,dispatcher_code:dispatcherCode.trim(),lang:document.documentElement.lang==='en'?'en':'es'})});const b=await r.json();
   if(r.ok&&b.code==='EMAIL_ACCEPTED'){setSent(true);setResult('');setBusy(false);}
   else if(b.code==='INVALID_DETAILS'){const errors=Array.isArray(b.fields)?b.fields.filter((value:unknown)=>['name','phone','email'].includes(String(value))):[];invalid(errors);}
   else if(b.code==='INVALID_PHONE'){invalid(['phone']);}
   else if(b.code==='INVALID_DISPATCHER_CODE'){setCodeError(true);setBusy(false);document.getElementById('demo-bonus-code')?.focus();}
   else if(b.code==='DEMO_TRIAL_EXPIRED'){setResult(t('Tu demo ya finalizó. Elige un plan para continuar usando Trucky.','Your demo has ended. Choose a plan to continue using Trucky.'));setBusy(false);}
   else if(b.code==='DEMO_ATTEMPT_LIMIT'){setResult(t('Demasiados intentos. Espera una hora antes de volver a probar.','Too many attempts. Wait an hour before trying again.'));setBusy(false);}
   else{setResult(t(`No pudimos confirmar el envío (${b.code}). No repitas de inmediato si el estado es desconocido.`,`Unable to confirm delivery (${b.code}). Do not retry immediately if the outcome is unknown.`));setBusy(false);}
  }catch{setResult(t('No se pudo confirmar el envío. No repitas de inmediato.','Unable to confirm delivery. Do not retry immediately.'));setBusy(false);}
 }
 return <main className="demo-page"><section className="demo-card"><a href="/">{t('← Inicio','← Home')}</a><h1>{t('Solicitar Demo','Request Demo')}</h1><p>{t('Completa tus datos y te enviaremos el enlace a Trucky. No necesitas tarjeta.','Enter your details and we will email you the Trucky link. No card required.')}</p>{sent?<div ref={successRef} tabIndex={-1} className="demo-sent-notice" role="status"><span aria-hidden="true" className="demo-sent-icon">✓</span><h2>{t('Tu información ya fue enviada','Your information has been sent')}</h2><p>{t('Revisa tu bandeja de entrada. Te enviamos el enlace para abrir la demo de Trucky. Si no lo encuentras, revisa también spam.','Check your inbox. We sent you the link to open your Trucky demo. If you cannot find it, check your spam folder too.')}</p></div>:<form noValidate onSubmit={submit}>
 <label htmlFor="demo-name">{t('Nombre','Name')}{marker('name')}<input id="demo-name" required maxLength={100} value={name} aria-invalid={fields.includes('name')} aria-describedby={fields.includes('name')?'demo-name-error':undefined} onChange={e=>{setName(e.target.value);clear('name');}} />{detail('name',t('Escribe tu nombre.','Enter your name.'))}</label>
 <label htmlFor="demo-phone">{t('Teléfono','Phone')}{marker('phone')}<input id="demo-phone" required type="tel" autoComplete="tel" maxLength={30} value={phone} aria-invalid={fields.includes('phone')} aria-describedby={fields.includes('phone')?'demo-phone-error':undefined} onChange={e=>{setPhone(e.target.value);clear('phone');}} />{detail('phone',t('Pon un número de teléfono correcto.','Enter a valid phone number.'))}</label>
 <label htmlFor="demo-email">{t('Correo de tu cuenta Google','Google account email')}{marker('email')}<input id="demo-email" type="email" required value={email} aria-invalid={fields.includes('email')} aria-describedby={fields.includes('email')?'demo-email-error':undefined} onChange={e=>{setEmail(e.target.value);clear('email');}} placeholder={t('El mismo correo con el que iniciaste sesión','The email you used to sign in')} />{detail('email',t('Usa el mismo correo de la cuenta Google con la que iniciaste sesión.','Use the same email as the Google account you signed in with.'))}</label>
 <label htmlFor="demo-bonus-code">{t('Código de bono (opcional)','Bonus code (optional)')}{codeError&&<span aria-hidden="true" style={{color:'#ffb4b4'}}> *</span>}<input id="demo-bonus-code" type="text" maxLength={64} autoComplete="off" autoCapitalize="characters" spellCheck={false} value={dispatcherCode} aria-invalid={codeError} aria-describedby={codeError?'demo-code-error':'demo-code-help'} onChange={e=>{setDispatcherCode(e.target.value);setCodeError(false);}} />{codeError?<span id="demo-code-error" role="alert" style={{display:'block',color:'#ffb4b4',marginTop:8,fontSize:14}}>{t(demoCodeError('es'),demoCodeError('en'))}</span>:<span id="demo-code-help" style={{display:'block',marginTop:8,fontSize:14}}>{t('15 días gratis sin código; 30 con código válido. No amplía una demo ya activada.','15 days free without a code; 30 with a valid code. Does not extend an existing demo.')}</span>}</label>
 <p>{t('Usaremos estos datos para atender tu solicitud de demo. El enlace no crea automáticamente una sesión en la aplicación.','We will use these details to handle your demo request. The link does not automatically sign you into the app.')}</p>
 <button className="btn btn-primary" disabled={busy}>{t('Enviar','Send')}</button></form>}{!sent&&<p role="status">{result}</p>}</section></main>;
}
