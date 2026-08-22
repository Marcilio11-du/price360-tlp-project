const priceAlertModel = require("../../models/priceAlertModel");
const priceComparisonModel = require("../../models/priceComparisonModel");
const { sendMail } = require("../../services/mailer");
class PriceAlertChecker {
  static async checkAndNotify() {
    const alerts = await priceAlertModel.findActiveDueForCheck();
    for (const alert of alerts) {
      if (alert.notificado_em) continue;
      const comparison = await priceComparisonModel.getComparison(alert.id_produto);
      const price = comparison.estatisticas?.preco_min;
      if (price !== undefined && price <= Number(alert.preco_alvo)) {
        await sendMail({ to: alert.utilizador_email, subject: `O preço de ${alert.produto_nome} baixou para ${price} Kzs!`, html: `<p>O produto <strong>${alert.produto_nome}</strong> está disponível a <strong>${price} Kzs</strong>.</p>` });
        await priceAlertModel.markNotified(alert.id);
      }
    }
  }
}
module.exports = PriceAlertChecker;
