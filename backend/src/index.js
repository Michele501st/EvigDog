/**
 * @file index.js
 * @description Clean entry point for the EvigDog Studio Backend server.
 * Loads environment variables, initializes the database connection, and starts listening.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
require('dotenv').config();

const { createApp } = require('./app');
const { initDatabase, closeDatabase } = require('./config/db');

const PORT = Number(process.env.PORT) || 3000;

/**
 * Bootstraps the database and HTTP server.
 */
async function startServer() {
  try {
    const dbInfo = await initDatabase();
    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(
        `[EvigDog Studio] Server attivo su http://localhost:${PORT} (DB mode: ${dbInfo.mode})`
      );
    });

    const shutdown = async () => {
      console.log('\n[EvigDog Studio] Arresto del server in corso...');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[EvigDog Studio] Errore fatale all’avvio del server:', error);
    process.exit(1);
  }
}

startServer();

