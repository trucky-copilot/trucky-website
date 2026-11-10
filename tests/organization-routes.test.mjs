import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Run after npm run build. No real secrets or external backend calls.
test('organization APIs fail closed without a session and reject cross-origin writes', async () => {
  const port = 3189;
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    stdio: 'ignore', env: { ...process.env, NEXTAUTH_SECRET: 'local-test-only-not-a-deployment-secret', NEXTAUTH_URL: `http://localhost:${port}`, BASE44_ORGANIZATIONS_ENABLED: 'false', BILLING_EXISTING_ENROLLMENT_ENABLED:'true' },
  });
  try {
    const base = `http://localhost:${port}`;
    let ready = false;
    for (let n = 0; n < 50; n++) {
      try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'local server ready');
    assert.equal((await fetch(`${base}/subscribe`)).status, 200);
    assert.equal((await fetch(`${base}/billing-link/existing`)).status,200);
    const approval=await fetch(`${base}/api/billing/existing-enrollment`,{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:JSON.stringify({owner_consent:true})});
    assert.equal(approval.status,401);assert.equal((await approval.json()).code,'FRESH_SIGN_IN_REQUIRED');
    assert.equal((await fetch(`${base}/api/billing/existing-enrollment`,{method:'POST',headers:{origin:'https://foreign.invalid'},body:'{}'})).status,403);
    const response = await fetch(`${base}/api/organizations`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'SIGN_IN_REQUIRED' });
    assert.equal((await fetch(`${base}/api/organizations`, {
      method: 'POST', headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' }, body: JSON.stringify({ company_name: 'Demo' }),
    })).status, 403);
  } finally { child.kill(); }
});
