require("dotenv").config();

const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const storeProductRoutes = require("./routes/storeProductRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const storeRoutes = require("./routes/storeRoutes");
const shoppingListRoutes = require("./routes/shoppingListRoutes");
const { initializeDatabaseSchema } = require("./config/initDatabase");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "success",
    data: null,
    message: "API operacional.",
  });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/store-products", storeProductRoutes);
app.use("/api/v1/shopping-lists", shoppingListRoutes);

app.use((_req, res) => {
  return res.status(404).json({
    status: "error",
    data: null,
    message: "Rota nao encontrada.",
  });
});

app.use((err, _req, res, _next) => {
  console.error("Erro nao tratado:", err);
  return res.status(500).json({
    status: "error",
    data: null,
    message: "Falha interna no servidor.",
  });
});

const PORT = Number(process.env.PORT || 3000);

const startServer = async () => {
  try {
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
