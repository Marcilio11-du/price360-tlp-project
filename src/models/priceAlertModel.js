const db = require("../config/db");

const createOrUpdate = async (idUtilizador, idProduto, precoAlvo) => {
  await db.execute(`INSERT INTO Alerta_Preco (id_utilizador, id_produto, preco_alvo, ativo, notificado_em)
    VALUES (?, ?, ?, 1, NULL) ON DUPLICATE KEY UPDATE preco_alvo = VALUES(preco_alvo), ativo = 1, notificado_em = NULL, deleted_at = NULL`, [idUtilizador, idProduto, precoAlvo]);
  const [rows] = await db.execute("SELECT * FROM Alerta_Preco WHERE id_utilizador = ? AND id_produto = ?", [idUtilizador, idProduto]);
  return rows[0];
};
const findByUser = async idUtilizador => {
  const [rows] = await db.execute(`SELECT a.*, p.nome AS produto_nome FROM Alerta_Preco a INNER JOIN Produto p ON p.id = a.id_produto WHERE a.id_utilizador = ? AND a.deleted_at IS NULL ORDER BY a.created_at DESC`, [idUtilizador]);
  return rows;
};
const remove = async (id, idUtilizador) => {
  const [result] = await db.execute("DELETE FROM Alerta_Preco WHERE id = ? AND id_utilizador = ?", [id, idUtilizador]); return result.affectedRows;
};
const findActiveDueForCheck = async () => {
  const [rows] = await db.execute(`SELECT a.*, p.nome AS produto_nome, u.email AS utilizador_email FROM Alerta_Preco a INNER JOIN Produto p ON p.id = a.id_produto INNER JOIN Utilizador u ON u.id = a.id_utilizador WHERE a.ativo = 1 AND a.deleted_at IS NULL`); return rows;
};
const markNotified = async id => db.execute("UPDATE Alerta_Preco SET notificado_em = NOW(), visto = 0 WHERE id = ?", [id]);

/**
 * Alertas já notificados (notificado_em != NULL) do utilizador —
 * a matéria-prima da central de notificações.
 */
const findNotifiedByUser = async idUtilizador => {
  const [rows] = await db.execute(`
    SELECT a.id, a.id_produto, a.preco_alvo, a.notificado_em, a.visto,
      p.nome AS produto_nome,
      (SELECT MIN(pl.preco) FROM Produto_Loja pl
        WHERE pl.id_produto = a.id_produto AND pl.deleted_at IS NULL) AS preco_min_actual
    FROM Alerta_Preco a
    INNER JOIN Produto p ON p.id = a.id_produto AND p.deleted_at IS NULL
    WHERE a.id_utilizador = ? AND a.notificado_em IS NOT NULL AND a.deleted_at IS NULL
    ORDER BY a.notificado_em DESC`, [idUtilizador]);
  return rows.map(r => ({ ...r,
    preco_min_actual: r.preco_min_actual != null ? Number(r.preco_min_actual) : null,
    preco_alvo: Number(r.preco_alvo),
    visto: !!r.visto,
  }));
};

/**
 * Marca uma notificação (alerta) como vista pelo utilizador.
 */
const markVisto = async (id, idUtilizador) => {
  const [result] = await db.execute(
    "UPDATE Alerta_Preco SET visto = 1 WHERE id = ? AND id_utilizador = ?",
    [id, idUtilizador],
  );
  return result.affectedRows > 0;
};

module.exports = { createOrUpdate, findByUser, remove, findActiveDueForCheck, markNotified, findNotifiedByUser, markVisto };
