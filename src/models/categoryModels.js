const db = require('../config/db');

const categoryModel = {
  findAll: async () => {
    const [rows] = await db.execute('SELECT * FROM Categoria ORDER BY nome ASC');
    return rows;
  },

  create: async (nome) => {
    const [result] = await db.execute('INSERT INTO Categoria (nome) VALUES (?)', [nome]);
    return result.insertId;
  },

  update: async (id, nome) => {
    await db.execute('UPDATE Categoria SET nome = ? WHERE id = ?', [nome, id]);
  },

  delete: async (id) => {
    await db.execute('DELETE FROM Categoria WHERE id = ?', [id]);
  }
};

module.exports = categoryModel;