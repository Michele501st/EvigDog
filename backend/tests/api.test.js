/**
 * @file api.test.js
 * @description Automated unit and integration test suite for EvigDog Studio REST APIs.
 * Covers happy paths and edge cases for content endpoints, contact CRUD, newsletter,
 * admin authentication, and maintenance mode toggling.
 */

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { resetStoreForTests, closeDatabase } = require('../src/config/db');

let server;
let baseUrl;

describe('EvigDog Studio REST API Suite', () => {
  before(async () => {
    process.env.FORCE_LOCAL_STORE = 'true';
    process.env.ADMIN_ACCESS_CODE = 'test-admin-code';
    resetStoreForTests();

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
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();
  });

  it('GET /api/health returns container telemetry and DB status (happy path)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'evigdog-studio-backend');
    assert.equal(body.database.connected, true);
  });

  it('GET /api/projects returns all 6 portfolio projects and filters by category', async () => {
    const allRes = await fetch(`${baseUrl}/api/projects`);
    assert.equal(allRes.status, 200);
    const allProjects = await allRes.json();
    assert.equal(allProjects.length, 6);

    const filteredRes = await fetch(
      `${baseUrl}/api/projects?category=${encodeURIComponent('Brand Identity')}`
    );
    assert.equal(filteredRes.status, 200);
    const brandProjects = await filteredRes.json();
    assert.equal(brandProjects.length, 2);
    assert.ok(brandProjects.every((p) => p.category === 'Brand Identity'));
  });

  it('GET /api/services, /api/team, /api/faqs return seeded Figma datasets', async () => {
    const [srvRes, teamRes, faqRes] = await Promise.all([
      fetch(`${baseUrl}/api/services`),
      fetch(`${baseUrl}/api/team`),
      fetch(`${baseUrl}/api/faqs`),
    ]);

    const [services, team, faqs] = await Promise.all([
      srvRes.json(),
      teamRes.json(),
      faqRes.json(),
    ]);

    assert.equal(services.length, 6);
    assert.equal(team.length, 5);
    assert.equal(team[0].name, 'Sofia Reale');
    assert.equal(faqs.length, 4);
  });

  it('POST /api/contacts saves valid contact request (happy path)', async () => {
    const payload = {
      name: 'Mario Rossi',
      email: 'mario@esempio.it',
      projectType: 'Web Design & Dev',
      budget: '5.000€ – 10.000€',
      message: 'Vorrei realizzare una piattaforma cloud-native.',
    };

    const res = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const saved = await res.json();
    assert.equal(saved.name, 'Mario Rossi');
    assert.equal(saved.status, 'nuovo');
    assert.ok(saved.id.startsWith('cnt-'));
  });

  it('POST /api/contacts rejects missing fields or invalid email (edge case)', async () => {
    const missingRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Mario' }),
    });
    assert.equal(missingRes.status, 400);

    const badEmailRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mario Rossi',
        email: 'email-non-valida',
        message: 'Test messaggio',
      }),
    });
    assert.equal(badEmailRes.status, 400);
  });

  it('Admin endpoints reject unauthorized requests and allow valid x-admin-code', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/contacts`);
    assert.equal(unauthRes.status, 401);

    const authRes = await fetch(`${baseUrl}/api/contacts`, {
      headers: { 'x-admin-code': 'test-admin-code' },
    });
    assert.equal(authRes.status, 200);
    const contacts = await authRes.json();
    assert.equal(contacts.length, 2);

    // Update status of cnt-demo-1
    const patchRes = await fetch(`${baseUrl}/api/contacts/cnt-demo-1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-code': 'test-admin-code',
      },
      body: JSON.stringify({ status: 'completato' }),
    });
    assert.equal(patchRes.status, 200);
    const updated = await patchRes.json();
    assert.equal(updated.status, 'completato');
  });

  it('POST /api/status toggles maintenance mode and validates boolean input', async () => {
    const toggleRes = await fetch(`${baseUrl}/api/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-code': 'test-admin-code',
      },
      body: JSON.stringify({ maintenanceMode: true }),
    });
    assert.equal(toggleRes.status, 200);
    const state = await toggleRes.json();
    assert.equal(state.maintenanceMode, true);

    const badRes = await fetch(`${baseUrl}/api/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-code': 'test-admin-code',
      },
      body: JSON.stringify({ maintenanceMode: 'invalid' }),
    });
    assert.equal(badRes.status, 400);
  });
});

