-- ============================================================
-- Seed Data: Populate Price360 Database with Test Data
-- Adiciona categorias, lojas, produtos e preços para teste
-- ============================================================

-- ─── 1. Inserir Categorias ───────────────────────────────
INSERT IGNORE INTO Categoria (nome, description, created_at, updated_at) VALUES
('Mercearia', 'Produtos alimentares e de consumo diário', NOW(), NOW()),
('Frutos e Vegetais', 'Frutas e vegetais frescos', NOW(), NOW()),
('Telemóveis', 'Smartphones e acessórios', NOW(), NOW()),
('Laptops', 'Computadores portáteis', NOW(), NOW()),
('Bebidas', 'Sumos, refrigerantes, água', NOW(), NOW());

-- ─── 2. Inserir Lojas ────────────────────────────────────
INSERT IGNORE INTO Loja (nome, nif, municipio, email, created_at, updated_at) VALUES
('Kero', '1234567890', 'Luanda', 'info@kero.ao', NOW(), NOW()),
('Shoprite', '0987654321', 'Luanda', 'info@shoprite.ao', NOW(), NOW()),
('Zap', '5555555555', 'Luanda', 'info@zap.ao', NOW(), NOW()),
('Eka Market', '3333333333', 'Luanda', 'info@ekamarket.ao', NOW(), NOW()),
('Bom Preço', '7777777777', 'Luanda', 'info@bompreco.ao', NOW(), NOW());

-- ─── 3. Inserir Produtos ────────────────────────────────
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
('Sal Fino - 500g', 'Sal refinado', 1, NOW(), NOW());

-- ─── 4. Inserir Preços (Produto_Loja) ───────────────────
-- Usar IDs diretos ou subqueries simples
INSERT IGNORE INTO Produto_Loja (id_produto, id_loja, quantidade, preco, created_at, updated_at) 
VALUES
-- Arroz 5kg
(1, 1, 50, 4500.00, NOW(), NOW()),
(1, 2, 45, 4700.00, NOW(), NOW()),
(1, 3, 40, 4650.00, NOW(), NOW()),
-- Feijão Preto 1kg
(2, 1, 30, 1200.00, NOW(), NOW()),
(2, 2, 28, 1250.00, NOW(), NOW()),
(2, 4, 35, 1150.00, NOW(), NOW()),
-- Óleo de Palma 1L
(3, 1, 60, 800.00, NOW(), NOW()),
(3, 5, 50, 750.00, NOW(), NOW()),
(3, 3, 55, 820.00, NOW(), NOW()),
-- Banana
(4, 1, 100, 300.00, NOW(), NOW()),
(4, 2, 95, 320.00, NOW(), NOW()),
(4, 4, 80, 310.00, NOW(), NOW()),
-- Alface
(5, 1, 150, 350.00, NOW(), NOW()),
(5, 3, 140, 360.00, NOW(), NOW()),
(5, 5, 130, 340.00, NOW(), NOW()),
-- Samsung Galaxy A12
(6, 2, 15, 95000.00, NOW(), NOW()),
(6, 3, 12, 97500.00, NOW(), NOW()),
(6, 4, 18, 94000.00, NOW(), NOW()),
-- iPhone 12
(7, 2, 8, 450000.00, NOW(), NOW()),
(7, 1, 5, 455000.00, NOW(), NOW()),
(7, 5, 10, 445000.00, NOW(), NOW()),
-- Lenovo IdeaPad 3
(8, 3, 6, 650000.00, NOW(), NOW()),
(8, 2, 4, 675000.00, NOW(), NOW()),
(8, 1, 3, 660000.00, NOW(), NOW()),
-- Coca-Cola 2L
(9, 1, 200, 1500.00, NOW(), NOW()),
(9, 2, 180, 1550.00, NOW(), NOW()),
(9, 5, 150, 1450.00, NOW(), NOW()),
-- Água Mineral 1.5L
(10, 1, 300, 250.00, NOW(), NOW()),
(10, 3, 280, 260.00, NOW(), NOW()),
(10, 4, 250, 240.00, NOW(), NOW()),
-- Açúcar 1kg
(11, 1, 100, 600.00, NOW(), NOW()),
(11, 2, 90, 650.00, NOW(), NOW()),
(11, 5, 110, 580.00, NOW(), NOW()),
-- Sal Fino 500g
(12, 1, 150, 200.00, NOW(), NOW()),
(12, 4, 140, 180.00, NOW(), NOW()),
(12, 5, 160, 210.00, NOW(), NOW());

-- ─── 5. Adicionar Contactos das Lojas ─────────────────
INSERT IGNORE INTO Telefone_Loja (n_telefone, id_loja, created_at, updated_at) VALUES
('+244 222 123 456', 1, NOW(), NOW()),
('+244 923 456 789', 2, NOW(), NOW()),
('+244 912 345 678', 3, NOW(), NOW()),
('+244 921 654 321', 4, NOW(), NOW()),
('+244 930 111 222', 5, NOW(), NOW());

INSERT IGNORE INTO Link_Loja (link, id_loja, created_at, updated_at) VALUES
('https://kero.ao', 1, NOW(), NOW()),
('https://shoprite.ao', 2, NOW(), NOW()),
('https://zap.ao', 3, NOW(), NOW()),
('https://ekamarket.ao', 4, NOW(), NOW()),
('https://bompreco.ao', 5, NOW(), NOW());
