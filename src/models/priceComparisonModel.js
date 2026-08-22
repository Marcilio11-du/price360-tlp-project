const db = require("../config/db");
const productModel = require("./productModel");

const PRODUCT_TABLE = process.env.DB_PRODUCT_TABLE || "Produto";
const CATEGORY_TABLE = process.env.DB_CATEGORY_TABLE || "Categoria";
const STORE_PRODUCT_TABLE = process.env.DB_STORE_PRODUCT_TABLE || "Produto_Loja";
const STORE_TABLE = process.env.DB_STORE_TABLE || "Loja";

const getComparison = async (idProduto) => {
  const produto = await productModel.findById(idProduto);
  if (!produto) return { produto: null, ofertas: [], estatisticas: null };
  const [rows] = await db.execute(`
    SELECT pl.id AS id_produto_loja, pl.id_loja, l.nome AS loja_nome, l.municipio,
      pl.preco, pl.quantidade, pl.link AS produto_url, pl.imagem, pl.updated_at
    FROM ${STORE_PRODUCT_TABLE} pl INNER JOIN ${STORE_TABLE} l ON l.id = pl.id_loja
    WHERE pl.id_produto = ? AND pl.deleted_at IS NULL AND l.deleted_at IS NULL
    ORDER BY pl.preco ASC`, [idProduto]);
  const ofertas = rows.map((row, index) => ({ ...row, preco: Number(row.preco), disponivel: Number(row.quantidade) > 0, melhor_preco: index === 0 }));
  if (!ofertas.length) return { produto, ofertas, estatisticas: null };
  const precos = ofertas.map(({ preco }) => preco);
  const preco_min = Math.min(...precos), preco_max = Math.max(...precos);
  return { produto, ofertas, estatisticas: {
    preco_min, preco_max, preco_medio: precos.reduce((a, b) => a + b, 0) / precos.length,
    poupanca_absoluta: preco_max - preco_min,
    poupanca_percentual: preco_max > 0 ? ((preco_max - preco_min) / preco_max) * 100 : 0,
    total_lojas: ofertas.length,
  }};
};

const listGroupedSummary = async (filters = {}) => {
  const clauses = ["p.deleted_at IS NULL"];
  const params = [];
  if (filters.q) {
    clauses.push("(p.nome LIKE ? OR p.marca LIKE ? OR p.descricao LIKE ? OR c.nome LIKE ?)");
    params.push(...Array(4).fill(`%${filters.q}%`));
  }
  if (filters.categoriaId) { clauses.push("p.id_categoria = ?"); params.push(filters.categoriaId); }
  const [rows] = await db.execute(`
    SELECT p.id, p.nome, p.marca, p.descricao, p.id_categoria, c.nome AS categoria_nome,
      MIN(pl.preco) AS preco_min,
      COUNT(DISTINCT pl.id_loja) AS total_lojas,
      SUM(pl.quantidade) AS quantidade_total,
      MAX(CASE WHEN pl.imagem IS NOT NULL AND TRIM(pl.imagem) <> '' THEN pl.imagem END) AS imagem
    FROM ${PRODUCT_TABLE} p INNER JOIN ${CATEGORY_TABLE} c ON c.id = p.id_categoria
    INNER JOIN ${STORE_PRODUCT_TABLE} pl ON pl.id_produto = p.id AND pl.deleted_at IS NULL
    WHERE ${clauses.join(" AND ")} GROUP BY p.id ORDER BY p.nome ASC`, params);
  return rows.map(row => ({
    ...row,
    preco_min: Number(row.preco_min),
    total_lojas: Number(row.total_lojas),
    quantidade_total: Number(row.quantidade_total),
    imagem: row.imagem || null,
  }));
};

const getPriceHistory = async (idProduto, dias = 90) => {
  const safeDays = Math.min(Math.max(Number(dias) || 90, 1), 3650);
  const [rows] = await db.execute(`
    SELECT DATE(hp.registado_em) AS data, MIN(hp.preco) AS preco_min
    FROM Historico_Preco hp INNER JOIN ${STORE_PRODUCT_TABLE} pl ON pl.id = hp.id_produto_loja
    WHERE pl.id_produto = ? AND hp.registado_em >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(hp.registado_em) ORDER BY data ASC`, [idProduto, safeDays]);
  return rows.map(row => ({ ...row, preco_min: Number(row.preco_min) }));
};

module.exports = { getComparison, listGroupedSummary, getPriceHistory };
