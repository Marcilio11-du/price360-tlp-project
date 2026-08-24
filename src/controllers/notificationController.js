/**
 * @module notificationController
 * @description Central de notificações do utilizador: junta os alertas de
 * preço já notificados com as quedas de preço em produtos favouritados.
 */

const priceAlertModel = require("../models/priceAlertModel");
const favoriteModel = require("../models/favoriteModel");

/** Resposta de sucesso normalizada. */
const sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({ status: "success", data, message });
};

/** Resposta de erro normalizada. */
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({ status: "error", data: null, message });
};

/**
 * GET /notifications   (autenticado)
 */
const listNotifications = async (req, res) => {
  try {
    const idUtilizador = req.user.id;
    const [alertas, quedasFavoritos] = await Promise.all([
      priceAlertModel.findNotifiedByUser(idUtilizador),
      favoriteModel.findPriceDrops(idUtilizador),
    ]);

    const naoVistas = alertas.filter((a) => !a.visto).length;

    return sendSuccess(
      res,
      200,
      { alertas, favoritos: quedasFavoritos, totalNaoVistas: naoVistas },
      "Notificações obtidas com sucesso.",
    );
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    return sendError(res, 500, "Falha interna ao obter notificações.");
  }
};

/**
 * PATCH /notifications/:alertId/marcar-visto   (autenticado)
 */
const marcarVisto = async (req, res) => {
  try {
    const alertId = Number(req.params.alertId);
    if (!Number.isInteger(alertId) || alertId <= 0) {
      return sendError(res, 400, "id de alerta inválido.");
    }

    const marcado = await priceAlertModel.markVisto(alertId, req.user.id);
    if (!marcado) {
      return sendError(res, 404, "Notificação não encontrada.");
    }

    return sendSuccess(res, 200, null, "Notificação marcada como vista.");
  } catch (error) {
    console.error("Erro ao marcar notificação como vista:", error);
    return sendError(res, 500, "Falha interna ao actualizar notificação.");
  }
};

module.exports = { listNotifications, marcarVisto };
