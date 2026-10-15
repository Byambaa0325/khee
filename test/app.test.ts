import { describe, expect, it } from 'vitest';
import { createApp, prefersMongolian } from '../src/app.js';

const meta = (html: string, prop: string) => new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`).exec(html)?.[1];
const en = { headers: { 'accept-language': 'en-GB' } };

describe('pages', () => {
  it('serves the ulzii generator at the base path, with link-preview metadata and the preview inline', async () => {
    const res = await createApp().request('/khee', en);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<h1>Ulzii · endless knot</h1>');
    expect(html).toContain('<link rel="canonical" href="https://avdar.me/khee">');
    expect(html).toContain('hreflang="mn" href="https://avdar.me/khee/mn"');
    expect(meta(html, 'og:image')).toMatch(/^https:\/\/avdar\.me\/khee\/api\/ulzii\.png\?/);
    expect(html).toMatch(/<div class="stage" id="stage"><svg /);
    expect(res.headers.get('content-security-policy')).toContain("script-src 'self' 'sha256-");
  });

  it('serves every pattern in both languages', async () => {
    const app = createApp();
    for (const path of ['/khee/alkhan', '/khee/ugalz', '/khee/mn', '/khee/mn/alkhan', '/khee/mn/ugalz']) {
      expect((await app.request(path, en)).status, path).toBe(200);
    }
    expect(await (await app.request('/khee/mn/alkhan')).text()).toContain('<h1>Алхан хээ</h1>');
    expect((await app.request('/khee/nonsense', en)).status).toBe(404);
  });

  it('renders the settings from the query string, so a link reproduces a design', async () => {
    const html = await (await createApp().request('/khee?n=5&turn=45&fill=ff0000', en)).text();
    expect(html).toContain('id="f-n" name="n" min="3" max="9" step="2" value="5"');
    expect(html).toContain('stroke="#ff0000"');
    expect(html).toContain('/khee/api/ulzii.svg?n=5&amp;turn=45&amp;fill=ff0000');
  });

  it('redirects the default pattern path to the base path, keeping the settings', async () => {
    const res = await createApp().request('/khee/ulzii?n=7');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/khee?n=7');
  });

  it('redirects the root to the base path and answers the health check', async () => {
    const root = await createApp().request('/');
    expect(root.status).toBe(302);
    expect(root.headers.get('location')).toBe('/khee');
    expect((await createApp().request('/health')).status).toBe(200);
  });

  it('marks direct run.app traffic as noindex', async () => {
    const direct = await createApp().request('/khee', { headers: { host: 'khee-123.europe-west1.run.app' } });
    expect(direct.headers.get('x-robots-tag')).toBe('noindex');
    const viaGateway = await createApp().request('/khee', { headers: { host: 'khee-123.europe-west1.run.app', 'x-forwarded-host': 'avdar.me' } });
    expect(viaGateway.headers.get('x-robots-tag')).toBeNull();
  });

  it('publishes a sitemap and llms.txt for the gateway', async () => {
    const app = createApp();
    const sitemap = await (await app.request('/khee/sitemap.xml')).text();
    expect(sitemap).toContain('<loc>https://avdar.me/khee/mn/alkhan</loc>');
    const llms = await (await app.request('/khee/llms.txt')).text();
    expect(llms).toContain('https://avdar.me/khee/api/ugalz.svg');
  });
});

describe('image API', () => {
  it('returns SVG with the parameters applied, open to other sites', async () => {
    const res = await createApp().request('/khee/api/alkhan.svg?ink=00ff00&layout=strip');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    const svg = await res.text();
    expect(svg).toContain('fill="#00ff00"');
    expect(svg).not.toMatch(/<script/i);
  });

  it('returns PNG at the requested scale', async () => {
    const one = await createApp().request('/khee/api/ulzii.png');
    const two = await createApp().request('/khee/api/ulzii.png?scale=2&download=1');
    expect(one.headers.get('content-type')).toBe('image/png');
    const b1 = new Uint8Array(await one.arrayBuffer());
    const b2 = new Uint8Array(await two.arrayBuffer());
    expect([...b1.slice(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    // Width sits in the IHDR chunk at bytes 16..19.
    const width = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset).getUint32(16);
    expect(width(b2)).toBe(2 * width(b1));
    expect(two.headers.get('content-disposition')).toBe('attachment; filename="ulzii@2x.png"');
  });

  it('refuses PNGs over the size limit instead of rendering them', async () => {
    const res = await createApp().request('/khee/api/alkhan.png?module=40&across=40&down=40&scale=4');
    expect(res.status).toBe(413);
  });

  it('clamps hostile parameters instead of failing', async () => {
    const res = await createApp().request('/khee/api/ugalz.svg?radius=1e9&arcs=-4&ink=%22%3E%3Cscript%3E&form=%3Cx%3E');
    expect(res.status).toBe(200);
    const svg = await res.text();
    expect(svg).not.toContain('<script');
    expect(svg).not.toContain('<x>');
  });

  it('describes every pattern and parameter as JSON', async () => {
    const res = await createApp().request('/khee/api');
    const body = (await res.json()) as { patterns: { id: string; params: unknown[] }[] };
    expect(body.patterns.map((p) => p.id)).toEqual(['ulzii', 'alkhan', 'ugalz']);
    expect(body.patterns.every((p) => p.params.length > 0)).toBe(true);
  });

  it('answers 404 for unknown patterns and formats', async () => {
    const app = createApp();
    expect((await app.request('/khee/api/nope.svg')).status).toBe(404);
    expect((await app.request('/khee/api/ulzii.gif')).status).toBe(404);
  });
});

describe('language selection', () => {
  it('redirects browsers that prefer Mongolian, keeping the pattern and settings', async () => {
    const res = await createApp().request('/khee/alkhan?corner=box', { headers: { 'accept-language': 'mn-MN,mn;q=0.9,en;q=0.8' } });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/khee/mn/alkhan?corner=box');
  });

  it('keeps an explicit English choice even for Mongolian browsers', async () => {
    const res = await createApp().request('/khee', { headers: { 'accept-language': 'mn', cookie: 'avdar_lang=en' } });
    expect(res.status).toBe(200);
  });

  it('remembers the switch and redirects to the clean URL with the same settings', async () => {
    const res = await createApp().request('/khee/mn/ugalz?hl=en&form=rosette');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/khee/ugalz?form=rosette');
    expect(res.headers.get('set-cookie')).toContain('avdar_lang=en');
  });

  it('ranks Accept-Language by q', () => {
    expect(prefersMongolian('en-US,en;q=0.9,mn;q=0.8')).toBe(false);
    expect(prefersMongolian('mn;q=0.9,en;q=0.5')).toBe(true);
    expect(prefersMongolian(undefined)).toBe(false);
  });
});

describe('abuse limits', () => {
  it('returns 429 with Retry-After once an IP exceeds its per-minute budget', async () => {
    let t = 0;
    const app = createApp({ now: () => t, limits: { perIpPerMinute: 3, trustedProxies: 1 } });
    const hit = (ip: string) => app.request('/khee/api/ulzii.svg', { headers: { 'x-forwarded-for': `${ip}, 10.0.0.5` } });
    for (let i = 0; i < 3; i++) expect((await hit('203.0.113.9')).status).toBe(200);
    const blocked = await hit('203.0.113.9');
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('60');
    expect((await hit('203.0.113.10')).status).toBe(200);
    t += 60_000;
    expect((await hit('203.0.113.9')).status).toBe(200);
  });

  it('sheds load with 503 when the instance budget per second is exhausted', async () => {
    const app = createApp({ now: () => 0, limits: { perInstancePerSecond: 2, perIpPerMinute: 1000 } });
    expect((await app.request('/khee/api/ulzii.svg', { headers: { 'x-forwarded-for': '1.1.1.1' } })).status).toBe(200);
    expect((await app.request('/khee/api/ulzii.svg', { headers: { 'x-forwarded-for': '2.2.2.2' } })).status).toBe(200);
    const shed = await app.request('/khee/api/ulzii.svg', { headers: { 'x-forwarded-for': '3.3.3.3' } });
    expect(shed.status).toBe(503);
  });

  it('never limits the health check', async () => {
    const app = createApp({ now: () => 0, limits: { perInstancePerSecond: 1, perIpPerMinute: 1 } });
    for (let i = 0; i < 5; i++) expect((await app.request('/health')).status).toBe(200);
  });
});
