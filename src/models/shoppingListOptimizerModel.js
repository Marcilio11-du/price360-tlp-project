const productShoppingListModel = require("./productShoppingListModel");
const priceComparisonModel = require("./priceComparisonModel");
const optimize = async idLista => {
  const products = await productShoppingListModel.findByShoppingListId(idLista);
  const comparisons = await Promise.all(products.map(async item => ({ item, comparison: await priceComparisonModel.getComparison(item.id_produto) })));
  const itens = comparisons.filter(({ comparison }) => comparison.ofertas.length).map(({ item, comparison }) => ({ id_produto: item.id_produto, produto_nome: item.produto_nome, loja_mais_barata: comparison.ofertas[0].loja_nome, preco_mais_barato: comparison.ofertas[0].preco }));
  const total_otimizado = itens.reduce((sum, item) => sum + item.preco_mais_barato, 0);
  const candidates = new Map();
  for (const { comparison } of comparisons) for (const offer of comparison.ofertas.filter(o => o.disponivel)) candidates.set(offer.id_loja, offer.loja_nome);
  const total_por_loja_unica = [...candidates].map(([id_loja, loja_nome]) => {
    const offers = comparisons.map(({ comparison }) => comparison.ofertas.find(o => o.id_loja === id_loja && o.disponivel));
    return offers.every(Boolean) ? { id_loja, loja_nome, total: offers.reduce((sum, offer) => sum + offer.preco, 0) } : null;
  }).filter(Boolean).sort((a,b) => a.total - b.total);
  return { itens, total_otimizado, total_por_loja_unica, poupanca_estimativa: total_por_loja_unica.length ? total_por_loja_unica[0].total - total_otimizado : null };
};
module.exports = { optimize };
