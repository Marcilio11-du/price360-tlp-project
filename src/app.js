const express = require('express');
const cors = require('cors');
const categoryRoutes = require('./routes/categoryRoutes');
const storeRoutes = require('./routes/storeRoutes');
const db = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/stores', storeRoutes);

// Função para inicializar tabelas
const initializeTables = async () => {
  try {
    // Criar tabela Categoria
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Categoria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);

    // Adicionar coluna description se não existir
    try {
      await db.execute(`
        ALTER TABLE Categoria ADD COLUMN description TEXT
      `);
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        throw alterError;
      }
      // Se a coluna já existe, continua
    }

    // Adicionar constraint única no nome se não existir
    try {
      await db.execute(`
        ALTER TABLE Categoria ADD UNIQUE (nome)
      `);
    } catch (uniqueError) {
      if (uniqueError.code === 'ER_DUP_KEYNAME') {
        // Constraint já existe
      } else if (uniqueError.code === 'ER_DUP_ENTRY') {
        console.warn('Não foi possível adicionar a constraint UNIQUE no campo nome devido a entradas duplicadas existentes.');
      } else {
        throw uniqueError;
      }
    }

    // Criar tabela Loja
    await db.execute(`
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
      )
    `);

    try {
      await db.execute(`
        ALTER TABLE Loja ADD COLUMN nif VARCHAR(255) NULL
      `);
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        throw alterError;
      }
    }

    try {
      await db.execute(`
        ALTER TABLE Loja ADD COLUMN municipio VARCHAR(255) NULL
      `);
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        throw alterError;
      }
    }

    try {
      await db.execute(`
        ALTER TABLE Loja ADD COLUMN email VARCHAR(255) NULL
      `);
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME') {
        throw alterError;
      }
    }

    try {
      await db.execute(`
        ALTER TABLE Loja ADD UNIQUE (nif)
      `);
    } catch (uniqueError) {
      if (uniqueError.code !== 'ER_DUP_KEYNAME' && uniqueError.code !== 'ER_DUP_ENTRY') {
        throw uniqueError;
      }
    }

    console.log('Tabelas inicializadas com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar tabelas:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 3000;

// Inicializar tabelas e depois iniciar o servidor
initializeTables().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor Price360 rodando na porta ${PORT}`);
  });
});