/**
 * @module app
 * @description Ponto de entrada da aplicação Express.
 * Configura middlewares globais, regista todas as rotas da API versionada
 * (`/api/v1/...`), expondo também um endpoint de healthcheck.
 * Inclui handler 404 para rotas desconhecidas e handler de erro global
 * para exceções não tratadas pelos controllers.
 * A função `startServer` garante que o schema da base de dados está
 * inicializado antes de aceitar ligações HTTP.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const storeProductRoutes = require("./routes/storeProductRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const storeRoutes = require("./routes/storeRoutes");
const shoppingListRoutes = require("./routes/shoppingListRoutes");
const productShoppingListRoutes = require("./routes/productShoppingListRoutes");
const storePhoneRoutes = require("./routes/storePhoneRoutes");
const storeLinkRoutes = require("./routes/storeLinkRoutes");
const authRoutes = require("./routes/authRoutes");
const { initializeDatabaseSchema } = require("./config/initDatabase");

const app = express();

// --- Middlewares globais ---
// Permite pedidos cross-origin (CORS) de qualquer origem
app.use(cors());
// Interpreta o body dos pedidos como JSON e popula req.body
app.use(express.json());

// --- Healthcheck ---
/**
 * @route GET /health
 * @description Verifica se a API está operaçãonal. Útil para monitorização
 * e para ferramentas de orquestração (ex.: Docker, Kubernetes).
 */
app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "success",
    data: null,
    message: "API operacional.",
  });
});

// --- Rotas da API ---
// Autenticação (login)
app.use("/api/v1/auth", authRoutes);

// Entidades principais
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/products", productRoutes);

// Relações entre entidades
app.use("/api/v1/store-products", storeProductRoutes);
app.use("/api/v1/shopping-lists", shoppingListRoutes);
app.use("/api/v1/product-shopping-lists", productShoppingListRoutes);

// Informação de contacto de lojas
app.use("/api/v1/store-phones", storePhoneRoutes);
app.use("/api/v1/store-links", storeLinkRoutes);

// --- Handler 404 ---
// Captura qualquer rota que não tenha sido registada acima
app.use((_req, res) => {
  return res.status(404).json({
    status: "error",
    data: null,
    message: "Rota nao encontrada.",
  });
});

// --- Handler de erro global ---
// Captura erros não tratados propagados com next(err) ou lançados de forma
// síncrona em middlewares. Deve ter exatamente 4 parâmetros para o Express
// o reconhecer como handler de erro.
app.use((err, _req, res, _next) => {
  console.error("Erro nao tratado:", err);
  return res.status(500).json({
    status: "error",
    data: null,
    message: "Falha interna no servidor.",
  });
});

const PORT = Number(process.env.PORT || 3000);

/**
 * Inicializa o schema da base de dados e arranca o servidor HTTP.
 * A inicialização do schema é garantida antes de aceitar ligações;
 * em caso de falha crítica, o processo termina com código de saída 1.
 */
const startServer = async () => {
  try {
    // Garante que todas as tabelas e constraints estão criadas antes de aceitar pedidos
    await initializeDatabaseSchema();

    app.listen(PORT, () => {
      console.log(`Servidor ativo em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao inicializar schema da base de dados:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
