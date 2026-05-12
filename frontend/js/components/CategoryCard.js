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

  /* ── Genérico / Fallback ── */
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4"/>
    <path d="M9 12h6M12 9v6"/>
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
  {
    keys: ["bebé", "bebe", "criança", "crianca", "infantil", "fralda"],
    icon: "bebe",
  },
  { keys: ["banho", "duche", "toalha", "gel", "espuma"], icon: "banho" },
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
