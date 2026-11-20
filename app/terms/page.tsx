import type {Metadata} from 'next';
import {LegalPage} from '@/components/LegalPage';
export const metadata:Metadata={title:'Términos / Terms | Trucky',description:'Términos y condiciones de Trucky / Trucky terms and conditions'};
export default function Terms(){return <LegalPage kind="terms"/>;}
