/**
 * @module multerConfig
 * @description Configuração centralizada do Multer para upload de ficheiros.
 * Define o armazenamento, filtro de ficheiros e limites.
 */

const multer = require("multer");
const path = require("path");

/**
 * Configuração de armazenamento do Multer.
 * Armazena ficheiros no diretório temporário do sistema com nome único.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Armazenar em directório temporário do sistema
    cb(null, "/tmp");
  },
  filename: (req, file, cb) => {
    // Gerar nome único: timestamp_randomstring_filename
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${random}_${name}${ext}`);
  },
});

/**
 * Função de filtro para validar tipos de ficheiro.
 * Apenas aceita ficheiros de imagem.
 */
const fileFilter = (req, file, cb) => {
  // Tipos MIME permitidos para avatares
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = allowedMimes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.includes(ext);

  if (!isValidMime || !isValidExtension) {
    return cb(
      new Error(
        `Tipo de ficheiro não permitido: ${file.mimetype}. Envie uma imagem válida (JPEG, PNG, WebP ou GIF).`,
      ),
    );
  }

  cb(null, true);
};

/**
 * Instância configurada do Multer para upload de avatares.
 * 
 * Limitações:
 *  - Tamanho máximo: 5MB
 *  - Número máximo de ficheiros: 1
 *  - Tipos de ficheiro: imagens apenas (JPEG, PNG, WebP, GIF)
 */
const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB em bytes
    files: 1,
  },
});

module.exports = uploadAvatar;
