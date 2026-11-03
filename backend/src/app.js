/**
 * @file app.js
 * @description Express application factory. Registers middleware, REST API routes (/api/*),
 * authentication and user management routes, and serves the static Frontend directory.
 */

const path = require('path');
const express = require('express');
const cors = require('cors');

const contentRoutes = require('./routes/contentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const systemRoutes = require('./routes/systemRoutes');
const authRoutes = require('./routes/authRoutes');

/**
 * Creates and configures the Express application instance.
 * @returns {import('express').Express} Configured Express app.
 */
function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount modular REST API routes under /api
  app.use('/api', systemRoutes);
  app.use('/api', contentRoutes);
  app.use('/api', contactRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', authRoutes);

  // Serve static frontend files when running standalone (outside Nginx container)
  const frontendPath = path.resolve(__dirname, '..', '..', 'frontend');
  app.use(express.static(frontendPath));

  // API 404 handler
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint API non trovato.' });
  });

  return app;
}

module.exports = { createApp };
