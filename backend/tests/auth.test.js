/**
 * @file auth.test.js
 * @description Unit and Integration tests for Authentication & RBAC (SuperAdmin / Admin).
 * Validates initial seed, login, session tokens, profile updates (username & password),
 * role-based access control permissions, and user lifecycle management.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { resetStoreForTests, closeDatabase } = require('../src/config/db');
const { resetSessionsForTests } = require('../src/services/authService');

let server;
let baseUrl;

describe('Authentication & RBAC Suite', () => {
  before(async () => {
    process.env.FORCE_LOCAL_STORE = 'true';
    process.env.INITIAL_ADMIN_USERNAME = 'admin';
    process.env.INITIAL_ADMIN_PASSWORD = 'evigdog2026';
    resetStoreForTests();
    resetSessionsForTests();

    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    resetStoreForTests();
    resetSessionsForTests();
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();
  });

  it('Initial SuperAdmin can log in with default credentials and receive bearer token (happy path)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'evigdog2026',
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token, 'Should return a bearer session token');
    assert.equal(data.user.username, 'admin');
    assert.equal(data.user.role, 'superadmin');

    // Verify session using GET /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.user.username, 'admin');
    assert.equal(meData.user.role, 'superadmin');
  });

  it('Login rejects invalid username or wrong password (edge cases)', async () => {
    // Wrong password
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'wrong-password-123',
      }),
    });
    assert.equal(wrongPassRes.status, 401);

    // Non-existent user
    const nonExistentRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'nonexistent_user',
        password: 'somepassword',
      }),
    });
    assert.equal(nonExistentRes.status, 401);
  });

  it('Authenticated user can update their username and password via /api/auth/profile', async () => {
    // 1. Initial login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'evigdog2026',
      }),
    });
    const { token } = await loginRes.json();

    // 2. Update username and password
    const updateRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        newUsername: 'super_michele',
        currentPassword: 'evigdog2026',
        newPassword: 'newsecurepass2026',
      }),
    });

    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.equal(updateData.user.username, 'super_michele');

    // 3. Verify old password fails
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'super_michele',
        password: 'evigdog2026',
      }),
    });
    assert.equal(oldLoginRes.status, 401);

    // 4. Verify new password and username succeed
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'super_michele',
        password: 'newsecurepass2026',
      }),
    });
    assert.equal(newLoginRes.status, 200);
  });

  it('Enforces RBAC: SuperAdmin can provision users, while regular Admin is forbidden (403)', async () => {
    // 1. SuperAdmin logs in
    const saLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'evigdog2026',
      }),
    });
    const { token: saToken } = await saLogin.json();

    // 2. SuperAdmin creates a standard Admin user
    const createRes = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${saToken}`,
      },
      body: JSON.stringify({
        username: 'staff_admin',
        password: 'staffpassword2026',
        role: 'admin',
      }),
    });
    assert.equal(createRes.status, 201);
    const createdUser = (await createRes.json()).user;
    assert.equal(createdUser.username, 'staff_admin');
    assert.equal(createdUser.role, 'admin');

    // 3. Newly created Admin logs in
    const staffLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'staff_admin',
        password: 'staffpassword2026',
      }),
    });
    assert.equal(staffLogin.status, 200);
    const { token: staffToken } = await staffLogin.json();

    // 4. Staff Admin attempts to access SuperAdmin-only endpoint /api/admin/users -> MUST FAIL with 403
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(forbiddenRes.status, 403);

    // 5. SuperAdmin lists users -> MUST SUCCEED
    const listRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${saToken}` },
    });
    assert.equal(listRes.status, 200);
    const { users } = await listRes.json();
    assert.equal(users.length, 2);

    // 6. SuperAdmin deletes the staff admin
    const deleteRes = await fetch(`${baseUrl}/api/admin/users/${createdUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${saToken}` },
    });
    assert.equal(deleteRes.status, 200);

    // 7. Verify staff admin can no longer use their previous session
    const revokedCheck = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.equal(revokedCheck.status, 401);
  });

  it('SuperAdmin is prevented from deleting their own account (edge case)', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'evigdog2026',
      }),
    });
    const { token, user } = await loginRes.json();

    const deleteSelfRes = await fetch(`${baseUrl}/api/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(deleteSelfRes.status, 400);
    const errBody = await deleteSelfRes.json();
    assert.ok(errBody.error.includes('stesso'));
  });

  it('Logout terminates the active session token (happy path)', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'evigdog2026',
      }),
    });
    const { token } = await loginRes.json();

    // Verify session is active
    const check1 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(check1.status, 200);

    // Logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(logoutRes.status, 200);

    // Verify session is destroyed
    const check2 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(check2.status, 401);
  });
});

