import type {Metadata} from 'next';
import {LegalPage} from '@/components/LegalPage';
export const metadata:Metadata={title:'Privacidad / Privacy | Trucky',description:'Política de privacidad de Trucky / Trucky privacy policy'};
export default function Privacy(){return <LegalPage kind="privacy"/>;}
