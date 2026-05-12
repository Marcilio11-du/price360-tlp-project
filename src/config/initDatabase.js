/**
 * @module initDatabase
 * @description Inicializa o schema da base de dados de forma idempotente.
 * Cria as tabelas se não existirem (CREATE TABLE IF NOT EXISTS), adiciona
 * colunas em falta e regista constraints (UNIQUE e FK) de forma segura,
 * ignorando erros de duplicado quando o schema já se encontra atualizado.
 * Toda a inicialização é executada dentro de uma transação para garantir
 * consistência — em caso de erro, é feito rollback completo.
 */

const db = require("./db");

/**
 * Adiciona uma coluna a uma tabela de forma idempotente.
 * Se a coluna já existir, o MySQL devolve o código `ER_DUP_FIELDNAME`;
 * esse erro é silenciado para tornar a operação segura em execuções repetidas.
 * Qualquer outro erro de BD é propagado normalmente.
 * @param {import('mysql2/promise').PoolConnection} connection - Ligação ativa com transação.
 * @param {string} tableName         - Nome da tabela a alterar.
 * @param {string} columnDefinition  - Definição da coluna (ex.: "deleted_at DATETIME NULL").
 */
const ensureColumnExists = async (connection, tableName, columnDefinition) => {
  try {
    await connection.query(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`,
    );
  } catch (error) {
    // ER_DUP_FIELDNAME: coluna já existe — ignora para tornar idempotente
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }
};

/**
 * Adiciona uma constraint UNIQUE a uma coluna de forma idempotente.
 * Dois cenários são tratados graciosamente:
 *  - `ER_DUP_KEYNAME`: a constraint UNIQUE já existe — ignora silenciosamente.
 *  - `ER_DUP_ENTRY`: existem dados duplicados na coluna, pelo que não é
 *    possível adicionar o índice — emite um aviso e continua sem falhar.
 * Qualquer outro erro é propagado.
 * @param {import('mysql2/promise').PoolConnection} connection        - Ligação ativa com transação.
 * @param {string} tableName                 - Nome da tabela a alterar.
 * @param {string} columnName                - Nome da coluna a tornar única.
 * @param {string} duplicateWarningMessage   - Mensagem a registar caso existam duplicados.
 */
const ensureUniqueConstraint = async (
  connection,
  tableName,
  columnName,
  duplicateWarningMessage,
) => {
  try {
    await connection.query(
      `ALTER TABLE ${tableName} ADD UNIQUE (${columnName})`,
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      // Não é possível adicionar UNIQUE: existem valores duplicados na coluna
      console.warn(duplicateWarningMessage);
      return;
    }

    // ER_DUP_KEYNAME: constraint UNIQUE já existe — ignora para tornar idempotente
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }
};

/**
 * Lista de instruções DDL para criação das tabelas base do schema.
 * A ordem é relevante: as tabelas com FK devem ser criadas depois das tabelas
 * referenciadas (ex.: Produto após Categoria, Produto_Loja após Produto e Loja).
 * Ordem de dependência:
 *   Utilizador → Lista_compras → Lista_compras_Produto
 *   Categoria → Produto → Produto_Loja, Lista_compras_Produto
 *   Loja → Produto_Loja, Telefone_Loja, Link_Loja
 */
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
  `,
  `
    CREATE TABLE IF NOT EXISTS Produto_Loja (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_produto INT NOT NULL,
      id_loja INT NOT NULL,
      quantidade INT NOT NULL DEFAULT 0,
      preco DECIMAL(10,2) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL,
      CONSTRAINT fk_produtoloja_produto
        FOREIGN KEY (id_produto)
        REFERENCES Produto(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CONSTRAINT fk_produtoloja_loja
        FOREIGN KEY (id_loja)
        REFERENCES Loja(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CONSTRAINT uq_produtoloja_produto_loja UNIQUE (id_produto, id_loja)
    ) ENGINE=InnoDB
  `,
  `
    CREATE TABLE IF NOT EXISTS Lista_compras (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT NULL,
      id_cliente INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL,
      CONSTRAINT fk_listacompras_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES Utilizador(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `,
  `
    CREATE TABLE IF NOT EXISTS Lista_compras_Produto (
      id INT AUTO_INCREMENT PRIMARY KEY,
      id_lista INT NOT NULL,
      id_produto INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL,
      CONSTRAINT fk_lcp_lista
        FOREIGN KEY (id_lista)
        REFERENCES Lista_compras(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
      CONSTRAINT fk_lcp_produto
        FOREIGN KEY (id_produto)
        REFERENCES Produto(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `,
  `
    CREATE TABLE IF NOT EXISTS Telefone_Loja (
      id INT AUTO_INCREMENT PRIMARY KEY,
      n_telefone VARCHAR(20) NOT NULL,
      id_loja INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL,
      CONSTRAINT fk_telefoneloja_loja
        FOREIGN KEY (id_loja)
        REFERENCES Loja(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `,
  `
    CREATE TABLE IF NOT EXISTS Link_Loja (
      id INT AUTO_INCREMENT PRIMARY KEY,
      link VARCHAR(500) NOT NULL,
      id_loja INT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      restored_at DATETIME NULL,
      CONSTRAINT fk_linkloja_loja
        FOREIGN KEY (id_loja)
        REFERENCES Loja(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `,
];

const initializeDatabaseSchema = async () => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const statement of schemaStatements) {
      // Running schema statements sequentially preserves FK dependency order.
      await connection.query(statement);
    }

    await ensureColumnExists(connection, "Categoria", "description TEXT");
    await ensureUniqueConstraint(
      connection,
      "Categoria",
      "nome",
      "Não foi possível adicionar a constraint UNIQUE no campo nome devido a entradas duplicadas existentes.",
    );

    await ensureColumnExists(connection, "Loja", "nif VARCHAR(255) NULL");
    await ensureColumnExists(connection, "Loja", "municipio VARCHAR(255) NULL");
    await ensureColumnExists(connection, "Loja", "email VARCHAR(255) NULL");
    await ensureUniqueConstraint(
      connection,
      "Loja",
      "nif",
      "Não foi possível adicionar a constraint UNIQUE no campo nif devido a entradas duplicadas existentes.",
    );

    await ensureColumnExists(connection, "Produto", "data_validade DATE NULL");
    await ensureColumnExists(connection, "Produto", "descricao TEXT NULL");
    await ensureColumnExists(connection, "Produto", "id_categoria INT NULL");
    await ensureColumnExists(connection, "Produto", "deleted_at DATETIME NULL");
    await ensureColumnExists(
      connection,
      "Produto",
      "restored_at DATETIME NULL",
    );

    await ensureColumnExists(
      connection,
      "Produto_Loja",
      "quantidade INT NOT NULL DEFAULT 0",
    );
    await ensureColumnExists(
      connection,
      "Produto_Loja",
      "preco DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    );
    await ensureColumnExists(
      connection,
      "Produto_Loja",
      "deleted_at DATETIME NULL",
    );
    await ensureColumnExists(
      connection,
      "Produto_Loja",
      "restored_at DATETIME NULL",
    );

    /*
     * Padrão try/catch para ALTER TABLE de FK:
     * Ignora ER_DUP_KEYNAME (constraint já existe), ER_FK_DUP_NAME
     * (nome de FK duplicado) e ER_CANT_CREATE_TABLE (já criada internamente).
     * Qualquer outro erro é propagado e faz rollback da transação.
     */
    try {
      await connection.query(
        "ALTER TABLE Produto ADD CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria) REFERENCES Categoria(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    try {
      await connection.query(
        "ALTER TABLE Produto_Loja ADD CONSTRAINT fk_produtoloja_produto FOREIGN KEY (id_produto) REFERENCES Produto(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    try {
      await connection.query(
        "ALTER TABLE Produto_Loja ADD CONSTRAINT fk_produtoloja_loja FOREIGN KEY (id_loja) REFERENCES Loja(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    try {
      await connection.query(
        "ALTER TABLE Produto_Loja ADD UNIQUE (id_produto, id_loja)",
      );
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.warn(
          "Não foi possível adicionar UNIQUE em Produto_Loja(id_produto, id_loja) devido a dados duplicados existentes.",
        );
      } else if (error.code !== "ER_DUP_KEYNAME") {
        throw error;
      }
    }

    await ensureColumnExists(
      connection,
      "Lista_compras",
      "descricao TEXT NULL",
    );
    await ensureColumnExists(
      connection,
      "Lista_compras",
      "deleted_at DATETIME NULL",
    );
    await ensureColumnExists(
      connection,
      "Lista_compras",
      "restored_at DATETIME NULL",
    );

    try {
      await connection.query(
        "ALTER TABLE Lista_compras ADD CONSTRAINT fk_listacompras_cliente FOREIGN KEY (id_cliente) REFERENCES Utilizador(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    await ensureColumnExists(
      connection,
      "Lista_compras_Produto",
      "deleted_at DATETIME NULL",
    );
    await ensureColumnExists(
      connection,
      "Lista_compras_Produto",
      "restored_at DATETIME NULL",
    );

    try {
      await connection.query(
        "ALTER TABLE Lista_compras_Produto ADD CONSTRAINT fk_lcp_lista FOREIGN KEY (id_lista) REFERENCES Lista_compras(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    try {
      await connection.query(
        "ALTER TABLE Lista_compras_Produto ADD CONSTRAINT fk_lcp_produto FOREIGN KEY (id_produto) REFERENCES Produto(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    await ensureColumnExists(
      connection,
      "Telefone_Loja",
      "deleted_at DATETIME NULL",
    );
    await ensureColumnExists(
      connection,
      "Telefone_Loja",
      "restored_at DATETIME NULL",
    );

    try {
      await connection.query(
        "ALTER TABLE Telefone_Loja ADD CONSTRAINT fk_telefoneloja_loja FOREIGN KEY (id_loja) REFERENCES Loja(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    await ensureColumnExists(
      connection,
      "Link_Loja",
      "deleted_at DATETIME NULL",
    );
    await ensureColumnExists(
      connection,
      "Link_Loja",
      "restored_at DATETIME NULL",
    );

    try {
      await connection.query(
        "ALTER TABLE Link_Loja ADD CONSTRAINT fk_linkloja_loja FOREIGN KEY (id_loja) REFERENCES Loja(id) ON UPDATE CASCADE ON DELETE RESTRICT",
      );
    } catch (error) {
      if (
        error.code !== "ER_DUP_KEYNAME" &&
        error.code !== "ER_CANT_CREATE_TABLE" &&
        error.code !== "ER_FK_DUP_NAME"
      ) {
        throw error;
      }
    }

    await connection.commit();
    console.log("Schema de base de dados validado com sucesso.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  initializeDatabaseSchema,
};
