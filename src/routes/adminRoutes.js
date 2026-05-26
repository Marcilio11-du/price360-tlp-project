/**
 * @module adminRoutes
 * @description Rotas administrativas protegidas por isAdmin.
 * Prefixo registado em app.js: `/api/v1/admin`
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { isAdmin } = require('../middlewares/authenticate');

const LOGS_DIR = path.resolve(__dirname, '../../logs/scrapers');

/**
 * GET /admin/logs
 * Devolve as últimas N linhas do log de scrapers mais recente.
 * Query param: ?limit=200 (default 200, max 1000)
 */
router.get('/logs', isAdmin, (req, res) => {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      return res.json({ status: 'success', data: [], message: 'Sem logs disponíveis.' });
    }

    // Ordena por nome desc e pega o mais recente
    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.log'))
      .sort()
      .reverse();

    if (files.length === 0) {
      return res.json({ status: 'success', data: [], message: 'Sem logs disponíveis.' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
    const filePath = path.join(LOGS_DIR, files[0]);
    const raw = fs.readFileSync(filePath, 'utf8');

    const entries = raw
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line); }
        catch { return { timestamp: null, level: 'RAW', message: line }; }
      })
      .slice(-limit)
      .reverse(); // mais recentes primeiro

    return res.json({
      status: 'success',
      data: { file: files[0], entries },
      message: `Últimas ${entries.length} entradas do log.`,
    });
  } catch (err) {
    console.error('Erro ao ler logs:', err);
    return res.status(500).json({ status: 'error', data: null, message: 'Falha ao ler logs.' });
  }
});

/**
 * GET /admin/logs/files
 * Lista todos os ficheiros de log disponíveis.
 */
router.get('/logs/files', isAdmin, (req, res) => {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      return res.json({ status: 'success', data: [], message: 'Sem ficheiros de log.' });
    }
    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.log'))
      .sort()
      .reverse();
    return res.json({ status: 'success', data: files, message: 'Ficheiros de log listados.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', data: null, message: 'Falha ao listar logs.' });
  }
});

module.exports = router;
