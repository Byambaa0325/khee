import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { Hono, type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { bodyLimit } from 'hono/body-limit';
import { compress } from 'hono/compress';
import { BASE_PATH, PNG_LIMITS, RATE_LIMIT } from './config.js';
import { isLang, type Lang } from './i18n.js';
import { PATTERNS, defaults, parseValues, patternById, toQuery, ulzii, type Pattern } from './lib/index.js';
import { DEFAULT_PATTERN, INLINE_SCRIPT, llmsTxt, pagePath, renderPage, sitemapXml } from './page.js';
import { FixedWindow, rateLimit } from './rateLimit.js';

/** Shared with the avdar.me landing page and the other apps, so one choice carries across. */
const LANG_COOKIE = 'avdar_lang';

/** The page's one inline script is allowed by its hash. */
const INLINE_HASH = createHash('sha256').update(INLINE_SCRIPT).digest('base64');

const PAGE_CSP = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${INLINE_HASH}'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** Generated SVG may be opened directly; it never needs scripts. */
const IMAGE_CSP = "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors *";

/** Prefers Mongolian only when it ranks above English in Accept-Language. */
export function prefersMongolian(acceptLanguage: string | undefined): boolean {
  if (!acceptLanguage) return false;
  const ranked = acceptLanguage
    .split(',')
    .map((part, i) => {
      const [tag = '', ...params] = part.trim().toLowerCase().split(';');
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
      return { tag: tag.split('-')[0], q: Number.isFinite(q) ? q : 0, i };
    })
    .filter((x) => x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  const first = ranked.find((x) => x.tag === 'mn' || x.tag === 'en');
  return first?.tag === 'mn';
}

function readCookie(c: Context, name: string): string | undefined {
  const raw = c.req.header('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === name) return v;
  }
  return undefined;
}

/** Query parameters as a record; for repeated keys the last value wins, as forms send them. */
const queryOf = (c: Context): Record<string, string> => Object.fromEntries(new URL(c.req.url).searchParams);

/** The browser bundle, built by esbuild into dist/public. Missing in tests, which do not need it. */
function loadClient(): { js: string; version: string } {
  try {
    const js = readFileSync(join(process.cwd(), 'dist', 'public', 'app.js'), 'utf8');
    return { js, version: createHash('sha256').update(js).digest('hex').slice(0, 12) };
  } catch {
    return { js: '', version: 'dev' };
  }
}

export interface AppOptions {
  /** Injected by tests to drive the limiter clock. */
  now?: () => number;
  limits?: Partial<typeof RATE_LIMIT>;
}

export function createApp(opts: AppOptions = {}) {
  const limits = { ...RATE_LIMIT, ...opts.limits };
  const client = loadClient();
  const favicon = ulzii.render({ ...defaults(ulzii.params), cell: 8, band: 3, outline: 1, centre: 0, padding: 1 }).svg;
  const app = new Hono({ strict: false });

  app.use(
    '*',
    rateLimit({
      perIp: new FixedWindow({ windowMs: 60_000, max: limits.perIpPerMinute, now: opts.now }),
      perInstance: new FixedWindow({ windowMs: 1_000, max: limits.perInstancePerSecond, maxKeys: 1, now: opts.now }),
      trustedProxies: limits.trustedProxies,
      exempt: (path) => path === '/health',
    }),
  );
  app.use('*', bodyLimit({ maxSize: limits.maxBodyBytes }));
  app.use('*', compress());
  app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Requests that reach the service directly (not through avdar.me) should not be indexed.
    const host = c.req.header('x-forwarded-host') ?? c.req.header('host') ?? '';
    if (host.endsWith('.run.app')) c.header('X-Robots-Tag', 'noindex');
  });

  app.get('/', (c) => c.redirect(BASE_PATH, 302));
  // Not /healthz: Google's frontend answers that path itself on Cloud Run (404) and the app never sees it.
  app.get('/health', (c) => c.text('ok'));

  const r = new Hono({ strict: false });

  function page(c: Context, lang: Lang, pattern: Pattern) {
    const query = queryOf(c);
    // ?hl=xx comes from the language switch: remember the choice, then go to the clean URL with the same settings.
    const hl = query.hl;
    if (isLang(hl)) {
      c.header('Set-Cookie', `${LANG_COOKIE}=${hl}; Path=/; Max-Age=31536000; SameSite=Lax`);
      const rest = toQuery(pattern.params, parseValues(pattern.params, query));
      return c.redirect(`${pagePath(hl, pattern.id)}${rest ? `?${rest}` : ''}`, 302);
    }
    if (lang === 'en') {
      const saved = readCookie(c, LANG_COOKIE);
      c.header('Vary', 'Accept-Language, Cookie');
      if (saved === 'mn' || (saved == null && prefersMongolian(c.req.header('accept-language')))) {
        c.header('Cache-Control', 'private, no-store');
        const search = new URL(c.req.url).search;
        return c.redirect(`${pagePath('mn', pattern.id)}${search}`, 302);
      }
    }
    const values = parseValues(pattern.params, query);
    c.header('Cache-Control', 'public, max-age=300');
    c.header('Content-Security-Policy', PAGE_CSP);
    return c.html(renderPage(lang, pattern, values, pattern.render(values), client.version));
  }

  const byId = (id: string) => patternById(id);

  r.get('/', (c) => page(c, 'en', byId(DEFAULT_PATTERN)!));
  r.get('/mn', (c) => page(c, 'mn', byId(DEFAULT_PATTERN)!));
  // The default pattern lives at the root; its own path redirects there.
  r.get(`/${DEFAULT_PATTERN}`, (c) => c.redirect(`${BASE_PATH}${new URL(c.req.url).search}`, 301));
  r.get(`/mn/${DEFAULT_PATTERN}`, (c) => c.redirect(`${BASE_PATH}/mn${new URL(c.req.url).search}`, 301));

  r.get('/api', (c) => {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json({
      patterns: PATTERNS.map((p) => ({ id: p.id, name: p.name, summary: p.summary, params: p.params, svg: `${BASE_PATH}/api/${p.id}.svg`, png: `${BASE_PATH}/api/${p.id}.png` })),
      notes: 'Pass parameters as query strings. Colours are hex without "#". Out-of-range values are clamped. PNG takes scale=1..4.',
    });
  });

  r.get('/api/:file', (c) => {
    const m = /^([a-z]+)\.(svg|png)$/.exec(c.req.param('file'));
    const pattern = m ? byId(m[1]!) : undefined;
    if (!m || !pattern) return c.text('Not found', 404);
    const query = queryOf(c);
    const values = parseValues(pattern.params, query);
    const rendered = pattern.render(values);
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Cache-Control', 'public, max-age=86400');
    c.header('Content-Security-Policy', IMAGE_CSP);
    const download = query.download === '1';
    if (m[2] === 'svg') {
      if (download) c.header('Content-Disposition', `attachment; filename="${pattern.id}.svg"`);
      return c.body(rendered.svg, 200, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
    }
    const scale = Math.min(PNG_LIMITS.maxScale, Math.max(1, Math.round(Number(query.scale) || 1)));
    if (Math.max(rendered.width, rendered.height) * scale > PNG_LIMITS.maxSide) {
      c.header('Cache-Control', 'no-store');
      return c.text(`Image too large: at most ${PNG_LIMITS.maxSide} px per side. Lower the scale or the size.`, 413);
    }
    const png = new Resvg(rendered.svg, { fitTo: { mode: 'zoom', value: scale }, font: { loadSystemFonts: false } }).render().asPng();
    if (download) c.header('Content-Disposition', `attachment; filename="${pattern.id}${scale > 1 ? `@${scale}x` : ''}.png"`);
    return c.body(new Uint8Array(png), 200, { 'Content-Type': 'image/png' });
  });

  r.get('/static/app.js', (c) => {
    if (!client.js) return c.text('Not built: run npm run build:client', 404);
    const versioned = c.req.query('v') === client.version;
    c.header('Cache-Control', versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=300');
    return c.body(client.js, 200, { 'Content-Type': 'text/javascript; charset=utf-8' });
  });

  r.get('/favicon.svg', (c) => {
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(favicon, 200, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
  });

  r.get('/sitemap.xml', (c) => {
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(sitemapXml(), 200, { 'Content-Type': 'application/xml; charset=utf-8' });
  });
  r.get('/llms.txt', (c) => {
    c.header('Cache-Control', 'public, max-age=3600');
    return c.text(llmsTxt());
  });

  // Pattern pages last, so they do not shadow the fixed routes above.
  r.get('/mn/:id', (c) => {
    const p = byId(c.req.param('id'));
    return p ? page(c, 'mn', p) : c.notFound();
  });
  r.get('/:id', (c) => {
    const p = byId(c.req.param('id'));
    return p ? page(c, 'en', p) : c.notFound();
  });

  app.route(BASE_PATH, r);

  app.onError((err, c) => {
    // Body-limit and similar middleware signal their status this way.
    if (err instanceof HTTPException) return err.getResponse();
    console.error(JSON.stringify({ severity: 'ERROR', message: err.message, stack: err.stack, path: c.req.path }));
    return c.text('Something went wrong', 500);
  });

  return app;
}
