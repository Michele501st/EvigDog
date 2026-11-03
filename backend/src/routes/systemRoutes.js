/**
 * @file systemRoutes.js
 * @description System health check, container diagnostics (matching UNICAM AWMC Docker labs),
 * and real-time Maintenance Mode toggle endpoints.
 */

const express = require('express');
const os = require('os');
const {
  getSiteSettings,
  updateSiteSettings,
  getDbDiagnostics,
} = require('../config/db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * GET /api/health
 * Returns Cloud-Native container health telemetry (hostname, platform, uptime, memory, DB status).
 */
router.get('/health', async (_req, res) => {
  try {
    const settings = await getSiteSettings();
    const dbDiag = getDbDiagnostics();

    res.json({
      status: 'ok',
      service: 'evigdog-studio-backend',
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      uptimeSeconds: Math.round(process.uptime()),
      memoryMB: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        totalSystem: Math.round(os.totalmem() / 1024 / 1024),
      },
      database: dbDiag,
      maintenanceMode: Boolean(settings.maintenanceMode),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

/**
 * GET /api/status
 * Public endpoint returning whether the website is currently in Maintenance Mode.
 */
router.get('/status', async (_req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json({
      maintenanceMode: Boolean(settings.maintenanceMode),
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Impossibile verificare lo stato del servizio.' });
  }
});

/**
 * POST /api/status
 * Admin endpoint to enable or disable Maintenance Mode in real time.
 */
router.post('/status', requireAdminAuth, async (req, res) => {
  const { maintenanceMode } = req.body || {};

  if (typeof maintenanceMode !== 'boolean') {
    return res.status(400).json({
      error: 'Il parametro booleano maintenanceMode è obbligatorio.',
    });
  }

  try {
    const updated = await updateSiteSettings({ maintenanceMode });
    return res.json(updated);
  } catch (error) {
    console.error('[API] Failed to update maintenance status:', error);
    return res.status(500).json({ error: 'Impossibile aggiornare la modalità manutenzione.' });
  }
});

module.exports = router;

