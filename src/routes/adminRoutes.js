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
const { getScheduler } = require('../scrapers/scheduler');
const { SCRAPER_CONFIG } = require('../scrapers/base/ScraperConfig');
const reviewModel = require('../models/reviewModel');

const LOGS_DIR = path.resolve(__dirname, '../../logs/scrapers');

/**
 * GET /admin/reviews
 * Todas as avaliações activas, para moderação.
 */
router.get('/reviews', isAdmin, async (req, res) => {
  try {
    const avaliacoes = await reviewModel.findAllWithNames();
    return res.json({ status: 'success', data: avaliacoes, message: 'Avaliações listadas.' });
  } catch (error) {
    console.error('Erro ao listar avaliações (admin):', error);
    return res.status(500).json({ status: 'error', data: null, message: 'Falha ao listar avaliações.' });
  }
});

/**
 * GET /admin/scraping/config
 * Lista os scrapers configurados (sem expor classes/funções internas).
 */
router.get('/scraping/config', isAdmin, (req, res) => {
  const scrapers = Object.values(SCRAPER_CONFIG || {}).map((s) => ({
    codigo: s.codigo,
    nome: s.nome,
    ativo: !!s.ativo,
    categoria_principal: s.categoria_principal || null,
    prioridade: s.prioridade ?? null,
    intervaloExecucao: s.intervaloExecucao || null,
    horaExecucao: s.horaExecucao || null,
  }));
  return res.json({
    status: 'success',
    data: { total: scrapers.length, scrapers },
    message: 'Configuração de scrapers obtida.',
  });
});

/**
 * POST /admin/scraping/run
 * Dispara o pipeline de scraping de forma ASSÍNCRONA (fire-and-forget).
 * Responde imediatamente com 202; o resultado pode ser acompanhado em
 * GET /admin/scraping/status. Ideal para um cron externo em produção
 * (ex.: cron-job.org a chamar este endpoint diariamente).
 */
router.post('/scraping/run', isAdmin, (req, res) => {
  const scheduler = getScheduler();
  if (!scheduler) {
    return res.status(503).json({ status: 'error', data: null, message: 'Scheduler não inicializado.' });
  }
  const resultado = scheduler.triggerAsync();
  if (!resultado.iniciado) {
    return res.status(409).json({ status: 'error', data: resultado, message: resultado.motivo });
  }
  return res.status(202).json({
    status: 'success',
    data: { iniciadoEm: new Date().toISOString() },
    message: 'Pipeline de scraping iniciado em segundo plano.',
  });
});

/**
 * GET /admin/scraping/status
 * Estado actual do agendador e da última execução do pipeline.
 */
router.get('/scraping/status', isAdmin, (req, res) => {
  const scheduler = getScheduler();
  if (!scheduler) {
    return res.status(503).json({ status: 'error', data: null, message: 'Scheduler não inicializado.' });
  }
  return res.json({ status: 'success', data: scheduler.getStatus(), message: 'Estado do scraper obtido.' });
});

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
