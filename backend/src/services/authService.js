/**
 * @file authService.js
 * @description Authentication and User Management Service.
 * Handles RBAC (SuperAdmin / Admin), password hashing, session tokens,
 * profile updating (username and password change), and user provisioning.
 */

const crypto = require('node:crypto');
const db = require('../config/db');
const { hashPassword, verifyPassword, generateSessionToken } = require('../utils/security');

// In-memory session store: token -> { userId, username, role, createdAt, lastActivity }
const activeSessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 ore

/**
 * Ensures at least one SuperAdmin user exists in the database.
 * If empty, seeds the default superadmin account from env variables.
 */
async function ensureSuperAdminSeed() {
  const users = await db.getItems('users');
  if (users.length === 0) {
    const username = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const password = process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_SECRET_CODE || process.env.ADMIN_ACCESS_CODE || 'evigdog2026';
    const initialSuperAdmin = {
      id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      username: username.trim(),
      passwordHash: hashPassword(password),
      role: 'superadmin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.insertItem('users', initialSuperAdmin);
    console.log(`[Auth] Initial SuperAdmin created: username="${initialSuperAdmin.username}"`);
  }
}

/**
 * Authenticates user credentials and creates an active session.
 * @param {string} username - User login name.
 * @param {string} password - User plaintext password.
 * @returns {Promise<{ token: string, user: { id: string, username: string, role: string } }>}
 */
async function login(username, password) {
  if (!username || !password) {
    throw new Error('Username e password sono obbligatori.');
  }

  await ensureSuperAdminSeed();
  const users = await db.getItems('users');
  const user = users.find(
    (u) => u.username.toLowerCase() === String(username).trim().toLowerCase()
  );

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Credenziali non valide. Verifica username e password.');
  }

  const token = generateSessionToken();
  const sessionData = {
    userId: user.id,
    username: user.username,
    role: user.role,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  activeSessions.set(token, sessionData);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
}

/**
 * Validates a session token and returns the current user profile.
 * @param {string} token - Session bearer token.
 * @returns {Promise<{ id: string, username: string, role: string }|null>}
 */
async function getSessionUser(token) {
  if (!token || typeof token !== 'string') return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() - session.lastActivity > SESSION_TTL_MS) {
    activeSessions.delete(token);
    return null;
  }

  session.lastActivity = Date.now();

  // Recupera i dati aggiornati dal database per verificare che l'utente esista ancora
  const users = await db.getItems('users');
  const user = users.find((u) => u.id === session.userId);
  if (!user) {
    activeSessions.delete(token);
    return null;
  }

  // Sincronizza username/ruolo in caso di modifiche recenti
  session.username = user.username;
  session.role = user.role;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}

/**
 * Destroys an active session token.
 * @param {string} token - Session bearer token to invalidate.
 */
function logout(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

/**
 * Updates username and/or password for an authenticated user.
 * @param {string} userId - User identifier.
 * @param {object} params - Profile updates.
 * @param {string} [params.newUsername] - New username.
 * @param {string} [params.currentPassword] - Current password (required if changing password).
 * @param {string} [params.newPassword] - New password.
 * @returns {Promise<{ id: string, username: string, role: string }>} Updated user.
 */
async function updateProfile(userId, { newUsername, currentPassword, newPassword }) {
  const users = await db.getItems('users');
  const user = users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('Utente non trovato.');
  }

  const updates = { updatedAt: new Date().toISOString() };

  // 1. Modifica Username
  if (newUsername && newUsername.trim()) {
    const cleanUsername = newUsername.trim();
    if (cleanUsername.length < 3) {
      throw new Error('Lo username deve contenere almeno 3 caratteri.');
    }
    const duplicate = users.find(
      (u) => u.id !== userId && u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (duplicate) {
      throw new Error('Questo username è già in uso da un altro utente.');
    }
    updates.username = cleanUsername;
  }

  // 2. Modifica Password
  if (newPassword) {
    if (!currentPassword) {
      throw new Error('Inserisci la password attuale per confermare la nuova password.');
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error('La password attuale inserita non è corretta.');
    }
    if (newPassword.length < 6) {
      throw new Error('La nuova password deve contenere almeno 6 caratteri.');
    }
    updates.passwordHash = hashPassword(newPassword);
  }

  const updatedUser = await db.updateItemById('users', userId, updates);

  // Aggiorna anche le sessioni attive dell'utente
  for (const session of activeSessions.values()) {
    if (session.userId === userId && updates.username) {
      session.username = updates.username;
    }
  }

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    role: updatedUser.role,
  };
}

/**
 * Returns the list of all registered users (excluding sensitive password hashes).
 * @returns {Promise<Array<{ id: string, username: string, role: string, createdAt: string }>>}
 */
async function listUsers() {
  await ensureSuperAdminSeed();
  const users = await db.getItems('users');
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

/**
 * Creates a new administrator account (allowed only by SuperAdmin).
 * @param {object} param0 - New user details.
 * @param {string} param0.username - Desired username.
 * @param {string} param0.password - Initial password.
 * @param {string} [param0.role='admin'] - Role ('admin' or 'superadmin').
 * @returns {Promise<{ id: string, username: string, role: string, createdAt: string }>}
 */
async function createUser({ username, password, role = 'admin' }) {
  if (!username || !password) {
    throw new Error('Username e password sono obbligatori per il nuovo account.');
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    throw new Error('Lo username deve contenere almeno 3 caratteri.');
  }

  if (password.length < 6) {
    throw new Error('La password deve contenere almeno 6 caratteri.');
  }

  const allowedRoles = ['admin', 'superadmin'];
  const userRole = allowedRoles.includes(role) ? role : 'admin';

  const users = await db.getItems('users');
  const duplicate = users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (duplicate) {
    throw new Error('Questo username è già in uso.');
  }

  const newUser = {
    id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    username: cleanUsername,
    passwordHash: hashPassword(password),
    role: userRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.insertItem('users', newUser);

  return {
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    createdAt: newUser.createdAt,
  };
}

/**
 * Deletes an administrator account. Prevents self-deletion or removing the last SuperAdmin.
 * @param {string} targetUserId - ID of the user to remove.
 * @param {string} currentUserId - ID of the operator performing the deletion.
 * @returns {Promise<boolean>} True if deleted.
 */
async function deleteUser(targetUserId, currentUserId) {
  if (targetUserId === currentUserId) {
    throw new Error('Non puoi eliminare il tuo stesso account.');
  }

  const users = await db.getItems('users');
  const target = users.find((u) => u.id === targetUserId);
  if (!target) {
    throw new Error('Utente da eliminare non trovato.');
  }

  if (target.role === 'superadmin') {
    const superAdmins = users.filter((u) => u.role === 'superadmin');
    if (superAdmins.length <= 1) {
      throw new Error('Impossibile eliminare l’unico SuperAdmin del sistema.');
    }
  }

  const deleted = await db.deleteItemById('users', targetUserId);

  // Invalida le sessioni aperte dell'utente eliminato
  for (const [token, session] of activeSessions.entries()) {
    if (session.userId === targetUserId) {
      activeSessions.delete(token);
    }
  }

  return deleted;
}

/**
 * Clears in-memory active sessions (used during unit testing).
 */
function resetSessionsForTests() {
  activeSessions.clear();
}

module.exports = {
  ensureSuperAdminSeed,
  login,
  logout,
  getSessionUser,
  updateProfile,
  listUsers,
  createUser,
  deleteUser,
  resetSessionsForTests,
};

