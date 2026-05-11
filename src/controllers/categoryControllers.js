const categoryModel = require('../models/categoryModels');

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.findAllActives();
    res.status(200).json({ status: "success", data: categories });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getAllCategoriesIncludingDeleted = async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    res.status(200).json({ status: "success", data: categories });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ status: "error", message: "Categoria não encontrada" });
    }
    res.status(200).json({ status: "success", data: category });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "O nome é obrigatório" });
    if (!description) return res.status(400).json({ message: "A descrição é obrigatória" });
    
    const category = await categoryModel.create(name, description);
    res.status(201).json({ status: "success", data: category });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ status: "error", message: "Já existe uma categoria com este nome" });
    } else {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "O nome é obrigatório" });
    if (!description) return res.status(400).json({ message: "A descrição é obrigatória" });
    
    const category = await categoryModel.update(id, name, description);
    if (!category) {
      return res.status(404).json({ status: "error", message: "Categoria não encontrada" });
    }
    res.status(200).json({ status: "success", data: category });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ status: "error", message: "Já existe uma categoria com este nome" });
    } else {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
};

const softDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.softDelete(id);
    if (!category) {
      return res.status(404).json({ status: "error", message: "Categoria não encontrada" });
    }
    res.status(200).json({ status: "success", data: category });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.restore(id);
    if (!category) {
      return res.status(404).json({ status: "error", message: "Categoria não encontrada" });
    }
    res.status(200).json({ status: "success", data: category });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const hardDeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.delete(id);
    if (!category) {
      return res.status(404).json({ status: "error", message: "Categoria não encontrada" });
    }
    res.status(200).json({ status: "success", data: category });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { 
  getAllCategories, 
  getAllCategoriesIncludingDeleted, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  softDeleteCategory, 
  restoreCategory, 
  hardDeleteCategory 
};