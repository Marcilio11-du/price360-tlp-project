const nodemailer = require("nodemailer");
let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  return transporter;
};
const sendMail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) { console.warn("[mailer] SMTP não configurado — email não enviado:", subject); return { sent: false, reason: "smtp_not_configured" }; }
  try { await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, html }); return { sent: true }; }
  catch (error) { console.error("[mailer] Falha ao enviar email:", error.message); return { sent: false, reason: error.message }; }
};
module.exports = { sendMail };
