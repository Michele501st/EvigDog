/**
 * @file adminAuth.js
 * @description RBAC Middleware for protecting administrative API routes.
 * Supports Bearer session tokens (with SuperAdmin privilege check)
 * and legacy header fallback for backward compatibility.
 */

const authService = require('../services/authService');

/**
 * Extracts bearer token from Authorization header or custom headers.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (req.headers['x-session-token']) {
    return String(req.headers['x-session-token']).trim();
  }
  return null;
}

/**
 * Middleware ensuring the client has a valid authenticated session.
 * Attaches the user object to `req.user`.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (token) {
    const user = await authService.getSessionUser(token);
    if (user) {
      req.user = user;
      return next();
    }
  }

  // Fallback di retrocompatibilità: verifica x-admin-code o ADMIN_ACCESS_CODE
  const legacyCode = req.headers['x-admin-code'];
  const configuredCode = process.env.ADMIN_SECRET_CODE || process.env.ADMIN_ACCESS_CODE || 'evigdog-admin-2026';
  if (legacyCode && legacyCode === configuredCode) {
    req.user = {
      id: 'legacy-admin',
      username: 'admin',
      role: 'superadmin',
    };
    return next();
  }

  return res.status(401).json({
    error: 'Accesso non autorizzato. Effettua il login per accedere.',
  });
}

/**
 * Middleware restricting access exclusively to SuperAdmin accounts.
 * Must be mounted after `requireAuth`.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Sessione non autenticata.' });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      error: 'Operazione non consentita: permessi di SuperAdmin richiesti.',
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireSuperAdmin,
  // Alias for backward compatibility
  requireAdminAuth: requireAuth,
};
