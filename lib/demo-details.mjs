import {isValidPhone} from './phone-validation.mjs';
export function invalidDemoFields({name,phone,email},sessionEmail){
 const fields=[];
 if(typeof name!=='string'||!name.trim()||name.trim().length>100)fields.push('name');
 if(!isValidPhone(typeof phone==='string'?phone.trim():''))fields.push('phone');
 if(typeof email!=='string'||!email.trim()||!/^\S+@\S+\.\S+$/.test(email.trim())||email.trim().toLowerCase()!==String(sessionEmail||'').trim().toLowerCase())fields.push('email');
 return fields;
}
