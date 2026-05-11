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

};

module.exports = storeModel;