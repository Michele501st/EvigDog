/**
 * @file db.js
 * @description Database layer for EvigDog Studio. Connects to MongoDB using the official driver
 * (matching the UNICAM AWMC Docker Catalog lab) and automatically seeds initial collections.
 * Includes a transparent fallback to a local JSON file when MongoDB is unreachable so the app
 * can also run standalone without Docker.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const seedData = require('../data/seedData');

const LOCAL_STORE_PATH = path.resolve(__dirname, '..', '..', 'data-store.json');

let mongoClient = null;
let mongoDb = null;
let storageMode = 'uninitialized'; // 'mongodb' | 'local-fallback'
let memoryStore = null;
let isTestMode = false;

/**
 * Loads or initializes the local JSON fallback store from disk.
 * @returns {object} Deep copy of the store state.
 */
function loadLocalStore() {
  if (memoryStore) {
    return memoryStore;
  }
  try {
    if (!isTestMode && fs.existsSync(LOCAL_STORE_PATH)) {
      const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf8');
      memoryStore = JSON.parse(raw);
      return memoryStore;
    }
  } catch (err) {
    console.warn('Warning: could not read local store, initializing from seed data.', err.message);
  }
  memoryStore = JSON.parse(JSON.stringify(seedData));
  saveLocalStore();
  return memoryStore;
}

/**
 * Persists the in-memory store to disk when running in local-fallback mode.
 */
function saveLocalStore() {
  if (!memoryStore || isTestMode) return;
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.warn('Warning: unable to persist local store to disk:', err.message);
  }
}

/**
 * Initializes the database connection. Attempts to connect to MongoDB if MONGODB_URI is provided;
 * falls back gracefully to the local JSON store if MongoDB is unavailable.
 * @returns {Promise<{ mode: string, dbName: string }>} Active storage mode and database name.
 */
async function initDatabase() {
  if (storageMode !== 'uninitialized') {
    return {
      mode: storageMode,
      dbName: process.env.MONGODB_DB || 'evigdog_db',
    };
  }

  const mongoUri = process.env.MONGODB_URI;
  const mongoDbName = process.env.MONGODB_DB || 'evigdog_db';
  const mongoUsername = process.env.MONGODB_USERNAME;
  const mongoPassword = process.env.MONGODB_PASSWORD;

  if (mongoUri && process.env.FORCE_LOCAL_STORE !== 'true') {
    try {
      const clientOptions = {
        ignoreUndefined: true,
        serverSelectionTimeoutMS: 3000,
      };

      if (mongoUsername && mongoPassword) {
        clientOptions.auth = {
          username: mongoUsername,
          password: mongoPassword,
        };
      }

      mongoClient = new MongoClient(mongoUri, clientOptions);
      await mongoClient.connect();
      mongoDb = mongoClient.db(mongoDbName);
      storageMode = 'mongodb';

      await seedMongoIfNeeded(mongoDb);
      console.log(`[DB] Connected to MongoDB (${mongoDbName})`);
      return { mode: storageMode, dbName: mongoDbName };
    } catch (err) {
      console.warn(
        `[DB] MongoDB unavailable (${err.message}). Activating resilient local-fallback store.`
      );
      if (mongoClient) {
        try {
          await mongoClient.close();
        } catch (_e) {
          // ignore close error
        }
        mongoClient = null;
        mongoDb = null;
      }
    }
  }

  storageMode = 'local-fallback';
  loadLocalStore();
  console.log('[DB] Initialized in local-fallback mode');
  return { mode: storageMode, dbName: 'local-json-store' };
}

/**
 * Seeds MongoDB collections with initial Figma content if they are currently empty.
 * @param {import('mongodb').Db} db - Connected MongoDB database instance.
 */
async function seedMongoIfNeeded(db) {
  const collectionsToSeed = ['projects', 'services', 'team', 'faqs', 'contacts', 'newsletter'];
  for (const name of collectionsToSeed) {
    const col = db.collection(name);
    const count = await col.countDocuments();
    if (count === 0 && Array.isArray(seedData[name]) && seedData[name].length > 0) {
      await col.insertMany(seedData[name].map((item) => ({ ...item })));
    }
  }

  const settingsCol = db.collection('settings');
  const existingSettings = await settingsCol.findOne({ key: 'site_settings' });
  if (!existingSettings) {
    await settingsCol.insertOne({
      key: 'site_settings',
      ...seedData.settings,
    });
  }
}

/**
 * Retrieves all documents from a logical collection.
 * @param {string} collectionName - Name of the collection (projects, services, team, faqs, contacts, newsletter).
 * @param {object} [filter={}] - Optional key/value filter.
 * @returns {Promise<Array<object>>} Matching documents without internal MongoDB _id field.
 */
async function getItems(collectionName, filter = {}) {
  await initDatabase();

  if (storageMode === 'mongodb' && mongoDb) {
    const items = await mongoDb
      .collection(collectionName)
      .find(filter, { projection: { _id: 0 } })
      .toArray();
    return items;
  }

  const store = loadLocalStore();
  const list = store[collectionName] || [];
  return list.filter((item) =>
    Object.entries(filter).every(([k, v]) => v === undefined || item[k] === v)
  );
}

/**
 * Inserts a new document into the specified collection.
 * @param {string} collectionName - Target collection name.
 * @param {object} payload - Document data to insert.
 * @returns {Promise<object>} The inserted document.
 */
async function insertItem(collectionName, payload) {
  await initDatabase();
  const doc = { ...payload };

  if (storageMode === 'mongodb' && mongoDb) {
    await mongoDb.collection(collectionName).insertOne({ ...doc });
    return doc;
  }

  const store = loadLocalStore();
  if (!Array.isArray(store[collectionName])) {
    store[collectionName] = [];
  }
  store[collectionName].unshift(doc);
  saveLocalStore();
  return doc;
}

/**
 * Updates fields on a document identified by its `id` property.
 * @param {string} collectionName - Target collection name.
 * @param {string} id - Document identifier.
 * @param {object} updates - Partial fields to update.
 * @returns {Promise<object|null>} Updated document, or null if not found.
 */
async function updateItemById(collectionName, id, updates) {
  await initDatabase();

  if (storageMode === 'mongodb' && mongoDb) {
    const result = await mongoDb
      .collection(collectionName)
      .findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: 'after', projection: { _id: 0 } }
      );
    return result || null;
  }

  const store = loadLocalStore();
  const list = store[collectionName] || [];
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...updates };
  saveLocalStore();
  return list[idx];
}

/**
 * Deletes a document identified by its `id` property.
 * @param {string} collectionName - Target collection name.
 * @param {string} id - Document identifier.
 * @returns {Promise<boolean>} True if a document was removed, false otherwise.
 */
async function deleteItemById(collectionName, id) {
  await initDatabase();

  if (storageMode === 'mongodb' && mongoDb) {
    const res = await mongoDb.collection(collectionName).deleteOne({ id });
    return res.deletedCount > 0;
  }

  const store = loadLocalStore();
  const list = store[collectionName] || [];
  const initialLen = list.length;
  store[collectionName] = list.filter((item) => item.id !== id);
  const removed = store[collectionName].length < initialLen;
  if (removed) saveLocalStore();
  return removed;
}

/**
 * Reads the global site settings (such as maintenanceMode).
 * @returns {Promise<{ maintenanceMode: boolean, updatedAt: string }>} Site settings.
 */
async function getSiteSettings() {
  await initDatabase();

  if (storageMode === 'mongodb' && mongoDb) {
    const doc = await mongoDb
      .collection('settings')
      .findOne({ key: 'site_settings' }, { projection: { _id: 0, key: 0 } });
    return doc || { maintenanceMode: false, updatedAt: new Date().toISOString() };
  }

  const store = loadLocalStore();
  return store.settings || { maintenanceMode: false, updatedAt: new Date().toISOString() };
}

/**
 * Updates the global site settings (such as toggling maintenanceMode).
 * @param {object} newSettings - Settings properties to merge.
 * @returns {Promise<{ maintenanceMode: boolean, updatedAt: string }>} Updated site settings.
 */
async function updateSiteSettings(newSettings) {
  await initDatabase();
  const updated = {
    maintenanceMode: Boolean(newSettings.maintenanceMode),
    updatedAt: new Date().toISOString(),
  };

  if (storageMode === 'mongodb' && mongoDb) {
    await mongoDb
      .collection('settings')
      .updateOne({ key: 'site_settings' }, { $set: updated }, { upsert: true });
    return updated;
  }

  const store = loadLocalStore();
  store.settings = updated;
  saveLocalStore();
  return updated;
}

/**
 * Returns diagnostic metadata about the current database connection for health checks.
 * @returns {{ mode: string, connected: boolean }}
 */
function getDbDiagnostics() {
  return {
    mode: storageMode,
    connected: storageMode === 'mongodb' || storageMode === 'local-fallback',
  };
}

/**
 * Resets the in-memory store to initial seed data (used in automated unit tests).
 */
function resetStoreForTests() {
  isTestMode = true;
  storageMode = 'local-fallback';
  memoryStore = JSON.parse(JSON.stringify(seedData));
}

/**
 * Gracefully closes the MongoDB connection on process termination.
 */
async function closeDatabase() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
    storageMode = 'uninitialized';
  }
}

module.exports = {
  initDatabase,
  getItems,
  insertItem,
  updateItemById,
  deleteItemById,
  getSiteSettings,
  updateSiteSettings,
  getDbDiagnostics,
  resetStoreForTests,
  closeDatabase,
};
