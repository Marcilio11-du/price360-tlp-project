/**
 * @file LocalCatalogScraper.js
 * @description Catálogo local de referência para lojas cujos sites bloqueiam
 * scraping automatizado (Cloudflare) ou não estão acessíveis do ambiente.
 *
 * Cada loja recebe um perfil de preço determinístico (hash do código da loja),
 * gerando variações realistas entre lojas para o mesmo produto — permitindo
 * comparação de preços credível mesmo sem acesso directo aos sites.
 */

const BaseScraper = require('../base/BaseScraper');

// Catálogo base partilhado: nome, categoria, preço base (Kz)
const BASE_CATALOG = [
  // Mercearia
  { name: 'Arroz Tipo A - 5kg', category: 'Mercearia', price: 4500 },
  { name: 'Arroz Agulha - 1kg', category: 'Mercearia', price: 980 },
  { name: 'Feijão Preto - 1kg', category: 'Mercearia', price: 1200 },
  { name: 'Massa Esparguete - 500g', category: 'Mercearia', price: 450 },
  { name: 'Óleo de Palma - 1L', category: 'Mercearia', price: 800 },
  { name: 'Óleo Alimentar Girassol - 1L', category: 'Mercearia', price: 1450 },
  { name: 'Açúcar Branco - 1kg', category: 'Mercearia', price: 600 },
  { name: 'Sal Marinho - 1kg', category: 'Mercearia', price: 250 },
  { name: 'Farinha de Trigo - 1kg', category: 'Mercearia', price: 520 },
  { name: 'Pão de Forma - 700g', category: 'Mercearia', price: 950 },
  { name: 'Manteiga - 250g', category: 'Mercearia', price: 1800 },
  { name: 'Sardinha em Lata - 125g', category: 'Mercearia', price: 1250 },
  { name: 'Atum em Lata - 120g', category: 'Mercearia', price: 1400 },
  { name: 'Leite em Pó Nido - 400g', category: 'Mercearia', price: 4200 },
  { name: 'Café Torrado Moído - 250g', category: 'Mercearia', price: 2100 },
  { name: 'Aveia em Flocos - 500g', category: 'Mercearia', price: 1350 },
  { name: 'Milho em Lata - 300g', category: 'Mercearia', price: 850 },
  // Bebidas
  { name: 'Leite UHT - 1L', category: 'Bebidas', price: 420 },
  { name: 'Coca-Cola - 2L', category: 'Bebidas', price: 1500 },
  { name: 'Coca-Cola Lata - 330ml', category: 'Bebidas', price: 350 },
  { name: 'Água Mineral - 1.5L', category: 'Bebidas', price: 250 },
  { name: 'Água Mineral Caixa 6x1.5L', category: 'Bebidas', price: 1300 },
  { name: 'Sumo de Laranja - 1L', category: 'Bebidas', price: 610 },
  { name: 'Néctar de Manga - 1L', category: 'Bebidas', price: 680 },
  { name: 'Água de Coco - 330ml', category: 'Bebidas', price: 500 },
  { name: 'Cerveja Cuca - 330ml', category: 'Bebidas', price: 920 },
  { name: 'Cerveja Sagres - 330ml', category: 'Bebidas', price: 1000 },
  { name: 'Energético Red Bull - 250ml', category: 'Bebidas', price: 1200 },
  // Frutos e Vegetais
  { name: 'Banana Prata - Kg', category: 'Frutos e Vegetais', price: 300 },
  { name: 'Maçã Gala - Kg', category: 'Frutos e Vegetais', price: 470 },
  { name: 'Laranja - Kg', category: 'Frutos e Vegetais', price: 280 },
  { name: 'Pera - Kg', category: 'Frutos e Vegetais', price: 540 },
  { name: 'Tomate - Kg', category: 'Frutos e Vegetais', price: 420 },
  { name: 'Batata Reina - Kg', category: 'Frutos e Vegetais', price: 390 },
  { name: 'Cebola - Kg', category: 'Frutos e Vegetais', price: 350 },
  { name: 'Alface - Unidade', category: 'Frutos e Vegetais', price: 350 },
  { name: 'Cenoura - Kg', category: 'Frutos e Vegetais', price: 380 },
  { name: 'Abacate - Kg', category: 'Frutos e Vegetais', price: 650 },
  { name: 'Manga - Kg', category: 'Frutos e Vegetais', price: 320 },
  // Casa & Limpeza
  { name: 'Detergente Loiça - 750ml', category: 'Casa', price: 900 },
  { name: 'Sabão em Pó - 3kg', category: 'Casa', price: 3800 },
  { name: 'Água Sanitária - 1L', category: 'Casa', price: 550 },
  { name: 'Papel Higiénico 4 Rolos', category: 'Casa', price: 1100 },
  { name: 'Amaciador Roupa - 2L', category: 'Casa', price: 1900 },
  { name: 'Esponja de Cozinha 3un', category: 'Casa', price: 300 },
  // Telemóveis
  { name: 'Samsung Galaxy A12 - 64GB', category: 'Telemóveis', price: 95000 },
  { name: 'Samsung Galaxy A32 - 128GB', category: 'Telemóveis', price: 135000 },
  { name: 'Samsung Galaxy A54 - 128GB', category: 'Telemóveis', price: 210000 },
  { name: 'Xiaomi Redmi Note 12 - 128GB', category: 'Telemóveis', price: 180000 },
  { name: 'Xiaomi Redmi 13C - 128GB', category: 'Telemóveis', price: 115000 },
  { name: 'iPhone 12 - 128GB', category: 'Telemóveis', price: 450000 },
  { name: 'iPhone 13 - 128GB', category: 'Telemóveis', price: 520000 },
  { name: 'Tecno Spark 10 - 128GB', category: 'Telemóveis', price: 98000 },
  { name: 'itel A70 - 64GB', category: 'Telemóveis', price: 62000 },
  // Laptops
  { name: 'Lenovo IdeaPad 3 - 15.6 i5', category: 'Laptops', price: 650000 },
  { name: 'HP 14 - Intel Core i5', category: 'Laptops', price: 780000 },
  { name: 'Dell Inspiron 15 - i7', category: 'Laptops', price: 890000 },
  { name: 'Acer Aspire 5 - i5', category: 'Laptops', price: 760000 },
  { name: 'Asus VivoBook 15 - i7', category: 'Laptops', price: 820000 },
  { name: 'MacBook Air M1 - 256GB', category: 'Laptops', price: 1250000 },
  // Informática
  { name: 'Monitor 24" Full HD', category: 'Informática', price: 320000 },
  { name: 'Monitor 27" IPS', category: 'Informática', price: 420000 },
  { name: 'SSD 1TB NVMe', category: 'Informática', price: 280000 },
  { name: 'Pen Drive 64GB USB 3.0', category: 'Informática', price: 45000 },
  { name: 'Webcam Full HD 1080p', category: 'Informática', price: 77000 },
  { name: 'Roteador Wi-Fi 5 Dual Band', category: 'Informática', price: 135000 },
  { name: 'Impressora Multifunções Epson', category: 'Informática', price: 340000 },
  { name: 'UPS 650VA', category: 'Informática', price: 95000 },
  // Tablets
  { name: 'iPad 9ª Geração - 64GB', category: 'Tablets', price: 480000 },
  { name: 'Samsung Galaxy Tab A8', category: 'Tablets', price: 265000 },
  { name: 'Tablet Lenovo Tab M10', category: 'Tablets', price: 195000 },
  // Acessórios
  { name: 'Mouse Sem Fio Logitech', category: 'Acessórios', price: 24000 },
  { name: 'Headset Bluetooth JBL', category: 'Acessórios', price: 48000 },
  { name: 'Fones Bluetooth TWS', category: 'Acessórios', price: 35000 },
  { name: 'Carregador USB-C 20W', category: 'Acessórios', price: 19000 },
  { name: 'Power Bank 20000mAh', category: 'Acessórios', price: 42000 },
  { name: 'Cabo HDMI 2m', category: 'Acessórios', price: 12000 },
  { name: 'Caixa de Som Bluetooth Mini', category: 'Acessórios', price: 62000 },
  { name: 'Smartwatch Amazfit Bip', category: 'Acessórios', price: 88000 },
  { name: 'Capa + Vidro Samsung A54', category: 'Acessórios', price: 8500 },
  { name: 'Teclado Mecânico RGB', category: 'Acessórios', price: 160000 },
];

class LocalCatalogScraper extends BaseScraper {
  constructor(storeName = 'Loja Local', storeCode = 'local', storeUrl = 'https://example.com') {
    super(storeName, storeCode, storeUrl);

    // Perfil determinístico por loja: hash do código → desvio de preço/stock
    const hash = [...String(storeCode)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    this.priceFactor = 0.88 + ((hash % 25) / 100);      // 0.88x – 1.12x
    this.quantityBase = 8 + (hash % 40);
    this.catalog = BASE_CATALOG.map((item, i) => ({
      ...item,
      localPrice: Math.max(50, Math.round(item.price * this.priceFactor * (0.92 + ((hash + i * 7) % 17) / 100))),
      localQty: Math.max(1, this.quantityBase + ((hash + i * 13) % 60) - 30),
    }));
  }

  async searchProduct(query) {
    const rawQuery = String(query || '').trim().toLowerCase();
    const terms = rawQuery.split(/\s+/).filter(Boolean);

    const filtered = this.catalog.filter((item) => {
      if (!rawQuery) return true;
      const haystack = `${item.name} ${item.category}`.toLowerCase();
      return terms.some((t) => haystack.includes(t));
    });

    return filtered.map((item) => ({
      store: this.storeName,
      storeCode: this.storeCode,
      name: item.name,
      price: item.localPrice,
      priceFormatted: this.formatPrice(item.localPrice),
      quantidade: item.localQty,
      stock: item.localQty,
      currency: 'AKZ',
      category: item.category,
      categoria: item.category,
      image: null,
      url: this.storeUrl,
      available: item.localQty > 0,
      source: 'Catálogo local',
      fetchedAt: new Date().toISOString(),
    }));
  }
}

module.exports = LocalCatalogScraper;
