#!/usr/bin/env node

/**
 * @module seed-database
 * @description Script para popular a base de dados com dados de teste
 * Executa inserts de categorias, lojas, produtos e preços
 * 
 * Uso: node src/sql/seed-database.js
 */

require('dotenv').config();
const db = require('../config/db');

const seedDatabase = async () => {
  const connection = await db.getConnection();

  try {
    console.log('\n=== Iniciando Seed da Base de Dados ===\n');

    // 1. Inserir Categorias
    console.log('📍 Inserindo categorias...');
    await connection.query(`
      INSERT IGNORE INTO Categoria (nome, description, created_at, updated_at) VALUES
      ('Mercearia', 'Produtos alimentares e de consumo diário', NOW(), NOW()),
      ('Frutos e Vegetais', 'Frutas e vegetais frescos', NOW(), NOW()),
      ('Telemóveis', 'Smartphones e acessórios', NOW(), NOW()),
      ('Laptops', 'Computadores portáteis', NOW(), NOW()),
      ('Bebidas', 'Sumos, refrigerantes, água', NOW(), NOW())
    `);
    console.log('✓ Categorias inseridas\n');

    // 2. Inserir Lojas
    console.log('🏪 Inserindo lojas...');
    await connection.query(`
      INSERT IGNORE INTO Loja (nome, nif, municipio, email, created_at, updated_at) VALUES
      ('Kero', '1234567890', 'Luanda', 'info@kero.ao', NOW(), NOW()),
      ('Shoprite', '0987654321', 'Luanda', 'info@shoprite.ao', NOW(), NOW()),
      ('Zap', '5555555555', 'Luanda', 'info@zap.ao', NOW(), NOW()),
      ('Eka Market', '3333333333', 'Luanda', 'info@ekamarket.ao', NOW(), NOW()),
      ('Bom Preço', '7777777777', 'Luanda', 'info@bompreco.ao', NOW(), NOW())
    `);
    console.log('✓ Lojas inseridas\n');

    // 3. Inserir Produtos
    console.log('📦 Inserindo produtos...');
    await connection.query(`
      INSERT IGNORE INTO Produto (nome, descricao, id_categoria, created_at, updated_at) VALUES
      ('Arroz Tipo A - 5kg', 'Arroz branco de qualidade', 1, NOW(), NOW()),
      ('Feijão Preto - 1kg', 'Feijão preto seco', 1, NOW(), NOW()),
      ('Óleo de Palma - 1L', 'Óleo de palma refinado', 1, NOW(), NOW()),
      ('Banana - Kg', 'Banana fresca amarela', 2, NOW(), NOW()),
      ('Alface - Unidade', 'Alface fresca verde', 2, NOW(), NOW()),
      ('Samsung Galaxy A12 - 64GB', 'Smartphone Samsung preto', 3, NOW(), NOW()),
      ('iPhone 12 - 128GB', 'Apple iPhone preto', 3, NOW(), NOW()),
      ('Lenovo IdeaPad 3 - 15.6"', 'Laptop Intel Core i5', 4, NOW(), NOW()),
      ('Coca-Cola - 2L', 'Refrigerante Coca-Cola', 5, NOW(), NOW()),
      ('Água Mineral - 1.5L', 'Água mineral pura', 5, NOW(), NOW()),
      ('Açúcar - 1kg', 'Açúcar cristal branco', 1, NOW(), NOW()),
      ('Sal Fino - 500g', 'Sal refinado', 1, NOW(), NOW())
    `);
    console.log('✓ Produtos inseridos\n');

    // 4. Inserir Preços (Produto_Loja)
    console.log('💰 Inserindo preços e disponibilidade...');
    await connection.query(`
      INSERT IGNORE INTO Produto_Loja (id_produto, id_loja, quantidade, preco, created_at, updated_at) VALUES
      (1, 1, 50, 4500.00, NOW(), NOW()),
      (1, 2, 45, 4700.00, NOW(), NOW()),
      (1, 3, 40, 4650.00, NOW(), NOW()),
      (2, 1, 30, 1200.00, NOW(), NOW()),
      (2, 2, 28, 1250.00, NOW(), NOW()),
      (2, 4, 35, 1150.00, NOW(), NOW()),
      (3, 1, 60, 800.00, NOW(), NOW()),
      (3, 5, 50, 750.00, NOW(), NOW()),
      (3, 3, 55, 820.00, NOW(), NOW()),
      (4, 1, 100, 300.00, NOW(), NOW()),
      (4, 2, 95, 320.00, NOW(), NOW()),
      (4, 4, 80, 310.00, NOW(), NOW()),
      (5, 1, 150, 350.00, NOW(), NOW()),
      (5, 3, 140, 360.00, NOW(), NOW()),
      (5, 5, 130, 340.00, NOW(), NOW()),
      (6, 2, 15, 95000.00, NOW(), NOW()),
      (6, 3, 12, 97500.00, NOW(), NOW()),
      (6, 4, 18, 94000.00, NOW(), NOW()),
      (7, 2, 8, 450000.00, NOW(), NOW()),
      (7, 1, 5, 455000.00, NOW(), NOW()),
      (7, 5, 10, 445000.00, NOW(), NOW()),
      (8, 3, 6, 650000.00, NOW(), NOW()),
      (8, 2, 4, 675000.00, NOW(), NOW()),
      (8, 1, 3, 660000.00, NOW(), NOW()),
      (9, 1, 200, 1500.00, NOW(), NOW()),
      (9, 2, 180, 1550.00, NOW(), NOW()),
      (9, 5, 150, 1450.00, NOW(), NOW()),
      (10, 1, 300, 250.00, NOW(), NOW()),
      (10, 3, 280, 260.00, NOW(), NOW()),
      (10, 4, 250, 240.00, NOW(), NOW()),
      (11, 1, 100, 600.00, NOW(), NOW()),
      (11, 2, 90, 650.00, NOW(), NOW()),
      (11, 5, 110, 580.00, NOW(), NOW()),
      (12, 1, 150, 200.00, NOW(), NOW()),
      (12, 4, 140, 180.00, NOW(), NOW()),
      (12, 5, 160, 210.00, NOW(), NOW())
    `);
    console.log('✓ Preços inseridos\n');

    // 5. Inserir Contactos
    console.log('📞 Inserindo contactos das lojas...');
    await connection.query(`
      INSERT IGNORE INTO Telefone_Loja (n_telefone, id_loja, created_at, updated_at) VALUES
      ('+244 222 123 456', 1, NOW(), NOW()),
      ('+244 923 456 789', 2, NOW(), NOW()),
      ('+244 912 345 678', 3, NOW(), NOW()),
      ('+244 921 654 321', 4, NOW(), NOW()),
      ('+244 930 111 222', 5, NOW(), NOW())
    `);
    console.log('✓ Telefones inseridos\n');

    await connection.query(`
      INSERT IGNORE INTO Link_Loja (link, id_loja, created_at, updated_at) VALUES
      ('https://kero.ao', 1, NOW(), NOW()),
      ('https://shoprite.ao', 2, NOW(), NOW()),
      ('https://zap.ao', 3, NOW(), NOW()),
      ('https://ekamarket.ao', 4, NOW(), NOW()),
      ('https://bompreco.ao', 5, NOW(), NOW())
    `);
    console.log('✓ Links inseridos\n');

    // 6. Resumo Final
    console.log('=== Resumo dos Dados Inseridos ===\n');
    
    const [catCount] = await connection.query('SELECT COUNT(*) as total FROM Categoria');
    const [lojaCount] = await connection.query('SELECT COUNT(*) as total FROM Loja');
    const [prodCount] = await connection.query('SELECT COUNT(*) as total FROM Produto');
    const [precoCount] = await connection.query('SELECT COUNT(*) as total FROM Produto_Loja');
    const [telCount] = await connection.query('SELECT COUNT(*) as total FROM Telefone_Loja');
    const [linkCount] = await connection.query('SELECT COUNT(*) as total FROM Link_Loja');

    console.log(`📌 Categorias:      ${catCount[0].total}`);
    console.log(`🏪 Lojas:            ${lojaCount[0].total}`);
    console.log(`📦 Produtos:         ${prodCount[0].total}`);
    console.log(`💰 Preços (P_Loja):  ${precoCount[0].total}`);
    console.log(`📞 Telefones:        ${telCount[0].total}`);
    console.log(`🔗 Links:            ${linkCount[0].total}\n`);

    console.log('✅ Base de dados poblada com sucesso!\n');
    
    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('✗ Erro ao fazer seed da BD:', error.message);
    process.exit(1);
  }
};

seedDatabase();
