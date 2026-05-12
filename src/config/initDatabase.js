const db = require('./db');

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS Categoria (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(150) NOT NULL UNIQUE,
      descricao TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL
    ) ENGINE=InnoDB
  `,
  `
    CREATE TABLE IF NOT EXISTS Produto (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      marca VARCHAR(120) NOT NULL,
      data_validade DATE NULL,
      descricao TEXT NULL,
      id_categoria INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL,
      CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES Categoria(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `
];

const initializeDatabaseSchema = async () => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const statement of schemaStatements) {
      await connection.query(statement);
    }

    await connection.commit();
    console.log('Schema de Produto/Categoria validado com sucesso.');
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
