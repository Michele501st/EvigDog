/**
 * @file contactRoutes.js
 * @description REST API endpoints for submitting and managing Contact Form inquiries
 * and Footer newsletter/callback leads. Supports full CRUD for the Admin Dashboard.
 */

const express = require('express');
const crypto = require('crypto');
const {
  getItems,
  insertItem,
  updateItemById,
  deleteItemById,
} = require('../config/db');
const { requireAdminAuth } = require('../middleware/adminAuth');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = ['nuovo', 'in_lavorazione', 'completato'];

/**
 * POST /api/contacts
 * Validates and persists a new inquiry submitted from the Contatti form.
 */
router.post('/contacts', async (req, res) => {
  const { name, email, projectType, budget, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'I campi Nome e Cognome, Email e Raccontaci il tuo Progetto sono obbligatori.',
    });
  }

  const trimmedEmail = String(email).trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({
      error: 'Inserisci un indirizzo email valido.',
    });
  }

  try {
    const newContact = {
      id: `cnt-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: trimmedEmail,
      projectType: projectType ? String(projectType).trim() : 'Non specificato',
      budget: budget ? String(budget).trim() : 'Non specificato',
      message: String(message).trim(),
      status: 'nuovo',
      createdAt: new Date().toISOString(),
    };

    const saved = await insertItem('contacts', newContact);
    return res.status(201).json(saved);
  } catch (error) {
    console.error('[API] Failed to save contact:', error);
    return res.status(500).json({ error: 'Impossibile salvare il messaggio al momento.' });
  }
});

/**
 * GET /api/contacts
 * Admin endpoint to retrieve all submitted contact inquiries sorted newest first.
 */
router.get('/contacts', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'tutti' ? { status: String(status) } : {};
    const contacts = await getItems('contacts', filter);
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(contacts);
  } catch (error) {
    console.error('[API] Failed to list contacts:', error);
    return res.status(500).json({ error: 'Impossibile caricare i messaggi.' });
  }
});

/**
 * PATCH /api/contacts/:id
 * Admin endpoint to update the workflow status of a contact inquiry.
 */
router.patch('/contacts/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Stato non valido. Valori ammessi: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const updated = await updateItemById('contacts', id, {
      status,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      return res.status(404).json({ error: 'Messaggio non trovato.' });
    }
    return res.json(updated);
  } catch (error) {
    console.error('[API] Failed to update contact:', error);
    return res.status(500).json({ error: 'Errore durante l’aggiornamento dello stato.' });
  }
});

/**
 * DELETE /api/contacts/:id
 * Admin endpoint to delete a contact inquiry.
 */
router.delete('/contacts/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteItemById('contacts', id);
    if (!deleted) {
      return res.status(404).json({ error: 'Messaggio non trovato.' });
    }
    return res.json({ deleted: true, id });
  } catch (error) {
    console.error('[API] Failed to delete contact:', error);
    return res.status(500).json({ error: 'Errore durante l’eliminazione del messaggio.' });
  }
});

/**
 * POST /api/newsletter
 * Saves a quick email contact submitted from the SiteFooter CTA form.
 */
router.post('/newsletter', async (req, res) => {
  const { email, source } = req.body || {};
  const trimmedEmail = email ? String(email).trim() : '';

  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
  }

  try {
    const entry = {
      id: `nl-${crypto.randomUUID().slice(0, 8)}`,
      email: trimmedEmail,
      source: source ? String(source).trim() : 'Footer CTA',
      createdAt: new Date().toISOString(),
    };
    const saved = await insertItem('newsletter', entry);
    return res.status(201).json(saved);
  } catch (error) {
    console.error('[API] Failed to save newsletter lead:', error);
    return res.status(500).json({ error: 'Impossibile registrare l’email al momento.' });
  }
});

/**
 * GET /api/newsletter
 * Admin endpoint to list all quick email leads submitted from the Footer.
 */
router.get('/newsletter', requireAdminAuth, async (_req, res) => {
  try {
    const leads = await getItems('newsletter');
    leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(leads);
  } catch (error) {
    console.error('[API] Failed to list newsletter leads:', error);
    return res.status(500).json({ error: 'Impossibile caricare le email registrate.' });
  }
});

/**
 * DELETE /api/newsletter/:id
 * Admin endpoint to remove an email lead.
 */
router.delete('/newsletter/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteItemById('newsletter', id);
    if (!deleted) {
      return res.status(404).json({ error: 'Email non trovata.' });
    }
    return res.json({ deleted: true, id });
  } catch (error) {
    console.error('[API] Failed to delete newsletter lead:', error);
    return res.status(500).json({ error: 'Errore durante la rimozione dell’email.' });
  }
});

module.exports = router;

