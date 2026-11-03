/**
 * @file security.js
 * @description Cryptographic utilities for secure password hashing (scrypt) and session token generation
 * using Node.js native `node:crypto` without external dependencies.
 */

const crypto = require('node:crypto');

/**
 * Hashes a plaintext password using scrypt with a unique 16-byte cryptographically secure random salt.
 * @param {string} password - Plaintext password.
 * @returns {string} Salted hash in format `salt:hash`.
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password non valida per l’hashing.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored `salt:hash` string using constant-time comparison.
 * @param {string} password - Plaintext password to verify.
 * @param {string} storedHash - Stored string in format `salt:hash`.
 * @returns {boolean} True if password matches.
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch (_e) {
    return false;
  }
}

/**
 * Generates a cryptographically strong random session token.
 * @returns {string} Hexadecimal session token.
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateSessionToken,
};

