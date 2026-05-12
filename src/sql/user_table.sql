-- DDL de referencia para a tabela Utilizador com role para suporte ao dashboard admin.
-- Ajuste o nome das constraints se necessario no seu ambiente.

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
  restored_at DATETIME NULL,
  created_by INT NULL,
  updated_by INT NULL,
  deleted_by INT NULL,
  restored_by INT NULL
);

-- Se a tabela ja existir sem role, use:
-- ALTER TABLE Utilizador
--   ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

-- Para adicionar auditoria e soft delete em tabela existente, use:
-- ALTER TABLE Utilizador
--   ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   ADD COLUMN deleted_at DATETIME NULL,
--   ADD COLUMN restored_at DATETIME NULL,
--   ADD COLUMN created_by INT NULL,
--   ADD COLUMN updated_by INT NULL,
--   ADD COLUMN deleted_by INT NULL,
--   ADD COLUMN restored_by INT NULL;
