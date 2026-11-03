/**
 * @file adminAuth.js
 * @description Middleware to protect administrative API routes using the access code
 * configured via the ADMIN_ACCESS_CODE environment variable in .env.
 */

/**
 * Verifies that the request includes a valid `x-admin-code` header matching
 * the configured environment variable `process.env.ADMIN_ACCESS_CODE`.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
function requireAdminAuth(req, res, next) {
  const configuredCode = process.env.ADMIN_ACCESS_CODE;
  const providedCode = req.headers['x-admin-code'];

  // If ADMIN_ACCESS_CODE is set in .env, enforce matching header
  if (configuredCode && providedCode !== configuredCode) {
    return res.status(401).json({
      error: 'Codice di accesso Admin non valido o mancante.',
    });
  }

  return next();
}

module.exports = { requireAdminAuth };

