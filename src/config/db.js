/**
 * @module db
 * @description Configura e exporta o pool de ligações MySQL2 utilizado por toda a aplicação.
 * O pool é exportado diretamente, permitindo que qualquer módulo importe e utilize
 * `db.execute()` ou `db.getConnection()` sem necessitar de criar novas ligações manualmente.
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Pool de ligações MySQL reutilizáveis.
 *  - `connectionLimit`: número máximo de ligações simultâneas no pool (10).
 *  - `waitForConnections`: se true, os pedidos aguardam uma ligação livre
 *    quando o limite é atingido, em vez de falhar imediatamente.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Exporta o pool diretamente — os modelos utilizam pool.execute() e pool.getConnection()
module.exports = pool;
