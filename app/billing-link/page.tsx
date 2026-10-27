"use client";
import {useEffect,useState} from 'react';
import {signIn} from 'next-auth/react';
export default function BillingLink(){
 const [orgs,setOrgs]=useState<Array<{id:string;name:string}>>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch('/api/organizations',{cache:'no-store'}).then(async r=>{if(r.status===401){await signIn('google',{callbackUrl:'/billing-link'});return;}const body=await r.json();if(!r.ok)throw Error();setOrgs(body.organizations);}).catch(()=>setError('No se pudo verificar tu cuenta.'));},[]);
 async function link(id:string){setBusy(true);setError('');try{const r=await fetch('/api/billing/link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({organization_id:id})});const data=await r.json();if(!r.ok)throw Error(data.code==='LINK_PILOT_ONLY'?`LINK_PILOT_ONLY — cuenta: ${data.subjectMatches?'coincide':'no coincide'}; empresa: ${data.organizationMatches?'coincide':'no coincide'}`:data.code);window.location.assign(data.url);}catch(e){setError(e instanceof Error?e.message:'LINK_FAILED');setBusy(false);}}
 return <main className="demo-page"><section className="demo-card"><h1>Vincular acceso a Trucky</h1><p>Elige tu empresa. En Trucky deberás confirmar la vinculación con tu sesión de la aplicación.</p>{orgs.map(org=><button className="btn btn-primary" disabled={busy} key={org.id} onClick={()=>void link(org.id)}>{org.name}</button>)}<p role="alert">{error}</p></section></main>;
}
