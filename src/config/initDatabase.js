const db = require('./db');

const ensureColumnExists = async (connection, tableName, columnDefinition) => {
  try {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      throw error;
    }
  }
};

const ensureUniqueConstraint = async (connection, tableName, columnName, duplicateWarningMessage) => {
  try {
    await connection.query(`ALTER TABLE ${tableName} ADD UNIQUE (${columnName})`);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.warn(duplicateWarningMessage);
      return;
    }

    if (error.code !== 'ER_DUP_KEYNAME') {
      throw error;
    }
  }
};

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
  `,
  `
    CREATE TABLE IF NOT EXISTS Categoria (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
    ) ENGINE=InnoDB
  `,
  `
    CREATE TABLE IF NOT EXISTS Loja (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nif VARCHAR(255) NOT NULL UNIQUE,
      nome VARCHAR(255) NOT NULL,
      endereco VARCHAR(255) NOT NULL,
      municipio VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL
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
      // Running schema statements sequentially preserves FK dependency order.
      await connection.query(statement);
    }

    await ensureColumnExists(connection, 'Categoria', 'description TEXT');
    await ensureUniqueConstraint(
      connection,
      'Categoria',
      'nome',
      'Não foi possível adicionar a constraint UNIQUE no campo nome devido a entradas duplicadas existentes.'
    );

    await ensureColumnExists(connection, 'Loja', 'nif VARCHAR(255) NULL');
    await ensureColumnExists(connection, 'Loja', 'municipio VARCHAR(255) NULL');
    await ensureColumnExists(connection, 'Loja', 'email VARCHAR(255) NULL');
    await ensureUniqueConstraint(
      connection,
      'Loja',
      'nif',
      'Não foi possível adicionar a constraint UNIQUE no campo nif devido a entradas duplicadas existentes.'
    );

    await ensureColumnExists(connection, 'Produto', 'data_validade DATE NULL');
    await ensureColumnExists(connection, 'Produto', 'descricao TEXT NULL');
    await ensureColumnExists(connection, 'Produto', 'id_categoria INT NULL');
    await ensureColumnExists(connection, 'Produto', 'deleted_at DATETIME NULL');
    await ensureColumnExists(connection, 'Produto', 'restored_at DATETIME NULL');

    try {
      await connection.query(
        'ALTER TABLE Produto ADD CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES Categoria(id) ON UPDATE CASCADE ON DELETE RESTRICT'
      );
    } catch (error) {
      if (
        error.code !== 'ER_DUP_KEYNAME' &&
        error.code !== 'ER_CANT_CREATE_TABLE' &&
        error.code !== 'ER_FK_DUP_NAME'
      ) {
        throw error;
      }
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
