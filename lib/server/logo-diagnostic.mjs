import {randomUUID} from 'node:crypto';
import {DEMO_LOGO_BASE64} from './demo-logo.mjs';
// Fixed sender/recipient: this diagnostic is not a customer-email relay.
export function logoDiagnosticRaw(sender,id=randomUUID()){
 if(sender!=='trucky.road.copilot@gmail.com'||!/^[a-f0-9-]{36}$/.test(id))throw Error('INVALID_DIAGNOSTIC');
 const cid=`logo.${id}@trucky-ai.com`,outer=`rel_${id}`,alt=`alt_${id}`;
 const enc=s=>Buffer.from(s).toString('base64').match(/.{1,76}/g).join('\r\n');
 const html=`<!doctype html><html><body style="font-family:Arial;background:white;color:#4b087a"><h1>Trucky — diagnóstico de logo</h1><p>A. Imagen incluida en este mensaje:</p><img src="cid:${cid}" width="242" height="70" alt="Logo A: imagen incluida"><p>B. Imagen pública:</p><img src="https://www.trucky-ai.com/trucky-email-logo-v3.png?diag=${id}" width="242" height="70" alt="Logo B: imagen pública"><p>C. Respaldo sin imágenes:</p><strong style="font-size:34px;color:#4b087a">Trucky</strong><p>Esta prueba no activa demos ni modifica cuentas.</p></body></html>`;
 const raw=[`From: Trucky <${sender}>`,`To: ${sender}`,'Subject: Trucky - diagnostico de logo','MIME-Version: 1.0',`Content-Type: multipart/related; boundary="${outer}"; type="multipart/alternative"`,'',`--${outer}`,`Content-Type: multipart/alternative; boundary="${alt}"`,'',`--${alt}`,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',enc('Diagnóstico de logo Trucky. Compara A (imagen incluida), B (pública) y C (texto). No modifica demos.'),`--${alt}`,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',enc(html),`--${alt}--`,'',`--${outer}`,'Content-Type: image/png; name="trucky.png"','Content-Transfer-Encoding: base64',`Content-ID: <${cid}>`,'Content-Disposition: inline; filename="trucky.png"','',DEMO_LOGO_BASE64.match(/.{1,76}/g).join('\r\n'),`--${outer}--`,''].join('\r\n');
 return Buffer.from(raw).toString('base64url');
}
