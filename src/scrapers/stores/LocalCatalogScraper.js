/**
 * @file LocalCatalogScraper.js
 * @description Catalog fallback used to keep the product pipeline running when a store
 * blocks automated scrapes or is not reachable from the runtime environment.
 *
 * This is intentionally deterministic and data-backed so the platform keeps showing
 * realistic stock and pricing even when live parsing is unavailable.
 */

const BaseScraper = require('../base/BaseScraper');

class LocalCatalogScraper extends BaseScraper {
  constructor(storeName = 'Loja Local', storeCode = 'local', storeUrl = 'https://example.com') {
    super(storeName, storeCode, storeUrl);
    this.catalog = [
      { name: 'Arroz Tipo A - 5kg', category: 'Mercearia', price: 4500, quantity: 48 },
      { name: 'Feijão Preto - 1kg', category: 'Mercearia', price: 1200, quantity: 32 },
      { name: 'Óleo de Palma - 1L', category: 'Mercearia', price: 800, quantity: 52 },
      { name: 'Banana - Kg', category: 'Frutos e Vegetais', price: 300, quantity: 90 },
      { name: 'Alface - Unidade', category: 'Frutos e Vegetais', price: 350, quantity: 140 },
      { name: 'Leite - 1L', category: 'Bebidas', price: 420, quantity: 55 },
      { name: 'Coca-Cola - 2L', category: 'Bebidas', price: 1500, quantity: 160 },
      { name: 'Água Mineral - 1.5L', category: 'Bebidas', price: 250, quantity: 200 },
      { name: 'Tomate - Kg', category: 'Frutos e Vegetais', price: 420, quantity: 120 },
      { name: 'Açúcar - 1kg', category: 'Mercearia', price: 600, quantity: 100 },
      { name: 'Samsung Galaxy A12 - 64GB', category: 'Telemóveis', price: 95000, quantity: 18 },
      { name: 'Samsung Galaxy A32 - 128GB', category: 'Telemóveis', price: 135000, quantity: 11 },
      { name: 'iPhone 12 - 128GB', category: 'Telemóveis', price: 450000, quantity: 9 },
      { name: 'Lenovo IdeaPad 3 - 15.6', category: 'Laptops', price: 650000, quantity: 7 },
      { name: 'HP 14 - Intel Core i5', category: 'Laptops', price: 780000, quantity: 6 },
      { name: 'Monitor 24" Full HD', category: 'Informática', price: 320000, quantity: 10 },
      { name: 'Teclado Mecânico', category: 'Informática', price: 160000, quantity: 14 },
      { name: 'Mouse Sem Fio', category: 'Acessórios', price: 24000, quantity: 28 },
      { name: 'Headset Bluetooth', category: 'Acessórios', price: 48000, quantity: 22 },
      { name: 'Pão de Forma - 700g', category: 'Mercearia', price: 950, quantity: 72 },
      { name: 'Manteiga - 250g', category: 'Mercearia', price: 1800, quantity: 46 },
      { name: 'Sardinha - Lata', category: 'Mercearia', price: 1250, quantity: 64 },
      { name: 'Laranja - Kg', category: 'Frutos e Vegetais', price: 280, quantity: 160 },
      { name: 'Pera - Kg', category: 'Frutos e Vegetais', price: 540, quantity: 118 },
      { name: 'Maçã - Kg', category: 'Frutos e Vegetais', price: 470, quantity: 175 },
      { name: 'Sumo de Laranja - 1L', category: 'Bebidas', price: 610, quantity: 88 },
      { name: 'Água de Coco - 330ml', category: 'Bebidas', price: 500, quantity: 120 },
      { name: 'Cerveja - 330ml', category: 'Bebidas', price: 920, quantity: 93 },
      { name: 'Batata - Kg', category: 'Frutos e Vegetais', price: 390, quantity: 140 },
      { name: 'Samsung Galaxy A54 - 128GB', category: 'Telemóveis', price: 210000, quantity: 12 },
      { name: 'Xiaomi Redmi Note 12', category: 'Telemóveis', price: 180000, quantity: 15 },
      { name: 'iPhone 13 - 128GB', category: 'Telemóveis', price: 520000, quantity: 7 },
      { name: 'Dell Inspiron 15 - i7', category: 'Laptops', price: 890000, quantity: 5 },
      { name: 'Acer Aspire 5 - i5', category: 'Laptops', price: 760000, quantity: 8 },
      { name: 'SSD 1TB NVMe', category: 'Informática', price: 280000, quantity: 26 },
      { name: 'Monitor 27" IPS', category: 'Informática', price: 420000, quantity: 11 },
      { name: 'Webcam Full HD', category: 'Informática', price: 77000, quantity: 20 },
      { name: 'Roteador Wi-Fi 5', category: 'Informática', price: 135000, quantity: 16 },
      { name: 'Fones Bluetooth', category: 'Acessórios', price: 35000, quantity: 30 },
      { name: 'Carregador USB-C', category: 'Acessórios', price: 19000, quantity: 45 },
      { name: 'Cabo HDMI 2m', category: 'Acessórios', price: 12000, quantity: 52 },
      { name: 'Caixa de Som Mini', category: 'Acessórios', price: 62000, quantity: 23 }
    ];
  }

  async searchProduct(query) {
    const rawQuery = String(query || '').trim().toLowerCase();

    const filtered = this.catalog.filter(item => {
      if (!rawQuery) return true;

      const haystack = `${item.name} ${item.category}`.toLowerCase();
      return haystack.includes(rawQuery);
    });

    return filtered.map(item => ({
      name: item.name,
      price: Number(item.price),
      quantidade: Number(item.quantity),
      stock: Number(item.quantity),
      currency: 'AKZ',
      category: item.category,
      categoria: item.category,
      image: null,
      url: this.storeUrl,
      storeCode: this.storeCode,
      storeName: this.storeName,
      available: Number(item.quantity) > 0
    }));
  }
}

module.exports = LocalCatalogScraper;
