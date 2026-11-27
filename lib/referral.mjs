// PM-03 · Código de referido. Quien invita comparte `trucky-ai.com/?invita=CODIGO`.
// El código viaja hasta la suscripción de Stripe (metadata.referral_code) y Base44
// marca la empresa del invitado como referida. No da acceso ni descuento: el bono
// sigue siendo solo el código ACADEMY en el pago.
export const REFERRAL_STORAGE_KEY='trucky.invita';
const VALID=/^[A-HJKMNP-Z2-9]{8}$/;
export function normalizeReferral(value){
 const code=String(value??'').trim().toUpperCase();
 return VALID.test(code)?code:null;
}
/** Metadata para Stripe: vacía si el código no es válido. */
export function referralMetadata(value){
 const code=normalizeReferral(value);
 return code?{referral_code:code}:{};
}
