// Backend bodies are untrusted. Preserve the original text only for short,
// code/error-only JSON without tokens, personal data, headers or free text.
export function safeBase44Body(raw){
 let data=null;try{data=JSON.parse(raw);}catch{}
 const knownText=new Set(['Unauthorized','Método no permitido','Body JSON inválido','Error interno','Error interno al crear la organización']);
 const valid=data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(data).length>0&&Object.keys(data).every(key=>['code','error'].includes(key)&&typeof data[key]==='string'&&(/^[A-Z][A-Z_]{1,119}$/.test(data[key])||knownText.has(data[key])));
 return {data,body:typeof raw==='string'&&raw.length<=1024&&valid?raw:null};
}
export async function diagnosedBase44Request(operation,run,{log=entry=>console.info('base44_call_diagnostic',entry),id=()=>crypto.randomUUID()}={}){
 const callId=id(),started=Date.now();
 log({operation,callId,phase:'start'});
 let response;
 try{response=await run();}catch(error){log({operation,callId,phase:'transport_error',httpStatus:null,durationMs:Date.now()-started});throw error;}
 let raw;
 try{raw=await response.text();}catch(error){log({operation,callId,phase:'body_read_error',httpStatus:response.status,durationMs:Date.now()-started});throw error;}
 const parsed=safeBase44Body(raw);
 log({operation,callId,phase:'response',httpStatus:response.status,durationMs:Date.now()-started,responseBody:parsed.body??'OMITTED_NON_CODE_RESPONSE'});
 return {response,data:parsed.data};
}
