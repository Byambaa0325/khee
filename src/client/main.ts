/**
 * Live generator. The page works without this script (the form submits and the server renders);
 * with it, every change re-renders in the browser with the same library the server uses, and the
 * address, download links and API URL follow the settings.
 */
import { PALETTES, matchingPalette, paletteValues, parseValues, patternById, toQuery, type Rendered, type Values } from '../lib/index.js';

const body = document.body;
const pattern = patternById(body.dataset.pattern ?? '');
const form = document.getElementById('controls') as HTMLFormElement | null;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

if (pattern && form) {
  const lang = body.dataset.lang === 'mn' ? 'mn' : 'en';
  const base = body.dataset.base ?? '';
  const origin = body.dataset.origin ?? location.origin;
  const maxSide = Number(body.dataset.maxSide) || 4096;
  const copiedText = body.dataset.copied ?? 'Copied';
  let svg = $('stage')?.innerHTML ?? '';

  const read = (): Values => {
    const raw: Record<string, string> = {};
    for (const [k, v] of new FormData(form)) raw[k] = String(v);
    return parseValues(pattern.params, raw);
  };

  const api = (ext: 'svg' | 'png', q: string, extra = '') => {
    const all = [q, extra].filter(Boolean).join('&');
    return `${base}/api/${pattern.id}.${ext}${all ? `?${all}` : ''}`;
  };

  function show(r: Rendered, q: string) {
    svg = r.svg;
    const stage = $('stage');
    if (stage) stage.innerHTML = r.svg;
    const dims = $('dims');
    if (dims) dims.textContent = `${r.width} × ${r.height} px`;
    const warnings = $('warnings');
    if (warnings) warnings.innerHTML = r.warnings.map((w) => `<li>${esc(w[lang])}</li>`).join('');
    const css = $('css');
    if (css) {
      css.hidden = !r.css;
      const code = $('css-code');
      if (code) code.textContent = r.css ?? '';
    }
    $<HTMLAnchorElement>('dl-svg')?.setAttribute('href', api('svg', q, 'download=1'));
    document.querySelectorAll<HTMLAnchorElement>('#dl-png a[data-scale]').forEach((a) => {
      const k = Number(a.dataset.scale);
      a.href = api('png', q, `scale=${k}&download=1`);
      if (Math.max(r.width, r.height) * k > maxSide) a.setAttribute('aria-disabled', 'true');
      else a.removeAttribute('aria-disabled');
    });
    const apiUrl = $<HTMLInputElement>('api-url');
    if (apiUrl) apiUrl.value = origin + api('svg', q);
    history.replaceState(null, '', q ? `${location.pathname}?${q}` : location.pathname);
    const switcher = document.querySelector<HTMLAnchorElement>('a.lang');
    if (switcher) {
      const other = lang === 'en' ? 'mn' : 'en';
      switcher.href = `${location.pathname}?hl=${other}${q ? `&${q}` : ''}`;
    }
  }

  let queued = false;
  const update = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const values = read();
      show(pattern.render(values), toQuery(pattern.params, values));
      markPalette();
    });
  };

  // Range sliders carry no name; they drive the number box next to them, which the form submits.
  form.querySelectorAll<HTMLInputElement>('input[type=range][data-for]').forEach((range) => {
    const box = form.elements.namedItem(range.dataset.for!) as HTMLInputElement;
    range.addEventListener('input', () => (box.value = range.value));
    box.addEventListener('input', () => {
      if (box.value !== '') range.value = box.value;
    });
    range.tabIndex = 0;
  });

  // Colours: the well (native picker), the chips and the text box all set one value; the text box is
  // what the form submits.
  const fullHex = (c: string) => {
    const v = c.trim().toLowerCase();
    const h = v.startsWith('#') ? v : `#${v}`;
    if (/^#[0-9a-f]{6}$/.test(h)) return h;
    if (/^#[0-9a-f]{3}$/.test(h)) return `#${[...h.slice(1)].map((x) => x + x).join('')}`;
    return null;
  };
  /** Reflects a field's current value in its well and chips. */
  const paintField = (field: HTMLElement) => {
    const text = form.elements.namedItem(field.dataset.color!) as HTMLInputElement;
    const none = text.value.trim().toLowerCase() === 'none';
    const hex = fullHex(text.value);
    field.classList.toggle('is-none', none);
    const well = field.querySelector<HTMLElement>('.well');
    const swatch = field.querySelector<HTMLInputElement>('input[type=color]');
    if (hex) {
      well?.style.setProperty('--c', hex);
      if (swatch) swatch.value = hex;
    }
    field.querySelectorAll<HTMLButtonElement>('.chip').forEach((chip) => {
      chip.setAttribute('aria-pressed', String(chip.dataset.set === 'none' ? none : !none && chip.dataset.set === hex));
    });
  };
  const setColour = (key: string, value: string) => {
    const text = form.elements.namedItem(key) as HTMLInputElement | null;
    const field = form.querySelector<HTMLElement>(`[data-color="${key}"]`);
    if (!text || !field) return;
    text.value = value;
    paintField(field);
  };
  form.querySelectorAll<HTMLElement>('[data-color]').forEach((field) => {
    const key = field.dataset.color!;
    const text = form.elements.namedItem(key) as HTMLInputElement;
    field.querySelector<HTMLInputElement>('input[type=color]')?.addEventListener('input', (e) => setColour(key, (e.target as HTMLInputElement).value));
    text.addEventListener('input', () => paintField(field));
    field.querySelectorAll<HTMLButtonElement>('.chip').forEach((chip) =>
      chip.addEventListener('click', () => {
        setColour(key, chip.dataset.set!);
        update();
      }),
    );
  });

  // Palette cards are links that also work without script; here they apply in place.
  const meaning = $('pal-meaning');
  const defaultMeaning = meaning?.textContent ?? '';
  const cards = [...document.querySelectorAll<HTMLAnchorElement>('a.pal')];
  const markPalette = () => {
    const values = read();
    const active = matchingPalette(pattern, values);
    cards.forEach((c) => (c.dataset.palette === active?.id ? c.setAttribute('aria-current', 'true') : c.removeAttribute('aria-current')));
    if (meaning) meaning.textContent = active ? `${active.name[lang]}: ${active.meaning[lang]}` : defaultMeaning;
  };
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      const palette = PALETTES.find((p) => p.id === card.dataset.palette);
      if (!palette) return;
      e.preventDefault();
      for (const [key, value] of Object.entries(paletteValues(pattern, palette))) setColour(key, String(value));
      update();
    });
    // Hovering or focusing a card shows its meaning; leaving restores the active one.
    const show = () => meaning && (meaning.textContent = `${card.querySelector('.pal-name')?.textContent}: ${card.dataset.meaning}`);
    card.addEventListener('mouseenter', show);
    card.addEventListener('focus', show);
    card.addEventListener('mouseleave', markPalette);
    card.addEventListener('blur', markPalette);
  });

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    update();
  });

  const flash = (button: HTMLButtonElement) => {
    const label = button.textContent;
    button.textContent = copiedText;
    setTimeout(() => (button.textContent = label), 1400);
  };
  const copy = (id: string, text: () => string) => {
    const button = $<HTMLButtonElement>(id);
    button?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text());
        flash(button);
      } catch {
        // Clipboard can be blocked (permissions, insecure context); the downloads still work.
      }
    });
  };
  copy('copy-svg', () => svg);
  copy('copy-link', () => location.href);
  $<HTMLInputElement>('api-url')?.addEventListener('focus', (e) => (e.target as HTMLInputElement).select());
}
