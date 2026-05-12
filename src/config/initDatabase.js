const db = require('./db');

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS Utilizador (
      id INT AUTO_INCREMENT PRIMARY KEY,
      p_nome VARCHAR(100) NOT NULL,
      u_nome VARCHAR(100) NOT NULL,
      rua VARCHAR(255) NOT NULL,
      municipio VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      data_nascimento DATE NOT NULL,
      palavra_passe VARCHAR(255) NOT NULL,
      genero ENUM('masculino', 'feminino', 'outro') NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL
    ) ENGINE=InnoDB
  `
];

const initializeDatabaseSchema = async () => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const statement of schemaStatements) {
      // Running schema statements sequentially preserves FK dependency order.
      await connection.query(statement);
    }

    await connection.commit();
    console.log('Schema de base de dados validado com sucesso.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  initializeDatabaseSchema
};
