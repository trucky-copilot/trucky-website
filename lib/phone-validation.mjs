export function isValidPhone(value) {
 if (typeof value !== 'string') return false;
 const phone=value.trim();
 const digits=phone.replace(/\D/g,'');
 return /^[+\d ()-]+$/.test(phone) && phone.length<=30 && digits.length>=7 && digits.length<=15;
}
