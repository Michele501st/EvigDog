/**
 * @file contentRoutes.js
 * @description Public read-only REST API endpoints serving Portfolio projects, Services,
 * Team members, and FAQs stored in the database.
 */

const express = require('express');
const { getItems } = require('../config/db');

const router = express.Router();

/**
 * GET /api/projects
 * Returns portfolio projects, optionally filtered by `?category=...` or `?featured=true`.
 */
router.get('/projects', async (req, res) => {
  try {
    const { category, featured } = req.query;
    const filter = {};
    if (category && category !== 'Tutti') {
      filter.category = String(category);
    }
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }
    const projects = await getItems('projects', filter);
    res.json(projects);
  } catch (error) {
    console.error('[API] Failed to fetch projects:', error);
    res.status(500).json({ error: 'Impossibile recuperare i progetti del portfolio.' });
  }
});

/**
 * GET /api/services
 * Returns all 6 studio services with tags and descriptions.
 */
router.get('/services', async (_req, res) => {
  try {
    const services = await getItems('services');
    res.json(services);
  } catch (error) {
    console.error('[API] Failed to fetch services:', error);
    res.status(500).json({ error: 'Impossibile recuperare i servizi.' });
  }
});

/**
 * GET /api/team
 * Returns the 5 team members for the interactive Team slider and grid.
 */
router.get('/team', async (_req, res) => {
  try {
    const team = await getItems('team');
    res.json(team);
  } catch (error) {
    console.error('[API] Failed to fetch team:', error);
    res.status(500).json({ error: 'Impossibile recuperare i membri del team.' });
  }
});

/**
 * GET /api/faqs
 * Returns frequently asked questions for theMetodo and Contatti pages.
 */
router.get('/faqs', async (_req, res) => {
  try {
    const faqs = await getItems('faqs');
    res.json(faqs);
  } catch (error) {
    console.error('[API] Failed to fetch FAQs:', error);
    res.status(500).json({ error: 'Impossibile recuperare le FAQ.' });
  }
});

module.exports = router;

