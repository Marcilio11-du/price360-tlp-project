Este guia detalha a construção da API seguindo padrões de mercado. A arquitetura será baseada na separação de preocupações (*Separation of Concerns*), permitindo que o sistema seja escalável, testável e de fácil manutenção.

---

## 1. Arquitetura Modular e Estrutura de Pastas

A organização do projeto deve refletir a lógica do fluxo de dados. Cada pasta tem uma responsabilidade única e bem definida:

* **`src/config/`**: Centraliza as configurações do ambiente, como o **Pool de Conexões** do MySQL e variáveis de ambiente (`.env`).
* **`src/models/`**: Camada de persistência. Contém exclusivamente as queries SQL. É a única parte do código que "conhece" a estrutura das tabelas do banco de dados.
* **`src/controllers/`**: Camada de orquestração. Recebe as requisições, processa a lógica de negócio necessária e define qual resposta enviar ao cliente.
* **`src/routes/`**: Camada de entrada. Mapeia os métodos HTTP (GET, POST, etc.) para as funções específicas nos controllers.
* **`src/middlewares/`**: Funções intermediárias que tratam de validações, autenticação e logs antes de a requisição chegar ao controller.

---

## 2. O Ciclo de Vida de uma Requisição (Padrão de Implementação)

Para cada funcionalidade descrita nos Requisitos Funcionais (RF), seguiremos o seguinte padrão de desenvolvimento:

### A. O Model (Camada de Dados)

Utilizamos o conhecimento em SQL para realizar operações otimizadas. É mandatório o uso de *Prepared Statements* para garantir a segurança contra SQL Injection.

```javascript
// Local: src/models/productModel.js
// Exemplo: Busca avançada com JOIN para comparação de preços (RF06)
const getPriceComparison = async (productId) => {
  const sql = `
    SELECT l.nome_loja, pl.preco, pl.disponibilidade, l.localizacao
    FROM Produto_Loja pl
    JOIN Loja l ON pl.id_loja = l.id
    WHERE pl.id_produto = ?
    ORDER BY pl.preco ASC`;
  const [results] = await db.execute(sql, [productId]);
  return results;
};

```

### B. O Controller (Camada de Lógica)

O controller deve ser responsável pelo tratamento das exceções (`try/catch`) e pela definição dos **HTTP Status Codes** adequados.

```javascript
// Local: src/controllers/productController.js
const comparePrices = async (req, res) => {
  try {
    const { id } = req.params;
    const comparison = await productModel.getPriceComparison(id);
    
    if (comparison.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado nas lojas parceiras." });
    }
    
    return res.status(200).json(comparison);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Falha interna ao processar comparação." });
  }
};

```

---

## 3. Validação e Consistência (Middlewares)

Para garantir que a API não processe dados inválidos, implementamos uma camada de validação. Isso reduz a carga cognitiva no controller, permitindo que ele foque apenas na lógica principal.

* **Validação de Payload:** Antes de criar um usuário (RF03), um middleware verifica se o e-mail é válido e se a senha cumpre os requisitos de segurança.
* **Sanitização:** Garante que os termos de busca (RF01) não contenham caracteres maliciosos ou desnecessários.

---

## 4. Gestão de Respostas e Padronização JSON

Para que o frontend (JavaScript Vanilla) consiga interpretar os dados com facilidade, todas as respostas da API devem seguir um formato padrão:

```json
{
  "status": "success",
  "data": [],
  "message": "Operação realizada com sucesso"
}

```

---

## 5. Documentação e Evolução

Cada endpoint criado deve ser acompanhado de uma breve descrição técnica para facilitar o **Code Review**. No ambiente de desenvolvimento, é recomendada a utilização de ferramentas de teste de API (como Insomnia ou Postman) para validar os fluxos antes da integração com a interface gráfica.

### Mapeamento de Endpoints Prioritários:

1. `GET /api/v1/products/search`: Implementa a lógica de busca por termo ou categoria.
2. `POST /api/v1/auth/login`: Autenticação e geração de token de acesso.
3. `GET /api/v1/stores/locations`: Lista lojas disponíveis por município (Filtro geográfico).
4. `POST /api/v1/user/lists`: Persistência das listas de compras criadas pelo utilizador.

Este guia serve como o padrão técnico definitivo para o desenvolvimento do backend, assegurando que o **Price360** seja uma solução profissional, segura e alinhada com as melhores práticas de engenharia de software.