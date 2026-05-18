#!/usr/bin/env node

/**
 * @module create-admin
 * @description Script para criar um utilizador administrador
 * 
 * Uso: node src/sql/create-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const createAdminUser = async () => {
  const connection = await db.getConnection();

  try {
    console.log('\n=== Criando Utilizador Admin ===\n');

    // Dados do admin padrão
    const adminData = {
      p_nome: 'Admin',
      u_nome: 'System',
      rua: 'Rua do Admin',
      municipio: 'Luanda',
      email: 'admin@price360.ao',
      data_nascimento: '1990-01-01',
      palavra_passe: 'Admin@123456',
      genero: 'outro',
      role: 'admin'
    };

    // Hash da palavra-passe
    const hashedPassword = await bcrypt.hash(adminData.palavra_passe, 10);

    // Verificar se o email já existe
    const [existingUser] = await connection.query(
      'SELECT id FROM Utilizador WHERE email = ? LIMIT 1',
      [adminData.email]
    );

    if (existingUser.length > 0) {
      console.log('⚠️  Utilizador com este email já existe!\n');
      await connection.end();
      process.exit(0);
    }

    // Inserir o admin
    await connection.query(
      `INSERT INTO Utilizador 
      (p_nome, u_nome, rua, municipio, email, data_nascimento, palavra_passe, genero, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        adminData.p_nome,
        adminData.u_nome,
        adminData.rua,
        adminData.municipio,
        adminData.email,
        adminData.data_nascimento,
        hashedPassword,
        adminData.genero,
        adminData.role
      ]
    );

    console.log('✅ Utilizador Admin criado com sucesso!\n');
    console.log('📧 Email:    admin@price360.ao');
    console.log('🔐 Password: Admin@123456\n');
    console.log('⚠️  AVISO: Altere a senha após o primeiro login!\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    await connection.end();
    process.exit(1);
  }
};

createAdminUser();
