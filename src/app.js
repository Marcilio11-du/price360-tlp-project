const express = require('express');
const cors = require('cors');
const categoryRoutes = require('./routes/categoryRoutes');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/v1/categories', categoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Price360 rodando na porta ${PORT}`);
});