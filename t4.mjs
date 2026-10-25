import { createRequire } from 'module';
const require = createRequire('/opt/pw-browsers/../');
const { chromium } = require('playwright');
const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
await p.goto('https://www.oversize-escort-hub.com/signin', { waitUntil: 'networkidle' });
await p.fill('input[type=email]', 'miggzyonbase@gmail.com'); await p.fill('input[type=password]', '123456789');
await p.locator('button', { hasText: /^sign in/i }).last().click(); await p.waitForTimeout(5000);
const r = await p.evaluate(async () => {
  const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
  const fd = new FormData(); fd.append('file', new File([png], 'test.png', { type: 'image/png' }));
  const u = await fetch('/api/dd214', { method: 'POST', body: fd });
  const g = await fetch('/api/dd214');
  return { upload: u.status + ' ' + (await u.text()).slice(0, 120), status: g.status + ' ' + (await g.text()).slice(0, 80) };
});
console.log(JSON.stringify(r)); await b.close();
