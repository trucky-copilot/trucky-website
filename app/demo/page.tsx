"use client";
import { useEffect, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
export default function DemoForm() {
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState('');
 const [busy,setBusy]=useState(true),[result,setResult]=useState('');
 useEffect(()=>{getSession().then(session=>{if(!session?.user?.email){void signIn('google',{callbackUrl:'/demo'});return;}setBusy(false);}).catch(()=>{setResult('No se pudo verificar la sesión. Actualiza la página.');});},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setResult('');try{const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,email})});const b=await r.json();if(r.ok){window.location.assign('/?demo=sent');}else{setResult(`No pudimos confirmar el envío (${b.code}). No repitas de inmediato si el estado es desconocido.`);setBusy(false);}}catch{setResult('No se pudo confirmar el envío. No repitas de inmediato.');}}
 return <main className="demo-page"><section className="demo-card"><a href="/">← Inicio</a><h1>Probar demo</h1><p>Completa tus datos y te enviaremos el enlace a Trucky. No necesitas tarjeta.</p><form onSubmit={submit}>
 <label>Nombre<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} /></label>
 <label>Teléfono<input required type="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} /></label>
 <label>Correo de tu cuenta Google<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="El mismo correo con el que iniciaste sesión" /></label>
 <p>Usaremos estos datos para atender tu solicitud de demo. El enlace no crea automáticamente una sesión en la aplicación.</p>
 <button className="btn btn-primary" disabled={busy}>Enviar</button></form><p role="status">{result}</p></section></main>;
}
