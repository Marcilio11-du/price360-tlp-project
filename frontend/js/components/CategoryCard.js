/**
 * @file CategoryCard.js
 * @description Card de categoria com ícones SVG temáticos que correspondem ao protótipo.
 */

/** Ícones SVG para cada categoria — viewBox="0 0 24 24", estilo stroke azul */
const ICONS = {
  /* ── Cereais / Grão / Trigo ── */
  cereal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22v-9"/>
    <path d="M12 13c-1.5-1.5-4-4-4-6.5C8 4.5 9.8 3 12 3s4 1.5 4 3.5c0 2.5-2.5 5-4 6.5z"/>
    <path d="M8.5 15.5c-1.5-1-3-3-3-5"/>
    <path d="M15.5 15.5c1.5-1 3-3 3-5"/>
  </svg>`,

  /* ── Bebidas / Água / Sumos ── */
  bebida: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 2h8l1.5 11A3 3 0 0114.5 16h-5A3 3 0 016.5 13L8 2z"/>
    <path d="M7.5 7h9"/>
    <path d="M10 11c.5 1 1.5 1.5 2 1"/>
    <path d="M12 16v5M9 21h6"/>
  </svg>`,

  /* ── Higiene Pessoal / Mãos a lavar ── */
  higiene: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 12.5C7 10 9.2 8 12 8s5 2 5 4.5V15a5 5 0 01-10 0v-2.5z"/>
    <path d="M8.5 5.5l.5 1.5M12 4v2M15.5 5.5l-.5 1.5"/>
    <path d="M5 9l1 1M19 9l-1 1"/>
  </svg>`,

  /* ── Frutas / Uvas ── */
  fruta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="13" r="2"/>
    <circle cx="15" cy="13" r="2"/>
    <circle cx="12" cy="9"  r="2"/>
    <circle cx="9" cy="17" r="2"/>
    <circle cx="15" cy="17" r="2"/>
    <path d="M12 7V4M12 4c0 0 2-2 4-1"/>
  </svg>`,

  /* ── Lacticínios / Leite ── */
  laticinios: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 2h8l2 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6L8 2z"/>
    <path d="M7 6h10"/>
    <text x="12" y="15" text-anchor="middle" font-size="6" font-weight="bold" fill="currentColor" stroke="none">M</text>
  </svg>`,

  /* ── Carnes / Frango / Carne ── */
  carne: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 4.5c2.5 0 5 2 5 5 0 4-4 7-8 9.5C7.5 16.5 4 14 3.5 10.5S5 4.5 8.5 5"/>
    <circle cx="8" cy="17" r="2"/>
    <path d="M9.5 15.5l5-7"/>
  </svg>`,

  /* ── Limpeza / Spray ── */
  limpeza: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 22V12a1 1 0 011-1h4a1 1 0 011 1v10"/>
    <path d="M9 16h6"/>
    <path d="M14 11V8h3V6h-3V4h-3v7"/>
    <path d="M17 8h3"/>
    <path d="M19 6v4"/>
  </svg>`,

  /* ── Padaria / Pão ── */
  padaria: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 14c0-4.5 2.7-8 6-8s6 3.5 6 8"/>
    <rect x="4" y="14" width="16" height="5" rx="2"/>
    <path d="M9 14v5M12 14v5M15 14v5"/>
  </svg>`,

  /* ── Bebé / Carrinho ── */
  bebe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9h10l2 6H5L3 9z"/>
    <path d="M13 9V6a3 3 0 013-3h2"/>
    <circle cx="7"  cy="18" r="2"/>
    <circle cx="14" cy="18" r="2"/>
    <path d="M5 9l-2-5"/>
  </svg>`,

  /* ── Banho / Duche / Chuveiro ── */
  banho: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 6c0-1.7 1.3-3 3-3s3 1.3 3 3"/>
    <path d="M6 6h12"/>
    <circle cx="8"  cy="10" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="10" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="10" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="8"  cy="14" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="14" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="14" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="8"  cy="18" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="16" cy="18" r="0.8" fill="currentColor" stroke="none"/>
  </svg>`,

  /* ── Telemóveis / Smartphones ── */
  telemovel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="2.5" width="10" height="19" rx="2.5"/>
    <path d="M11 18.5h2"/>
    <path d="M10 5.5h4"/>
  </svg>`,

  /* ── Laptops / Computadores ── */
  laptop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4.5" y="4.5" width="15" height="10" rx="1.5"/>
    <path d="M2.5 18.5h19"/>
    <path d="M9 15l-.7 3.5M15 15l.7 3.5"/>
  </svg>`,

  /* ── Monitores / TV / Ecrãs interativos ── */
  monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="12.5" rx="2"/>
    <path d="M9 20.5h6M12 16.5v4"/>
    <path d="M7.5 8.5l2.5 2-2.5 2M12.5 12.5H16"/>
  </svg>`,

  /* ── Periféricos / Rato & Teclado / Impressoras ── */
  perifericos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="7" width="8" height="13" rx="4"/>
    <path d="M7 10v3"/>
    <rect x="14" y="9" width="7" height="4" rx="1.2"/>
    <path d="M17 9V6.5A1.5 1.5 0 0118.5 5H21"/>
  </svg>`,

  /* ── Energia / Carregadores / Cabos / Baterias ── */
  energia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z"/>
  </svg>`,

  /* ── Áudio / Auscultadores / Colunas ── */
  audio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 13a8 8 0 0116 0"/>
    <rect x="3" y="13" width="4.5" height="7" rx="2"/>
    <rect x="16.5" y="13" width="4.5" height="7" rx="2"/>
  </svg>`,

  /* ── Segurança / Câmaras de vigilância / Controlo de acesso ── */
  seguranca: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 8.5 14.5 4l1.6 4.4L4.6 12.9z"/>
    <path d="M7.5 11.5 9 15.5a2 2 0 002.6 1.1l3.4-1.3"/>
    <path d="M17 9.5l3-.8M20.5 14.5c.6 1 .6 2.4 0 3.4"/>
    <circle cx="18.6" cy="16.2" r="0.9" fill="currentColor" stroke="none"/>
  </svg>`,

  /* ── Eletrodomésticos ── */
  eletrodomestico: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2"/>
    <path d="M4 9.5h16"/>
    <circle cx="15.5" cy="14.75" r="2.75"/>
    <path d="M7 6.5h4"/>
  </svg>`,

  /* ── Garrafas / Termos ── */
  garrafa: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 2.5h4"/>
    <path d="M10.5 2.5v3C9 6.5 7.5 8 7.5 10.5v9a2 2 0 002 2h5a2 2 0 002-2v-9c0-2.5-1.5-4-3-5v-3"/>
    <path d="M7.5 13.5h9"/>
  </svg>`,

  /* ── Promoções / Novidades / Liquidação ── */
  promocao: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.5 13.5 13.5 20.5a2 2 0 01-2.8 0L3.5 13.3V3.5h9.8l7.2 7.2a2 2 0 010 2.8z"/>
    <circle cx="8" cy="8" r="1.4"/>
  </svg>`,

  /* ── Marcas (Samsung, Midea, Oraimo…) ── */
  marca: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="9" r="5.5"/>
    <path d="M12 6.5l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 8.6l2-.3z"/>
    <path d="M8.5 20.5c1-1.6 2.1-2.4 3.5-2.4s2.5.8 3.5 2.4"/>
  </svg>`,

  /* ── Ferramentas ── */
  ferramenta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a4.5 4.5 0 00-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 005.6-6l-3 3-2.4-.6-.6-2.4 3-3z"/>
  </svg>`,

  /* ── Relógios ── */
  relogio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5.5"/>
    <path d="M12 9.5V12l1.8 1.8"/>
    <path d="M9 3.5h6M9 20.5h6"/>
    <path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3"/>
  </svg>`,

  /* ── Animais / Pet Shop ── */
  pet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="9" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="15" cy="6" r="2"/><circle cx="18.5" cy="10" r="2"/>
    <path d="M12 11c-2.8 0-5.5 2.2-5.5 5a3.2 3.2 0 003.2 3.2h4.6A3.2 3.2 0 0017.5 16c0-2.8-2.7-5-5.5-5z"/>
  </svg>`,

  /* ── Brinquedos ── */
  brinquedo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="8" width="18" height="12" rx="3"/>
    <circle cx="8.5" cy="13" r="1.6"/><circle cx="15.5" cy="13" r="1.6"/>
    <path d="M9.5 17h5"/>
    <path d="M12 8V5M9.5 3.5 12 5l2.5-1.5"/>
  </svg>`,

  /* ── Genérico / Fallback ── */
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/>
    <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5"/>
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>
    <rect x="3.5" y="13.5" width="7" height="4.5" rx="1.5"/>
  </svg>`,
};

/**
 * Palavras-chave para mapear o nome da categoria ao ícone correcto.
 * Ordem: mais específico primeiro.
 */
const KEYWORD_MAP = [
  {
    keys: [
      "cereal",
      "grão",
      "grao",
      "trigo",
      "milho",
      "arroz",
      "massa",
      "amido",
    ],
    icon: "cereal",
  },
  {
    keys: ["bebida", "água", "agua", "sumo", "refriger", "suco", "líquido"],
    icon: "bebida",
  },
  {
    keys: [
      "higiene",
      "pessoal",
      "sabonete",
      "sabão",
      "shampoo",
      "creme",
      "cosmet",
    ],
    icon: "higiene",
  },
  {
    keys: [
      "fruta",
      "vegetal",
      "legum",
      "horticola",
      "uva",
      "laranja",
      "tomate",
    ],
    icon: "fruta",
  },
  {
    keys: [
      "lactício",
      "laticinios",
      "laticin",
      "leite",
      "queijo",
      "iogurte",
      "manteig",
    ],
    icon: "laticinios",
  },
  {
    keys: ["carne", "peixe", "frango", "aves", "marisco", "prot"],
    icon: "carne",
  },
  {
    keys: ["limpeza", "deterg", "sabão", "spray", "desinfet", "limp"],
    icon: "limpeza",
  },
  {
    keys: [
      "padaria",
      "pão",
      "pao",
      "bolo",
      "pastelaria",
      "farinha",
      "biscoito",
    ],
    icon: "padaria",
  },
  { keys: ["bebedouro", "bebedor"], icon: "eletrodomestico" },
  {
    keys: ["bebé", "bebe", "criança", "crianca", "infantil", "fralda"],
    icon: "bebe",
  },
  { keys: ["banho", "duche", "toalha", "gel", "espuma"], icon: "banho" },

  // ── Tecnologia / Electrónica (categorias reais do scraper) ──
  {
    keys: [
      "telemovel", "smartphone", "iphone", "redmi", "galaxy",
      "tablet", "ipad", "celular", "telefone",
    ],
    icon: "telemovel",
  },
  {
    keys: [
      "laptop", "portatil", "computador", "notebook",
      "macbook", "pc", "desktop", "informatic",
    ],
    icon: "laptop",
  },
  { keys: ["monitor", "tv", "ecra", "display", "interativo", "projetor"], icon: "monitor" },
  {
    keys: ["rato", "mouse", "teclado", "periferic", "impressora", "scanner"],
    icon: "perifericos",
  },
  {
    keys: [
      "carregad", "cabo", "energia", "bateria", "powerbank",
      "tomada", "extensao", "fonte", "ups", "adaptador",
    ],
    icon: "energia",
  },
  {
    keys: ["auscult", "fone", "headset", "coluna", "som", "speaker", "microfone"],
    icon: "audio",
  },
  {
    keys: ["camar", "vigilan", "seguranca", "hikvision", "zkteco", "alarme", "dvr", "biometric"],
    icon: "seguranca",
  },
  {
    keys: [
      "eletro", "midea", "micro-ondas", "frigorifico", "maquina de lavar",
      "ferro de engomar", "air fryer", "fritadeira", "batedeira", "aquecedor",
      "cafeteira", "torradeira", "liquidific", "panela", "frigideira",
      "fogao", "grelhad", "bebedor", "aspirador",
    ],
    icon: "eletrodomestico",
  },
  { keys: ["garrafa", "termic", "caneca", "copo"], icon: "garrafa" },
  { keys: ["ferrament", "furadeira", "parafus"], icon: "ferramenta" },
  { keys: ["relogio", "watch"], icon: "relogio" },
  { keys: ["pet shop", "animal"], icon: "pet" },
  { keys: ["brinquedo", "puzzle"], icon: "brinquedo" },
  {
    keys: ["liquidacao", "promo", "novidade", "desconto", "oferta", "saldos", "facilitador"],
    icon: "promocao",
  },
  // Higiene & beleza
  {
    keys: ["perfume", "locao", "creme", "oleo hidratante", "rosto", "cabelo",
           "unhas", "olhos", "maos", "shampoo"],
    icon: "higiene",
  },
  // Casa / utilidades
  {
    keys: ["anti-mosquito", "inseticida", "organizador", "detergente"],
    icon: "limpeza",
  },
  { keys: ["bebe", "baby"], icon: "bebe" },
  { keys: ["luz", "lampada", "iluminac", "led"], icon: "energia" },
  { keys: ["cctv", "intrus"], icon: "seguranca" },
  { keys: ["suporte de tv"], icon: "monitor" },
  { keys: ["escritorio", "papelari", "pos"], icon: "perifericos" },
  { keys: ["suporte"], icon: "telemovel" },
  // Marcas sem categoria temática clara → ícone de marca (não o genérico em grelha)
  { keys: ["samsung", "oraimo", "itel", "tecno", "xiaomi", "lenovo", "hp ", "dell", "hisense"], icon: "marca" },
];

export class CategoryCard {
  /** @param {{ id: number, nome: string }} category */
  constructor(category, onClick) {
    this.category = category;
    this.onClick = onClick;
  }

  /** Retorna o SVG correcto para o nome da categoria */
  getIcon() {
    const name = (this.category.nome || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove acentos para comparação

    for (const { keys, icon } of KEYWORD_MAP) {
      if (keys.some((k) => name.includes(k))) return ICONS[icon];
    }
    return ICONS.default;
  }

  render() {
    return `
      <div class="category-card animate-scroll"
           data-id="${this.category.id}"
           role="button"
           tabindex="0"
           aria-label="Filtrar por ${this.category.nome}">
        <div class="category-card__icon">${this.getIcon()}</div>
        <span class="category-card__name">${this.category.nome}</span>
      </div>
    `;
  }
}
