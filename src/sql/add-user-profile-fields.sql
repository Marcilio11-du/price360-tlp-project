-- Migration: Adicionar campos de perfil e preferências de utilizador
-- Descrição: Adiciona suporte para upload de avatar e preferência de município
-- Data: 2026-05-26

-- Adiciona coluna municipio_preferencial para armazenar a preferência regional
ALTER TABLE Utilizador
ADD COLUMN municipio_preferencial VARCHAR(120) NULL AFTER municipio;

-- Adiciona coluna avatar_path para armazenar o caminho relativo da imagem de avatar
-- Armazena um caminho relativo (ex.: "uploads/avatars/user_123_avatar.jpg")
ALTER TABLE Utilizador
ADD COLUMN avatar_path VARCHAR(500) NULL AFTER municipio_preferencial;
