"use client";
import { signIn } from 'next-auth/react';
export default function GmailConnection() {
 return <main className="container-tr" style={{padding:64,maxWidth:700}}>
  <h1>Conectar Gmail de Trucky</h1>
  <p>Solo para trucky.road.copilot@gmail.com. Los clientes no deben autorizar permisos de Gmail.</p>
  <button className="btn btn-ghost" onClick={()=>signIn('google',{callbackUrl:'/admin/gmail'})}>1. Iniciar sesión como remitente</button>
  <form method="post" action="/api/gmail/connect" style={{marginTop:24}}><button className="btn btn-primary">2. Autorizar envío con Gmail</button></form>
  <p>Al finalizar, connected=1 en la dirección indica que se guardó la autorización; no confirma la entrega de un correo. error=authorization_failed indica que debes revisar la configuración.</p>
 </main>;
}
