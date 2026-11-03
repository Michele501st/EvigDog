/**
 * @file authRoutes.js
 * @description Express routes for user authentication, profile management, and SuperAdmin user CRUD.
 */

const express = require('express');
const authService = require('../services/authService');
const { requireAuth, requireSuperAdmin } = require('../middleware/adminAuth');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticates admin credentials and returns a session token.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await authService.login(username, password);
    return res.json(result);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Returns currently logged-in user profile from session token.
 */
router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

/**
 * @route POST /api/auth/logout
 * @desc Terminates the active session.
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : req.headers['x-session-token'];

  if (token) {
    authService.logout(token);
  }
  return res.json({ success: true, message: 'Disconnesso con successo.' });
});

/**
 * @route PUT /api/auth/profile
 * @desc Updates username and/or password of the currently authenticated user.
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { newUsername, currentPassword, newPassword } = req.body || {};
    const updated = await authService.updateProfile(req.user.id, {
      newUsername,
      currentPassword,
      newPassword,
    });
    return res.json({
      success: true,
      message: 'Profilo aggiornato con successo.',
      user: updated,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Lists all administrator accounts (SuperAdmin only).
 */
router.get('/users', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const users = await authService.listUsers();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/admin/users
 * @desc Creates a new administrator account (SuperAdmin only).
 */
router.post('/users', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    const newUser = await authService.createUser({ username, password, role });
    return res.status(201).json({
      success: true,
      message: 'Nuovo utente creato con successo.',
      user: newUser,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Removes an administrator account (SuperAdmin only).
 */
router.delete('/users/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    const deleted = await authService.deleteUser(targetId, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Utente non trovato.' });
    }
    return res.json({ success: true, message: 'Utente eliminato con successo.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;

