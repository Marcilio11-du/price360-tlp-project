const storeModel = require('../models/storeModels');

const getAllStores = async (req, res) => {
    try {
        const stores = await storeModel.findAllActives();
        res.status(200).json({ status: "success", data: stores });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

const getAllStoresIncludingDeleted = async (req, res) => {
  try {
    const stores = await storeModel.findAll();
    res.status(200).json({ status: "success", data: stores });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await storeModel.findById(id);
    if (!store) {
      return res.status(404).json({ status: "error", message: "Loja não encontrada" });
    }
    res.status(200).json({ status: "success", data: store });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const createStore = async (req, res) => {
  try {
    const { nif, name, street, municipality, email } = req.body;
    if (!nif) return res.status(400).json({ message: "O NIF é obrigatório" });
    if (!name) return res.status(400).json({ message: "O nome é obrigatório" });
    if (!street) return res.status(400).json({ message: "A rua é obrigatória" });
    if (!municipality) return res.status(400).json({ message: "O município é obrigatório" });
    if (!email) return res.status(400).json({ message: "O e-mail é obrigatório" });
    
    const store = await storeModel.create(nif, name, street, municipality, email);
    res.status(201).json({ status: "success", data: store });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ status: "error", message: "Já existe uma loja com este NIF" });
    } else {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
};

const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { nif, name, street, municipality, email } = req.body;
    if (!nif) return res.status(400).json({ message: "O NIF é obrigatório" });
    if (!name) return res.status(400).json({ message: "O nome é obrigatório" });
    if (!street) return res.status(400).json({ message: "A rua é obrigatória" });
    if (!municipality) return res.status(400).json({ message: "O município é obrigatório" });
    if (!email) return res.status(400).json({ message: "O e-mail é obrigatório" });

    const store = await storeModel.update(id, nif, name, street, municipality, email);
    if (!store) {
      return res.status(404).json({ status: "error", message: "Loja não encontrada" });
    }
    res.status(200).json({ status: "success", data: store });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ status: "error", message: "Já existe uma loja com este NIF" });
    } else {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
};

const softDeleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await storeModel.softDelete(id);
    if (!store) {
      return res.status(404).json({ status: "error", message: "Loja não encontrada" });
    }
    res.status(200).json({ status: "success", data: store });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const restoreStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await storeModel.restore(id);
    if (!store) {
      return res.status(404).json({ status: "error", message: "Loja não encontrada" });
    }
    res.status(200).json({ status: "success", data: store });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const hardDeleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await storeModel.delete(id);
    if (!store) {
      return res.status(404).json({ status: "error", message: "Loja não encontrada" });
    }
    res.status(200).json({ status: "success", data: store });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getAllStores,
  getAllStoresIncludingDeleted,
  getStoreById,
  createStore,
  updateStore,
  softDeleteStore,
  restoreStore,
  hardDeleteStore
};


