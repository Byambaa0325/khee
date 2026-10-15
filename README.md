# Khee · Хээ

Mongolian ornament drawn by rule, not by eye. Three generators, each an exact construction rendered as SVG:

| Pattern | Rule |
|---|---|
| **Ulzii** (өлзий), the endless knot | An odd n × n grid of crossings; consecutive loose ends joined in pairs; the vertical band is over where i + j is even. n = 3 is the knot 7₄. |
| **Alkhan khee** (алхан хээ), the hammer border | Every stroke and every gap is one module. The band comes out 7 modules deep, repeating every 8. Frame, strip or CSS border image. |
| **Ugalz** (угалз), horn scrolls | Chains of tangent quarter circles, each smaller than the last by a fixed ratio: a compass-built logarithmic spiral. Horns, single scrolls, rosettes. |

The rules, their sources and the checks behind them: [docs/GEOMETRY.md](docs/GEOMETRY.md).

The self-serve generator runs at **https://avdar.me/khee**: set the parameters and download SVG or PNG, or
use the image URL directly. It is part of [Byambaa's Avdar](https://avdar.me), in English and Mongolian.

## Image API

Every setting is a query parameter; the page's address and the image's address carry the same settings.

```
https://avdar.me/khee/api/ulzii.svg?n=5&turn=45
https://avdar.me/khee/api/alkhan.png?layout=frame&across=8&scale=2
https://avdar.me/khee/api/ugalz.svg?form=rosette&count=8&fill=1990d5
```

- `GET /khee/api` lists every pattern and parameter as JSON.
- Colours are hex without `#`. `bg=none` (the default) keeps the background transparent.
- PNG takes `scale=1|2|4`, up to 4096 px per side. `download=1` sends it as an attachment.
- Out-of-range values are clamped, never rejected.

## Library

`src/lib` has no dependencies and runs in Node and in the browser (the page's live preview uses it).

```ts
import { ulzii, defaults, parseValues } from './src/lib/index.js';

const { svg, width, height, warnings } = ulzii.render({ ...defaults(ulzii.params), n: 5, loops: 'square' });
```

Each pattern is `{ id, name, summary, params, render(values) }`. `params` describes every parameter (type,
range, default, English and Mongolian labels); `parseValues` turns untrusted strings into clamped values.
Lower-level geometry is exported too: `ulziiGeometry`, `ulziiCircuits`, `alkhanGeometry`, `arcChain`.

From the command line:

```bash
npm run render -- alkhan out/border layout=nineslice corner=box   # writes out/border.svg and .png
```

## Develop

```bash
npm install
npm run dev        # http://localhost:8080/khee
npm test
npm run typecheck
```

Env: `PORT`, `BASE_PATH` (default `/khee`), `PUBLIC_ORIGIN` (default `https://avdar.me`),
`RATE_LIMIT_PER_MINUTE` (120), `RATE_LIMIT_INSTANCE_PER_SECOND` (200), `TRUSTED_PROXIES` (1),
`MAX_BODY_BYTES` (16384), `PNG_MAX_SIDE` (4096).

## Deploy

Pushing to `main` builds the Dockerfile and rolls the `khee` Cloud Run service (project `lazy-jeopardy`,
region europe-west1) to the new image. The shared pattern for Avdar apps, including first deploy, the
trigger, service settings, gateway registration and abuse protection, lives in the avdar repo at
`docs/DEPLOYMENT.md`.

## Licence

MIT. See [LICENSE](LICENSE).
