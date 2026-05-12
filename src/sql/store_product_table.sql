-- DDL de referencia para Produto_Loja

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
);
