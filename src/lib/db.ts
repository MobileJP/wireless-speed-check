import { Pool } from "pg";

declare global {
  var __pgPool: Pool | undefined;
  var __schemaReady: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See README.md for setup.");
  }
  return new Pool({ connectionString });
}

// Reused across hot-reloads in dev and across requests in prod -- avoids
// opening a fresh pool (and fresh Neon connections) on every API call.
export const pool = globalThis.__pgPool ?? createPool();
globalThis.__pgPool = pool;

async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      ssid TEXT,
      signal_percent INTEGER NOT NULL,
      rssi_dbm INTEGER,
      band TEXT,
      channel INTEGER,
      radio_type TEXT,
      receive_rate_mbps INTEGER,
      transmit_rate_mbps INTEGER,
      notes TEXT NOT NULL DEFAULT '',
      taken_at TIMESTAMPTZ NOT NULL
    );
  `);
}

/** Idempotent; safe to call on every request. Only runs once per process. */
export function ensureSchema(): Promise<void> {
  if (!globalThis.__schemaReady) {
    globalThis.__schemaReady = initSchema();
  }
  return globalThis.__schemaReady;
}
