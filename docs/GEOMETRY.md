# The geometry behind the patterns

What each generator draws, the rule it follows, where the rule comes from, and how strong that evidence
is. Evidence labels:

| Label | Meaning |
|---|---|
| [S] | Stated in a scholarly, reference or technical source that was read |
| [S-sum] | Seen only through an abstract, snippet or third-party summary |
| [B] | Blog, guide or trade page |
| [C] | Computed or constructed for this project; checked by the tests in `test/patterns.test.ts` |

## 1. Ulzii (өлзий), the endless knot

**Rule.**

1. Take an n × n grid of crossings, n odd. Crossing (i, j) sits at ((j + 1)·s, (i + 1)·s).
2. Run every row and every column out to a loose end: 4n ends. List them clockwise from the top-left.
3. Join consecutive ends in pairs (1–2, 3–4, …). Each side has an odd number of ends, so exactly two
   pairs wrap a corner, at opposite corners. Those loops are the knot's two ears. Pairing from the
   second end (2–3, …) gives the mirror image.
4. At crossing (i, j) the vertical band passes over when i + j is even.

The loop shape (square, round, wavy) does not change the knot. Turning the drawing 45° gives the Tibetan
diamond, with the ears at two opposite points.

**Facts behind it.**

| Statement | Evidence |
|---|---|
| The interlaced simple endless knot is the knot 7₄, "though it appears to have nine crossings" | Wikipedia, *7₄ knot* [S] |
| Endless-knot forms have 9, 25, 49 and 81 drawn crossings, of which 7, 23, 47 and 79 are essential: always an odd square | Knot Atlas, *Endless knot symbol* [S] |
| 7₄: Jones polynomial −q⁸ + q⁷ − 2q⁶ + 3q⁵ − 2q⁴ + 3q³ − 2q² + q, determinant 15, alternating, genus 1 | Knot Atlas, *7_4* [S] |
| The n = 3 closure above has exactly that Jones polynomial; of all 132 non-crossing closures of the 3 × 3 grid, only this one and its mirror are 7₄ | [C] (research computation, Kauffman bracket) |
| Odd n closes into one band; the two ears are removable twists, so the knot has n² − 2 essential crossings | [C]; matches the Knot Atlas counts |
| Even n never closes into one band: n bands without corner loops, n − 1 with all four | [C], tested up to 8 × 8; agrees with a Bridges 2008 artist's note that 4 × 4 forms are "false" knots |
| The checkerboard rule makes the band alternate over and under along its whole length, loops included | [C], tested for n = 3…9 in both phases |
| Every design made this way is an alternating link projection | Gross & Tucker, *A Celtic Framework for Knots and Links*, DCG 2011 [S] |

**Symmetry [C].** As a line drawing the 3 × 3 knot has symmetry D₂ (a half turn and the two diagonal
mirrors). With over/under shown, only the half turn remains. An alternating endless knot with an odd grid
cannot be exactly 4-fold symmetric, even when its outline looks it.

**Not documented.** No Tibetan or Mongolian drawing procedure for the knot was found.

## 2. Alkhan khee (алхан хээ), the hammer border

**Rule.** J. Tömörkhuyag, *Хээ угалз бүтээх аргууд* (Ulaanbaatar, 2010), as summarised in a 2012 blog
post by Sh. Jigjid [B, summary of a book]:

- Ornament is laid out with layout lines, not drawn freehand.
- A *хээ бүтээх мод* (ornament-building stick) sets the module, sized to the object. Stick ratios are odd:
  3, 5, 7, 9, 11, 13, 15.
- The gap between strands is one module, whatever stick is used. If the pattern does not fit, the module
  shrinks.
- Worked example: a quilted felt with 108 alkhan units laid out with a 7-module stick.

**Consequence [C].** With every stroke and every gap one module wide, a band of T-hammers hung alternately
from the outer and inner rules is 7 modules deep and repeats every 8. Table 1 gives one period. A painted
chest measured by image fitting for avdar.me had period 32 px on a 28 px band: exactly 8 : 7 with a 4 px
module. That agreement is one measurement against one secondary source.

Table 1. One period of the band, in modules. x along the band, y inwards from the outer edge; P = 8.

| Element | x | y |
|---|---|---|
| Outer rule | 0 – 8 | 0 – 1 |
| Inner rule | 0 – 8 | 6 – 7 |
| Stem hung from the outer rule | 0 – 1 | 1 – 4 |
| Its head | −2 – 3 | 4 – 5 |
| Stem hung from the inner rule | 4 – 5 | 3 – 6 |
| Its head | 2 – 7 | 2 – 3 |

Ink covers 32 of 56 cells per period. The frieze group is p2mg (Washburn & Crowe notation pma2): mirrors
through every stem, a glide, half turns; no horizontal mirror [C].

**Stem width.** The rule makes stems as wide as bars. The measured chest had stems about 1.5 bars wide.
No source documents that, so it is a separate parameter (default 1).

**Corners [C].** No source documents the corner. Each side is mitred into the next along the corner
diagonal. For the four corners of a rectangle to be the same figure, each side must be mirror-symmetric
about its middle, which fixes its length to 8p + (2·phase + 1) mod 8 modules. Of the 8 phases, two make a
clean figure that keeps every gap at one module:

- **Hook** (phase 6, sides 8p + 5): the meeting heads bend into a squared spiral, joined to the next stem so
  that every stroke hangs from a rule.
- **Box** (phase 4, sides 8p + 1): a square with a free dot at the centre.

A CSS nine-slice border image needs exactly one period between corners. The symmetric corner slice is then
8.5 modules (box) or 10.5 (hook): the band plus an inner margin.

## 3. Ugalz (угалз), horn and cloud scrolls

**Rule.** A scroll is a chain of tangent circular arcs, each a quarter turn, with radius rₖ = R·qᵏ. Two arcs
join smoothly when the joint and both centres are collinear: c₍ₖ₊₁₎ = cₖ + (rₖ − r₍ₖ₊₁₎)·uₖ, where uₖ
points from cₖ to the joint.

| Statement | Evidence |
|---|---|
| Chinese auspicious-cloud curls are built from semicircles with diameters l, d·l, d²·l, …; a standard spiral equation "will give people mechanical sense" | Fang, Cao & Huang, *Procedural Modelling of Auspicious Cloud*, ICMEIT 2019 [S] |
| The Ionic volute is drawn with tangent arcs from successive centres (Vitruvius, Alberti, Nicholson, Pennethorne) | Ekwall, *Nexus Network Journal* [S] |
| Quarter-circle chains approximate any logarithmic spiral, not only the golden one | Reitebuch, Skrodzki & Polthier, Bridges 2021 [S-sum] |
| A ratio-q quarter-arc chain stays within 0.24 % (q = 0.9) to 1.35 % (q = 0.6) of the best-fit logarithmic spiral, which grows q⁻⁴ per turn | [C] |
| A constant-width band around a circular arc is two concentric arcs, so the ribbon is exact in SVG | geometry |
| Ruminant horns grow as equiangular (logarithmic) spirals | D'Arcy Thompson [S] |

**Not documented.** No measured growth rate and no documented construction exists for Mongolian ugalz,
Tibetan clouds or the Kazakh ram's-horn motif. The default q = 0.8 is a starting point, not a canon. A
curvature test on a scan would settle it: on a logarithmic spiral the radius of curvature grows linearly
with arc length; on a compass-arc chain it is a step function.

**Rosettes.** Tömörkhuyag records Mongolian ornament with 2-, 3-, 4-, 5-, 6-, 8-, 10-, 12- and 16-fold
repeats [B, summary of a book]; the generator offers exactly those.

## 4. What is not here

**Tibetan iconometry** (the thangka grid, 1 face = 12 digits, a Buddha 120 or 125 digits tall) and
**mandala layout** (snapped chalk cords on a grid of cardinal and diagonal lines) are documented canons,
but they govern figures, stupas and mandala ground plans. Sources say backgrounds and ornament are left
to the painter. Rubin Museum; Himalayan Art Resources [S].

**Golden ratio, flower of life, Sri Yantra.** No source found measures φ in these ornaments with a stated
sample size and tolerance; the two papers that report φ in thangka faces give neither [S-sum]. On an
integer grid, ratios such as 13/8 (+0.43 %) and 21/13 (−0.16 %) land near φ without any intent, so such
claims need a tolerance and a comparison with chance before they mean anything. The mathematics these
patterns do have is integer: grids, modules, knot topology and symmetry groups.

## 5. Limitations

1. Tömörkhuyag (2010) was seen only through a blog summary; its figures were unreadable. The alkhan rule
   rests on that one secondary source.
2. The 7 : 8 match is one image fit with integer values and no error bars.
3. Knot statements beyond the published tables are computations, exhaustive for 3 × 3 and tested for
   grids up to 9 × 9; the knot types of the 25-, 49- and 81-crossing forms are not identified.
4. The corner designs and the scroll ratio are this project's choices, not documented tradition.
