const db = require('../config/db');

const storeModel = {
    findAll: async () => {
        const [rows] = await db.execute('SELECT * FROM Loja ORDER BY nome ASC');
        return rows;
    }
};

module.exports = storeModel;