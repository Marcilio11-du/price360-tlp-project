const categoryModel = require('../models/categoryModel');

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    res.status(200).json({ status: "success", data: categories });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ message: "O nome é obrigatório" });
    
    const id = await categoryModel.create(nome);
    res.status(201).json({ status: "success", data: { id, nome } });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { getAllCategories, createCategory };