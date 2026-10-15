export const LANGS = ['en', 'mn'] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (x: unknown): x is Lang => LANGS.includes(x as Lang);

/** BCP 47 tags for <html lang>, hreflang and og:locale. */
export const LOCALE: Record<Lang, { html: string; og: string }> = {
  en: { html: 'en', og: 'en_US' },
  mn: { html: 'mn', og: 'mn_MN' },
};

export interface Strings {
  appName: string;
  subtitle: string;
  metaDescription: string;
  lead: string;
  groups: { shape: string; size: string; colour: string };
  downloadSvg: string;
  downloadPng: string;
  scale: string;
  copySvg: string;
  copyLink: string;
  copied: string;
  reset: string;
  update: string;
  none: string;
  palettes: string;
  palettesHint: string;
  pixels: string;
  apiTitle: string;
  apiText: string;
  cssTitle: string;
  cssText: string;
  howTitle: string;
  sourcesText: string;
  sourceLink: string;
  colourLink: string;
  partOf: string;
  avdar: string;
  switchTo: string;
  /** How each pattern is constructed, a few short paragraphs. */
  how: Record<string, string[]>;
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    appName: 'Khee',
    subtitle: 'Mongolian ornament by rule',
    metaDescription:
      'Generate Mongolian ornaments by their geometric rules: the ulzii endless knot, the alkhan khee hammer border and ugalz horn scrolls. Set the parameters, download SVG or PNG.',
    lead: 'Mongolian ornaments drawn by their rules, not by eye. Set the parameters, then download SVG or PNG.',
    groups: { shape: 'Shape', size: 'Size', colour: 'Colour' },
    downloadSvg: 'Download SVG',
    downloadPng: 'Download PNG',
    scale: 'PNG scale',
    copySvg: 'Copy SVG',
    copyLink: 'Copy link',
    copied: 'Copied',
    reset: 'Reset',
    update: 'Update',
    none: 'None',
    palettes: 'Palettes',
    palettesHint: 'Each palette comes from Mongolian colour symbolism. Tap one to apply it, then fine-tune any colour below.',
    pixels: 'px',
    apiTitle: 'Use it as an image URL',
    apiText: 'Every setting is in the address. The same settings under /api return the image itself, so the link works in an <img> tag or a stylesheet.',
    cssTitle: 'CSS for a bordered box',
    cssText: 'Save the SVG next to your stylesheet as alkhan.svg, then give any box these two lines. The border tiles to fit.',
    howTitle: 'How it is drawn',
    sourcesText: 'The rules, their sources and the checks behind them are written up in the repository.',
    sourceLink: 'Source code and documentation (MIT)',
    colourLink: 'What the palettes mean, and their sources',
    partOf: 'A small app from',
    avdar: "Byambaa's Avdar",
    switchTo: 'Монгол',
    how: {
      ulzii: [
        'The knot is a weave on a square grid. An odd number n of rows and columns cross n² times, and each row and column runs out to two loose ends: 4n ends in all.',
        'Going round the grid, neighbouring ends are joined in pairs by loops. With an odd number of ends on each side, exactly two pairs have to wrap a corner. Those are the two small ears.',
        'At the crossing in row i and column j, the vertical band goes over when i + j is even. The band then alternates over and under all the way round. The 3 × 3 grid is the knot listed in knot tables as 7₄: drawn with 9 crossings, 2 of which are the twists of the ears. An even grid never closes into one band.',
      ],
      alkhan: [
        'Mongolian craftsmen lay ornament out with a module stick (хээ бүтээх мод): every stroke and every gap between strokes is one module wide (J. Tömörkhuyag, 2010).',
        'Hammers hung alternately from the outer and the inner rule then fill a band 7 modules deep that repeats every 8 modules. A painted chest measured for avdar.me shows exactly this 7 : 8 ratio.',
        'No source documents the corner. Here each side is mitred into the next at the point where the meeting hammer heads bend into a hook, or close into a box with a dot. Both keep every gap one module wide.',
      ],
      ugalz: [
        'Each scroll is a chain of quarter circles. Every arc has the radius of the one before times a fixed ratio, and joins it with the same tangent.',
        'That is the compass construction of the Chinese auspicious cloud and of the Ionic volute. It follows a logarithmic spiral to within 1.4 %, and in SVG each quarter turn is one exact arc.',
        'Nobody has measured the ratio in Mongolian ugalz, so the default is a starting point, not a canon. Rosettes offer the repeat counts recorded for Mongolian ornament: 2, 3, 4, 5, 6, 8, 10, 12 and 16.',
      ],
    },
  },
  mn: {
    appName: 'Хээ',
    subtitle: 'Монгол хээг дүрмээр нь',
    metaDescription:
      'Монгол хээг геометрийн дүрмээр нь үүсгэ: өлзий, алхан хээ, эвэр угалз. Тохиргоогоо сонгоод SVG эсвэл PNG файлаар татаж аваарай.',
    lead: 'Монгол хээг нүдэн баримжаагаар бус, дүрмээр нь зурна. Тохиргоогоо сонгоод SVG эсвэл PNG-ээр татаж аваарай.',
    groups: { shape: 'Хэлбэр', size: 'Хэмжээ', colour: 'Өнгө' },
    downloadSvg: 'SVG татах',
    downloadPng: 'PNG татах',
    scale: 'PNG томруулалт',
    copySvg: 'SVG хуулах',
    copyLink: 'Холбоос хуулах',
    copied: 'Хуулсан',
    reset: 'Анхны утга',
    update: 'Шинэчлэх',
    none: 'Байхгүй',
    palettes: 'Өнгөний хослол',
    palettesHint: 'Хослол бүр монгол өнгөний бэлгэдэлд тулгуурласан. Нэгийг дарж хэрэглээд, доорх өнгө бүрийг хүссэнээрээ тохируулна уу.',
    pixels: 'px',
    apiTitle: 'Зургийн холбоос болгон ашиглах',
    apiText: 'Бүх тохиргоо хаягт байна. Ижил тохиргоог /api хаягаар дуудвал зураг өөрөө ирэх тул <img> эсвэл CSS-д шууд хэрэглэж болно.',
    cssTitle: 'Хүрээтэй хайрцгийн CSS',
    cssText: 'SVG файлыг alkhan.svg нэрээр CSS файлынхаа хажууд хадгалаад дурын хайрцагт энэ хоёр мөрийг өгнө. Хүрээ нь хэмжээнд тааруулан давтагдана.',
    howTitle: 'Хэрхэн зурдаг вэ',
    sourcesText: 'Дүрэм, эх сурвалж, шалгалтын дэлгэрэнгүйг агуулахаас үзнэ үү.',
    sourceLink: 'Эх код ба баримт бичиг (MIT)',
    colourLink: 'Өнгөний хослолын утга, эх сурвалж',
    partOf: 'Жижиг апп ·',
    avdar: 'Бямбаагийн Авдар',
    switchTo: 'English',
    how: {
      ulzii: [
        'Өлзий бол дөрвөлжин тор дээрх сүлжээс. Сондгой n тооны мөр, багана n² удаа огтлолцох ба мөр, багана бүр хоёр сул үзүүртэй: нийт 4n үзүүр.',
        'Торыг тойрон хөрш үзүүрүүдийг хосоор нь гогцоогоор холбоно. Тал бүрд сондгой тооны үзүүр байгаа тул яг хоёр хос булан тойрох ёстой. Тэр нь өлзийн хоёр жижиг чих.',
        'i-р мөр, j-р баганын огтлолцолд i + j тэгш бол босоо тууз дээгүүр гарна. Ингэснээр тууз бүхэлдээ дээгүүр, доогуур ээлжилнэ. 3 × 3 тор нь зангилааны онолд 7₄ гэж бүртгэгдсэн зангилаа: 9 огтлолцолтой зурагдах ба үүний 2 нь чихний мушгиа. Тэгш тор хэзээ ч нэг тууз болж битүүрдэггүй.',
      ],
      alkhan: [
        'Монгол урчууд хээг хээ бүтээх модоор байгуулдаг: зураас бүр, зураас хоорондын завсар бүр нэг мод өргөн (Ж. Төмөрхуяг, 2010).',
        'Гадна, дотор хүрээнээс ээлжлэн унжсан алх 7 мод өргөн, 8 мод тутамд давтагдах хүрээг дүүргэнэ. avdar.me-д хэмжсэн будгийн авдар яг энэ 7 : 8 харьцаатай.',
        'Булангийн дүрэм эх сурвалжид байхгүй. Энд тал бүрийг дараагийнхтай нь налуу огтлолоор нийлүүлж, нийлж буй алхны толгой дэгээ болж нугалагдах эсвэл цэгтэй хайрцаг болж битүүрэх байрлалыг сонгосон. Аль аль нь завсар бүрийг нэг мод өргөн байлгана.',
      ],
      ugalz: [
        'Угалз бүр дугуйн дөрөвний нэг нумуудын гинж. Нум бүрийн радиус өмнөхийнхөө тогтмол харьцаатай үржвэр бөгөөд ижил шүргэгчээр залгагдана.',
        'Энэ бол Хятадын ёлтой үүл, Грекийн ион баганын эргүүлгийг циркулиар байгуулах арга. Логарифм спиралаас 1.4 %-иас илүү зөрөхгүй бөгөөд SVG-д дөрөвний нэг эргэлт бүр нэг яг нум болно.',
        'Монгол угалзын харьцааг хэн ч хэмжээгүй тул анхны утга нь зөвхөн эхлэл, дүрэм биш. Тойрог угалзад монгол хээнд тэмдэглэгдсэн давталтын тоог санал болгоно: 2, 3, 4, 5, 6, 8, 10, 12, 16.',
      ],
    },
  },
};
