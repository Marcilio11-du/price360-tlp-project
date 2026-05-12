const db = require('../config/db');

const storeModel = {
    findAll: async () => {
        const [rows] = await db.execute('SELECT * FROM Loja ORDER BY nome ASC');
        return rows;
    },

    findAllActives: async () => {
        const [rows] = await db.execute('SELECT * FROM Loja WHERE deleted_at IS NULL ORDER BY nome ASC');
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [id]);
        return rows[0];
    },

    create: async (nif, name, street, municipality, email) => {
        const [result] = await db.execute('INSERT INTO Loja (nif, nome, endereco, municipio, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())', [nif, name, street, municipality, email]);
        const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [result.insertId]);
        return rows[0];
    },

    update: async (id, nif, name, street, municipality, email) => {
        await db.execute('UPDATE Loja SET nif = ?, nome = ?, endereco = ?, municipio = ?, email = ?, updated_at = NOW() WHERE id = ?', [nif, name, street, municipality, email, id]);
        const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [id]);
        return rows[0];
    },

    softDelete: async (id) => {
        await db.execute('UPDATE Loja SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?', [id]);
        const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [id]);
        return rows[0];
    },

    restore: async (id) => {
        await db.execute('UPDATE Loja SET deleted_at = NULL, updated_at = NOW() WHERE id = ?', [id]);
        const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [id]);
        return rows[0];
    },

    delete: async (id) => {
        const [rows] = await db.execute('SELECT * FROM Loja WHERE id = ?', [id]);
        await db.execute('DELETE FROM Loja WHERE id = ?', [id]);
        return rows[0];
    }

};

module.exports = storeModel;