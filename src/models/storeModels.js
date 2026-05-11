const db = require('../config/db');
const { create } = require('./categoryModels');

const storeModel = {
    findAll: async () => {
        const [rows] = await db.execute('SELECT * FROM Loja ORDER BY nome ASC');
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [id]);
        return rows[0];
    },

    createStore: async (nome, endereco) => {
        const [result] = await db.execute('INSERT INTO Loja (nome, endereco) VALUES (?, ?)', [nome, endereco])
        return result.insertId;
    },

    updateStore: async (id, nome, endereco) => {
        await db.execute('UPDATE Loja SET nome = ?, endereco = ? WHERE id = ?', [nome, endereco, id])
    },

    



};

module.exports = storeModel;