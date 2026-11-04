const API = 'https://api.hubapi.com/crm/objects/2026-09';
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export async function recordDemoRequest({name, phone, email}, {
  token = process.env.HUBSPOT_ACCESS_TOKEN, fetcher = fetch, now = () => new Date(),
} = {}) {
  if (!token) throw Error('CRM_NOT_CONFIGURED');
  async function call(path, method = 'GET', body) {
    let response;
    try {
      response = await fetcher(`${API}${path}`, {
        method, redirect:'error', cache:'no-store', signal:AbortSignal.timeout(12000),
        headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'},
        ...(body ? {body:JSON.stringify(body)} : {}),
      });
    } catch { throw Error('CRM_REQUIRES_REVIEW'); }
    return response;
  }
  async function data(response) {
    if (!response.ok) throw Error('CRM_NOT_SAVED');
    const result = await response.json().catch(() => null);
    if (typeof result?.id !== 'string' || !/^\d+$/.test(result.id)) throw Error('CRM_REQUIRES_REVIEW');
    return result;
  }
  const properties = {firstname:name, phone}; // Keep the supplied full name intact, do not guess surnames.
  const byEmail = `/contacts/${encodeURIComponent(email)}?idProperty=email`;
  const existing = await call(byEmail);
  let contact;
  if (existing.ok) {
    const found = await data(existing);
    contact = await data(await call(`/contacts/${found.id}`, 'PATCH', {properties}));
  } else if (existing.status === 404) {
    const created = await call('/contacts', 'POST', {properties:{...properties,email}});
    if (created.status === 409) {
      // A concurrent request created the same email. Resolve it without duplicating contacts.
      const found = await data(await call(byEmail));
      contact = await data(await call(`/contacts/${found.id}`, 'PATCH', {properties}));
    } else contact = await data(created);
  } else throw Error('CRM_NOT_SAVED');
  // Record the request as an associated timeline note, without changing lifecycle/owner/consent.
  // Never automatically retry this POST: a lost response can mean the note was already created.
  const note = await call('/notes', 'POST', {
    properties:{hs_timestamp:now().toISOString(), hs_note_body:
      `<p>Solicitud de demo desde la web / Website demo request</p><p>Nombre: ${escapeHtml(name)}<br>Teléfono: ${escapeHtml(phone)}<br>Correo: ${escapeHtml(email)}</p><p>Solicitud recibida; activación y envío de invitación se procesan por separado.</p>`},
    associations:[{to:{id:contact.id},types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId:202}]}],
  });
  await data(note);
}
