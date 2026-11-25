"use client";
import {useEffect} from 'react';
const APP_URL='https://trucky-ai.app/';
// Only navigation: access and subscription state are always checked by the app.
export function CheckoutReturn({english=false}:{english?:boolean}){
 useEffect(()=>{window.location.replace(APP_URL);},[]);
 return <main className="demo-page"><section className="demo-card" role="status"><h1>{english?'Opening Trucky…':'Abriendo Trucky…'}</h1><a className="btn btn-primary" href={APP_URL}>{english?'Go to the app':'Ir a la app'}</a></section></main>;
}
