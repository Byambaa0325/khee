import { BASE_PATH, PNG_LIMITS, PUBLIC_ORIGIN, PUBLIC_URL, REPO_URL } from './config.js';
import { LOCALE, STRINGS, type Lang } from './i18n.js';
import { PATTERNS, bandRects, toQuery, type ParamSpec, type Pattern, type Rendered, type Values } from './lib/index.js';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string): string => s.replace(/[&<>"']/g, (ch) => ESC[ch]!);

/** The one inline script: marks the page as scripted before first paint, so no-script controls never flash. */
export const INLINE_SCRIPT = "document.documentElement.classList.add('js')";

/** The first pattern lives at the root; the others under their id. */
export const DEFAULT_PATTERN = 'ulzii';

export function pagePath(lang: Lang, id: string): string {
  return `${BASE_PATH}${lang === 'mn' ? '/mn' : ''}${id === DEFAULT_PATTERN ? '' : `/${id}`}`;
}
export const pageUrl = (lang: Lang, id: string): string => PUBLIC_ORIGIN + pagePath(lang, id);

/** Path of the image API for a pattern and its non-default settings. */
export function apiPath(id: string, ext: 'svg' | 'png', query: string, extra = ''): string {
  const q = [query, extra].filter(Boolean).join('&');
  return `${BASE_PATH}/api/${id}.${ext}${q ? `?${q}` : ''}`;
}

/** One period of the alkhan band, seamless when repeated horizontally: the page's header rule. */
function bandTile(color: string, m: number): string {
  const rects = bandRects(0, 8, 0, 1)
    .map((r) => ({ x0: Math.max(0, r.u0), x1: Math.min(8, r.u1), y0: r.v0, y1: r.v1 }))
    .filter((r) => r.x1 > r.x0)
    .map((r) => `M${r.x0 * m} ${r.y0 * m}H${r.x1 * m}V${r.y1 * m}H${r.x0 * m}Z`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${8 * m}" height="${7 * m}"><path d="${rects}" fill="${color}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const CSS = /* css */ `
:root{--bg:#f4ecdf;--paper:#fffaf2;--ink:#1b120b;--muted:#6b5a4a;--line:#e2d4bf;--accent:#b3261e;--accent-ink:#fff;--focus:#1990d5}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:ui-sans-serif,system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5;min-height:100svh;display:flex;flex-direction:column}
a{color:inherit}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
header{background:var(--paper)}
.bar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px max(16px,4vw)}
.brand{display:flex;align-items:baseline;gap:10px;text-decoration:none}
.brand b{font-size:22px;letter-spacing:.01em}
.brand span{color:var(--muted);font-size:14px}
.lang{font-size:14px;color:var(--muted);text-decoration:none;border-bottom:1px solid currentColor}
.rule{height:21px;background-repeat:repeat-x;background-size:auto 21px}
nav{display:flex;gap:6px;padding:16px max(16px,4vw) 0;flex-wrap:wrap}
nav a{text-decoration:none;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:var(--paper);font-size:15px}
nav a[aria-current="page"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
main{flex:1;padding:16px max(16px,4vw) 40px;display:flex;flex-direction:column;gap:20px}
.intro h1{font-size:28px;font-weight:650;letter-spacing:-.01em}
.intro p{color:var(--muted);max-width:70ch}
.layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,1fr);gap:20px;align-items:start}
@media (max-width:860px){.layout{grid-template-columns:1fr}}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px}
.preview{position:sticky;top:12px;display:flex;flex-direction:column;gap:14px}
@media (max-width:860px){.preview{position:static}}
.stage{border-radius:10px;min-height:240px;display:grid;place-items:center;padding:16px;overflow:hidden;
  background-color:#fff;background-image:conic-gradient(#efe7da 25%,#fff 0 50%,#efe7da 0 75%,#fff 0);background-size:20px 20px}
.stage svg{width:100%;height:auto;max-height:60vh;display:block}
.meta{font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums}
.warnings{list-style:none;display:flex;flex-direction:column;gap:6px}
.warnings li{font-size:14px;background:#fff3cd;border:1px solid #f0d58a;border-radius:8px;padding:6px 10px}
.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.btn{font:inherit;font-size:15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink)}
.btn:hover{border-color:var(--muted)}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn[aria-disabled="true"]{opacity:.45;pointer-events:none}
.pngs{display:inline-flex;align-items:center;gap:4px}
.pngs span{font-size:14px;color:var(--muted);margin-right:2px}
.pngs .btn{padding:9px 11px}
.sub h2{font-size:16px;margin-bottom:4px}
.sub p{font-size:14px;color:var(--muted);margin-bottom:8px}
.copyline{display:flex;gap:8px}
.copyline input,.copyline pre{flex:1;min-width:0}
input[readonly],pre{font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);white-space:pre-wrap;word-break:break-all}
form{display:flex;flex-direction:column;gap:18px}
fieldset{border:0;display:flex;flex-direction:column;gap:14px}
legend{font-size:13px;font-weight:650;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:10px}
.field{display:flex;flex-direction:column;gap:6px}
.field>label,.field>.label{font-size:15px;display:flex;justify-content:space-between;gap:8px}
.row{display:flex;gap:10px;align-items:center}
input[type=range]{flex:1;accent-color:var(--accent);min-width:0}
input[type=number],input[type=text],select{font:inherit;font-size:15px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--ink)}
input[type=number]{width:84px;font-variant-numeric:tabular-nums}
input[type=text]{width:110px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px}
input[type=color]{width:40px;height:34px;padding:2px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer}
.field.is-none input[type=color]{opacity:.35}
.seg{align-self:flex-start;display:inline-flex;flex-wrap:wrap;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.seg label{position:relative;cursor:pointer}
.seg input{position:absolute;opacity:0;inset:0;cursor:pointer}
.seg span{display:block;padding:7px 12px;font-size:14px}
.seg input:checked+span{background:var(--ink);color:var(--paper)}
.seg input:focus-visible+span{outline:2px solid var(--focus);outline-offset:-2px}
.check{display:flex;gap:8px;align-items:center;font-size:15px;cursor:pointer}
.field>label.check{justify-content:flex-start}
.check input{width:18px;height:18px;accent-color:var(--accent)}
.hint{font-size:13px;color:var(--muted)}
.form-actions{display:flex;gap:8px}
.js .nojs{display:none}
html:not(.js) .jsonly{display:none}
.how{max-width:80ch}
.how h2{font-size:20px;margin-bottom:8px}
.how p{margin-bottom:10px}
.how .src{font-size:14px;color:var(--muted)}
footer{padding:20px 16px 28px;text-align:center;font-size:14px;color:var(--muted)}
footer a{color:var(--ink)}
`;

function numberField(p: Extract<ParamSpec, { kind: 'number' }>, value: number, lang: Lang): string {
  const id = `f-${p.key}`;
  const unit = p.unit === 'module' ? (lang === 'mn' ? 'мод' : 'module') : (p.unit ?? '');
  return `<div class="field">
<label for="${id}">${esc(p.label[lang])}${unit ? ` <span class="hint">${esc(unit)}</span>` : ''}</label>
<div class="row"><input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${value}" data-for="${p.key}" aria-label="${esc(p.label[lang])}" tabindex="-1"><input type="number" id="${id}" name="${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${value}"></div>
${p.hint ? `<p class="hint">${esc(p.hint[lang])}</p>` : ''}</div>`;
}

function choiceField(p: Extract<ParamSpec, { kind: 'choice' }>, value: string, lang: Lang): string {
  const id = `f-${p.key}`;
  const hint = p.hint ? `<p class="hint">${esc(p.hint[lang])}</p>` : '';
  if (p.options.length > 3) {
    const opts = p.options.map((o) => `<option value="${esc(o.value)}"${o.value === value ? ' selected' : ''}>${esc(o.label[lang])}</option>`).join('');
    return `<div class="field"><label for="${id}">${esc(p.label[lang])}</label><div class="row"><select id="${id}" name="${p.key}">${opts}</select></div>${hint}</div>`;
  }
  const opts = p.options
    .map((o) => `<label><input type="radio" name="${p.key}" value="${esc(o.value)}"${o.value === value ? ' checked' : ''}><span>${esc(o.label[lang])}</span></label>`)
    .join('');
  return `<div class="field" role="radiogroup" aria-labelledby="${id}"><span class="label" id="${id}">${esc(p.label[lang])}</span><div class="seg">${opts}</div>${hint}</div>`;
}

function colorField(p: Extract<ParamSpec, { kind: 'color' }>, value: string, lang: Lang): string {
  const id = `f-${p.key}`;
  const none = value === 'none';
  const swatch = none ? p.default === 'none' ? '#ffffff' : p.default : value;
  const noneBtn = p.allowNone
    ? `<label class="check jsonly"><input type="checkbox" data-none-for="${p.key}"${none ? ' checked' : ''}>${esc(STRINGS[lang].none)}</label>`
    : '';
  return `<div class="field${none ? ' is-none' : ''}" data-color="${p.key}">
<label for="${id}">${esc(p.label[lang])}</label>
<div class="row"><input type="color" value="${esc(swatch)}" data-swatch-for="${p.key}" aria-label="${esc(p.label[lang])}"><input type="text" id="${id}" name="${p.key}" value="${esc(value)}" spellcheck="false" autocomplete="off" maxlength="7">${noneBtn}</div>
${p.hint ? `<p class="hint">${esc(p.hint[lang])}</p>` : ''}</div>`;
}

function boolField(p: Extract<ParamSpec, { kind: 'bool' }>, value: boolean, lang: Lang): string {
  // The hidden 0 comes first; a checked box adds a later 1, and the last value wins.
  return `<div class="field"><input type="hidden" name="${p.key}" value="0"><label class="check"><input type="checkbox" name="${p.key}" value="1"${value ? ' checked' : ''}>${esc(p.label[lang])}</label>${p.hint ? `<p class="hint">${esc(p.hint[lang])}</p>` : ''}</div>`;
}

export function renderForm(pattern: Pattern, values: Values, lang: Lang): string {
  const s = STRINGS[lang];
  const groups = (['shape', 'size', 'colour'] as const).map((g) => {
    const fields = pattern.params
      .filter((p) => p.group === g)
      .map((p) => {
        const v = values[p.key]!;
        switch (p.kind) {
          case 'number':
            return numberField(p, v as number, lang);
          case 'choice':
            return choiceField(p, v as string, lang);
          case 'color':
            return colorField(p, v as string, lang);
          case 'bool':
            return boolField(p, v as boolean, lang);
        }
      })
      .join('');
    return fields ? `<fieldset><legend>${esc(s.groups[g])}</legend>${fields}</fieldset>` : '';
  });
  return `<form class="card" id="controls" method="get" action="${pagePath(lang, pattern.id)}">
${groups.join('')}
<div class="form-actions"><button class="btn primary nojs" type="submit">${esc(s.update)}</button><a class="btn" id="reset" href="${pagePath(lang, pattern.id)}">${esc(s.reset)}</a></div>
</form>`;
}

/** PNG zooms offered, with those over the size limit disabled. */
function pngLinks(id: string, query: string, r: Rendered, lang: Lang): string {
  return [1, 2, 4]
    .map((k) => {
      const tooBig = Math.max(r.width, r.height) * k > PNG_LIMITS.maxSide;
      return `<a class="btn" data-scale="${k}" href="${apiPath(id, 'png', query, `scale=${k}&download=1`)}" download="${id}${k > 1 ? `@${k}x` : ''}.png"${tooBig ? ' aria-disabled="true"' : ''}>${k}×</a>`;
    })
    .join('');
}

export function renderPage(lang: Lang, pattern: Pattern, values: Values, rendered: Rendered, clientVersion: string): string {
  const s = STRINGS[lang];
  const other: Lang = lang === 'en' ? 'mn' : 'en';
  const query = toQuery(pattern.params, values);
  const canonical = pageUrl(lang, pattern.id);
  const title = `${pattern.name[lang]} · ${s.appName}`;
  const ogImage = PUBLIC_ORIGIN + apiPath(pattern.id, 'png', '', 'bg=fff6e6&padding=32&scale=2');
  const tabs = PATTERNS.map(
    (p) => `<a href="${pagePath(lang, p.id)}"${p.id === pattern.id ? ' aria-current="page"' : ''}>${esc(p.name[lang])}</a>`,
  ).join('');
  const warnings = rendered.warnings.map((w) => `<li>${esc(w[lang])}</li>`).join('');
  const how = (s.how[pattern.id] ?? []).map((para) => `<p>${esc(para)}</p>`).join('');
  return `<!doctype html>
<html lang="${LOCALE[lang].html}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(s.metaDescription)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${pageUrl('en', pattern.id)}">
<link rel="alternate" hreflang="mn" href="${pageUrl('mn', pattern.id)}">
<link rel="alternate" hreflang="x-default" href="${pageUrl('en', pattern.id)}">
<link rel="icon" href="${BASE_PATH}/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(s.avdar)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(pattern.summary[lang])}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="${LOCALE[lang].og}">
<meta name="theme-color" content="#fffaf2">
<style>${CSS}.rule{background-image:${bandTile('#b3261e', 3)}}</style>
<script>${INLINE_SCRIPT}</script>
<script type="module" src="${BASE_PATH}/static/app.js?v=${clientVersion}"></script>
</head>
<body data-pattern="${pattern.id}" data-base="${BASE_PATH}" data-origin="${PUBLIC_ORIGIN}" data-lang="${lang}" data-copied="${esc(s.copied)}" data-max-side="${PNG_LIMITS.maxSide}">
<header>
  <div class="bar">
    <a class="brand" href="${pagePath(lang, DEFAULT_PATTERN)}"><b>${esc(s.appName)}</b><span>${esc(s.subtitle)}</span></a>
    <a class="lang" href="${pagePath(lang, pattern.id)}?hl=${other}${query ? `&${query}` : ''}" hreflang="${other}" rel="alternate">${esc(s.switchTo)}</a>
  </div>
  <div class="rule" role="presentation"></div>
</header>
<nav aria-label="${esc(s.appName)}">${tabs}</nav>
<main>
  <div class="intro"><h1>${esc(pattern.name[lang])}</h1><p>${esc(pattern.summary[lang])} ${esc(s.lead)}</p></div>
  <div class="layout">
    <section class="card preview" aria-live="polite">
      <div class="stage" id="stage">${rendered.svg}</div>
      <p class="meta"><span id="dims">${rendered.width} × ${rendered.height} ${esc(s.pixels)}</span></p>
      <ul class="warnings" id="warnings">${warnings}</ul>
      <div class="actions">
        <a class="btn primary" id="dl-svg" href="${apiPath(pattern.id, 'svg', query, 'download=1')}" download="${pattern.id}.svg">${esc(s.downloadSvg)}</a>
        <span class="pngs" id="dl-png"><span>${esc(s.downloadPng)}</span>${pngLinks(pattern.id, query, rendered, lang)}</span>
        <button class="btn jsonly" type="button" id="copy-svg">${esc(s.copySvg)}</button>
        <button class="btn jsonly" type="button" id="copy-link">${esc(s.copyLink)}</button>
      </div>
      <div class="sub" id="css"${rendered.css ? '' : ' hidden'}>
        <h2>${esc(s.cssTitle)}</h2><p>${esc(s.cssText)}</p>
        <pre id="css-code">${esc(rendered.css ?? '')}</pre>
      </div>
      <div class="sub">
        <h2>${esc(s.apiTitle)}</h2><p>${esc(s.apiText)}</p>
        <div class="copyline"><input readonly id="api-url" aria-label="${esc(s.apiTitle)}" value="${esc(PUBLIC_ORIGIN + apiPath(pattern.id, 'svg', query))}"></div>
      </div>
    </section>
    ${renderForm(pattern, values, lang)}
  </div>
  <section class="how card">
    <h2>${esc(s.howTitle)}</h2>
    ${how}
    <p class="src">${esc(s.sourcesText)} <a href="${REPO_URL}/blob/main/docs/GEOMETRY.md">${esc(s.sourceLink)}</a></p>
  </section>
</main>
<footer>${esc(s.partOf)} <a href="${PUBLIC_ORIGIN}/${lang === 'mn' ? 'mn' : ''}">${esc(s.avdar)}</a> · <a href="${REPO_URL}">GitHub</a></footer>
</body>
</html>`;
}

export function sitemapXml(): string {
  const urls = PATTERNS.map((p) => {
    const alt = `
    <xhtml:link rel="alternate" hreflang="en" href="${pageUrl('en', p.id)}"/>
    <xhtml:link rel="alternate" hreflang="mn" href="${pageUrl('mn', p.id)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('en', p.id)}"/>`;
    return (['en', 'mn'] as const).map((l) => `  <url><loc>${pageUrl(l, p.id)}</loc>${alt}\n  </url>`).join('\n');
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

export function llmsTxt(): string {
  const s = STRINGS.en;
  const list = PATTERNS.map((p) => {
    const params = p.params
      .map((x) => {
        const range = x.kind === 'number' ? ` ${x.min}–${x.max}` : x.kind === 'choice' ? ` ${x.options.map((o) => o.value).join('|')}` : x.kind === 'color' ? ' hex' : ' 0|1';
        return `${x.key} (${x.label.en}:${range}, default ${String(x.default)})`;
      })
      .join('; ');
    return `- [${p.name.en}](${pageUrl('en', p.id)}): ${p.summary.en}\n  Image: ${PUBLIC_URL}/api/${p.id}.svg or .png?scale=1|2|4. Parameters: ${params}.`;
  }).join('\n');
  return `# ${s.appName}: ${s.subtitle}

> ${s.metaDescription}

Part of Byambaa's Avdar (${PUBLIC_ORIGIN}). English and Mongolian. Source and documentation: ${REPO_URL}

## Patterns

${list}

## API

GET ${PUBLIC_URL}/api lists every pattern and its parameters as JSON. Colours are hex without "#", e.g. ink=1b120b; "none" makes a background transparent. Out-of-range values are clamped.
`;
}
