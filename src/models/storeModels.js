const db = require('../config/db');

const storeModel = {
  findAll: async () => {
    const [rows] = await db.execute('SELECT * FROM Loja ORDER BY nome ASC');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [id]);
    return rows[0];
  },

  create: async (nif, name, street, municipality, email) => {
    const [result] = await db.execute('INSERT INTO Loja (nif, name, street, municipality, email) VALUES (?, ?, ?, ?, ?)', [nif, name, street, municipality, email]);;
    return result.insertId;
  },

  update: async (nif, name, street, municipality, email, id) => {
    await db.execute('UPDATE Loja SET nif = ?, name = ?, street = ?, municipality = ?, email = ? WHERE id = ?', [nif, name, street, municipality, email, id]);;
  },

  delete: async (id) => {
    await db.execute('DELETE FROM Loja WHERE id = ?', [id]);;
  },


};

module.exports = storeModel;