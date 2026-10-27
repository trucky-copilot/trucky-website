import { NextResponse } from 'next/server';
import { stripeMode } from '@/lib/server/stripe-mode.mjs';
export const dynamic='force-dynamic';
export function GET(){
 try {
  const {mode,live}=stripeMode();
  const enabled=live?process.env.STRIPE_LIVE_PAYMENTS_ENABLED==='true':process.env.STRIPE_CHECKOUT_TEST_ENABLED==='true';
  return NextResponse.json({mode,enabled},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({mode:'unavailable',enabled:false},{status:503});}
}
