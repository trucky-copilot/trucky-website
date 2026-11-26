"use client";
import {useState} from 'react';
import { signIn } from 'next-auth/react';
export default function GmailConnection() {
 const [busy,setBusy]=useState(false),[result,setResult]=useState('');
 async function testLogo(){if(busy)return;setBusy(true);try{const r=await fetch('/api/gmail/test-logo',{method:'POST'});const b=await r.json();setResult(b.code==='DIAGNOSTIC_ACCEPTED'?'Prueba aceptada por Gmail. Revisa el correo del remitente y compara las imágenes A y B.':b.code==='DIAGNOSTIC_ALREADY_REQUESTED'?'La prueba ya se solicitó. No se enviará otra.':b.code==='SENDER_LOGIN_REQUIRED'?'Inicia sesión como remitente para enviar la prueba.':'No se confirmó la entrega ('+b.code+'). No repitas el envío.');}catch{setResult('Resultado incierto. No repitas el envío.');}finally{setBusy(false);}}

 return <main className="container-tr" style={{padding:64,maxWidth:700}}>
  <h1>Conectar Gmail de Trucky</h1>
  <p>Solo para trucky.road.copilot@gmail.com. Los clientes no deben autorizar permisos de Gmail.</p>
  <button className="btn btn-ghost" onClick={()=>signIn('google',{callbackUrl:'/admin/gmail'})}>1. Iniciar sesión como remitente</button>
  <form method="post" action="/api/gmail/connect" style={{marginTop:24}}><button className="btn btn-primary">2. Autorizar envío con Gmail</button></form>
  <p>Al finalizar, connected=1 en la dirección indica que se guardó la autorización; no confirma la entrega de un correo. error=authorization_failed indica que debes revisar la configuración.</p>
 <hr/><h2>Diagnóstico del logo</h2><p>Un único correo, solo a la cuenta remitente. No cambia la plantilla actual ni activa demos.</p><button className="btn btn-primary" disabled={busy} onClick={testLogo}>Enviar prueba de logo al remitente</button><p role="status">{result}</p>
 </main>;
}
