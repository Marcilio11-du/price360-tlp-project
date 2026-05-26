/**
 * @module avatarController
 * @description Handlers para upload e gestão de avatares de utilizadores.
 * Integra multer para manipulação de ficheiros e userModel para persistência.
 */

const fs = require("fs").promises;
const path = require("path");
const userModel = require("../models/userModel");

/**
 * Envia uma resposta JSON de sucesso com estrutura normalizada.
 *
 * @param {import('express').Response} res - Objecto de resposta Express.
 * @param {number} statusCode - Código HTTP a enviar.
 * @param {*} data - Dados a incluir no campo `data`.
 * @param {string} message - Mensagem descritiva.
 * @returns {import('express').Response}
 */
const sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    status: "success",
    data,
    message,
  });
};

/**
 * Envia uma resposta JSON de erro com estrutura normalizada.
 *
 * @param {import('express').Response} res - Objecto de resposta Express.
 * @param {number} statusCode - Código HTTP a enviar.
 * @param {string} message - Mensagem de erro legível.
 * @param {Array|null} details - Lista opcional de detalhes de validação.
 * @returns {import('express').Response}
 */
const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    status: "error",
    data: null,
    message,
    details,
  });
};

/**
 * Realiza o upload do avatar de um utilizador.
 * 
 * Fluxo:
 *  1. Verifica se o utilizador existe e está ativo.
 *  2. Valida se um ficheiro foi enviado.
 *  3. Cria o diretório de uploads se não existir.
 *  4. Se o utilizador já tinha um avatar anterior, remove-o.
 *  5. Move o ficheiro temporário para a localização final.
 *  6. Actualiza o registo do utilizador com o novo caminho.
 *  7. Devolve o utilizador actualizado.
 * 
 * @route POST /api/v1/users/:id/upload-avatar
 * @param {import('express').Request} req - Pedido com arquivo em req.file
 * @param {import('express').Response} res - Resposta HTTP
 * @returns {Promise<void>}
 */
const uploadUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    // Validação: Arquivo presente
    if (!req.file) {
      return sendError(res, 400, "Nenhum ficheiro foi enviado.", [
        "É necessário enviar um ficheiro de imagem.",
      ]);
    }

    // Verificar se o utilizador existe e está ativo
    const user = await userModel.getUserById(id);
    if (!user) {
      // Limpar ficheiro temporário
      if (req.file.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return sendError(res, 404, "Utilizador não encontrado.");
    }

    // Criar diretório de uploads se não existir
    const uploadsDir = path.join(__dirname, "..", "..", "frontend", "assets", "avatars");
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (dirError) {
      console.error("Erro ao criar diretório de avatares:", dirError);
      if (req.file.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return sendError(res, 500, "Falha ao criar diretório de uploads.");
    }

    // Se o utilizador já tinha avatar anterior, remover
    if (user.avatar_path) {
      const oldAvatarPath = path.join(__dirname, "..", "..", "frontend", user.avatar_path);
      try {
        await fs.unlink(oldAvatarPath);
        console.log(`Avatar anterior removido: ${oldAvatarPath}`);
      } catch (unlinkError) {
        console.warn(`Aviso: Não foi possível remover avatar anterior (${oldAvatarPath}):`, unlinkError.message);
        // Não falha a operação se o ficheiro anterior não puder ser removido
      }
    }

    // Gerar nome de ficheiro único e seguro
    // Formato: user_{id}_avatar_{timestamp}.{extensão}
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const fileName = `user_${id}_avatar_${Date.now()}${fileExtension}`;
    const finalPath = path.join(uploadsDir, fileName);
    const relativePath = `assets/avatars/${fileName}`;

    // Mover ficheiro para localização final
    try {
      await fs.rename(req.file.path, finalPath);
      console.log(`Avatar salvo com sucesso: ${finalPath}`);
    } catch (moveError) {
      console.error("Erro ao mover ficheiro:", moveError);
      if (req.file.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return sendError(res, 500, "Falha ao processar upload do ficheiro.");
    }

    // Actualizar registo do utilizador com novo caminho de avatar
    try {
      const affectedRows = await userModel.updateUserAvatar(id, relativePath);
      if (affectedRows === 0) {
        // Utilizador foi removido entre a verificação e a actualização
        await fs.unlink(finalPath).catch(() => {});
        return sendError(res, 404, "Utilizador não encontrado ou foi removido.");
      }
    } catch (dbError) {
      console.error("Erro ao actualizar avatar no banco de dados:", dbError);
      await fs.unlink(finalPath).catch(() => {});
      return sendError(res, 500, "Falha ao gravar caminho do avatar na base de dados.");
    }

    // Buscar utilizador actualizado para devolver
    const updatedUser = await userModel.getUserById(id);
    if (!updatedUser) {
      // Situação improvável mas possível
      return sendError(res, 500, "Falha ao recuperar utilizador actualizado.");
    }

    return sendSuccess(
      res,
      200,
      { user: updatedUser, avatarPath: relativePath },
      "Avatar enviado e guardado com sucesso.",
    );
  } catch (error) {
    console.error("Erro inesperado ao fazer upload de avatar:", error);
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    return sendError(res, 500, "Falha inesperada ao processar avatar.");
  }
};

module.exports = {
  uploadUserAvatar,
};
