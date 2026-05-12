const db = require('../config/db');

const categoryModel = {
  findAll: async () => {
    const [rows] = await db.execute('SELECT * FROM Categoria ORDER BY nome ASC');
    return rows;
  },

  findAllActives: async () => {
    const [rows] = await db.execute('SELECT * FROM Categoria WHERE deleted_at IS NULL ORDER BY nome ASC');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM Categoria WHERE id = ?', [id]);
    return rows[0];
  },

  create: async (name, description) => {
    const [result] = await db.execute('INSERT INTO Categoria (nome, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [name, description]);
    const [rows] = await db.execute('SELECT * FROM Categoria WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  update: async (id, name, description) => {
    await db.execute('UPDATE Categoria SET nome = ?, description = ?, updated_at = NOW() WHERE id = ?', [name, description, id]);
    const [rows] = await db.execute('SELECT * FROM Categoria WHERE id = ?', [id]);
    return rows[0];
  },

  softDelete: async (id) => {
    await db.execute('UPDATE Categoria SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?', [id]);
    const [rows] = await db.execute('SELECT * FROM Categoria WHERE id = ?', [id]);
    return rows[0];
  },

  restore: async (id) => {
    await db.execute('UPDATE Categoria SET deleted_at = NULL, updated_at = NOW() WHERE id = ?', [id]);
    const [rows] = await db.execute('SELECT * FROM Categoria WHERE id = ?', [id]);
    return rows[0];
  },

  delete: async (id) => {
    const [rows] = await db.execute('SELECT * FROM Categoria WHERE id = ?', [id]);
    await db.execute('DELETE FROM Categoria WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = categoryModel;