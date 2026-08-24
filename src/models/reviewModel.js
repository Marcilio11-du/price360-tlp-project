/**
 * @module reviewModel
 * @description Operações sobre a tabela `Avaliacao_Loja`.
 * Uma avaliação é (utilizador, loja) — única por par; re-avaliar
 * actualiza a nota/comentário existente.
 */

const db = require("../config/db");

const TABLE = process.env.DB_REVIEW_TABLE || "Avaliacao_Loja";

/**
 * Lista as avaliações activas de uma loja (mais recentes primeiro).
 *
 * @param {number} idLoja
 * @returns {Promise<Array>}
 */
const findByStore = async (idLoja) => {
  const sql = `
    SELECT av.id, av.nota, av.comentario, av.created_at, av.updated_at,
      av.id_utilizador,
      u.p_nome AS utilizador_nome,
      u.email  AS utilizador_email
    FROM ${TABLE} av
    INNER JOIN Utilizador u ON u.id = av.id_utilizador AND u.deleted_at IS NULL
    WHERE av.id_loja = ? AND av.deleted_at IS NULL
    ORDER BY av.created_at DESC
  `;
  const [rows] = await db.execute(sql, [idLoja]);
  return rows;
};

/**
 * Estatísticas de avaliação de uma loja.
 *
 * @param {number} idLoja
 * @returns {Promise<{media: number|null, total: number}>}
 */
const findStoreStats = async (idLoja) => {
  const sql = `
    SELECT AVG(nota) AS media, COUNT(*) AS total
    FROM ${TABLE}
    WHERE id_loja = ? AND deleted_at IS NULL
  `;
  const [rows] = await db.execute(sql, [idLoja]);
  return {
    media: rows[0]?.media != null ? Number(rows[0].media) : null,
    total: Number(rows[0]?.total ?? 0),
  };
};

/**
 * Cria (ou actualiza) a avaliação do utilizador numa loja.
 *
 * @param {Object} param0
 * @param {number} param0.id_utilizador
 * @param {number} param0.id_loja
 * @param {number} param0.nota        - 1..5
 * @param {string|null} param0.comentario
 * @returns {Promise<'created'|'updated'>}
 */
const upsert = async ({ id_utilizador, id_loja, nota, comentario }) => {
  const sql = `
    INSERT INTO ${TABLE} (id_utilizador, id_loja, nota, comentario)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE nota = VALUES(nota), comentario = VALUES(comentario), deleted_at = NULL
  `;
  const [result] = await db.execute(sql, [id_utilizador, id_loja, nota, comentario]);
  return result.affectedRows === 1 ? "created" : "updated";
};

/**
 * Encontra uma avaliação pelo id (inclui id_utilizador/id_loja para
 * verificação de permissões).
 */
const findById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, id_utilizador, id_loja, nota, comentario FROM ${TABLE} WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
  return rows[0] || null;
};

/**
 * Soft delete de uma avaliação. Sem filtro de utilizador — o controlo
 * de permissões (dono ou admin) fica no controller.
 */
const softDelete = async (id) => {
  const [result] = await db.execute(
    `UPDATE ${TABLE} SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
  return result.affectedRows > 0;
};

/**
 * Lista todas as avaliações activas (para moderação admin).
 *
 * @returns {Promise<Array>}
 */
const findAllWithNames = async () => {
  const sql = `
    SELECT av.id, av.id_loja, av.nota, av.comentario, av.created_at,
      u.p_nome AS utilizador_nome, u.u_nome AS utilizador_unome, u.email AS utilizador_email,
      l.nome AS loja_nome
    FROM ${TABLE} av
    INNER JOIN Utilizador u ON u.id = av.id_utilizador
    INNER JOIN Loja l       ON l.id = av.id_loja
    WHERE av.deleted_at IS NULL
    ORDER BY av.created_at DESC
  `;
  const [rows] = await db.execute(sql);
  return rows;
};

module.exports = { findByStore, findStoreStats, upsert, findById, softDelete, findAllWithNames };
