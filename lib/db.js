// Lapisan basis data NutriSmart — memakai SQLite bawaan Node.js (node:sqlite),
// sehingga tidak perlu instalasi server database terpisah.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_FILE = process.env.DB_PATH || path.join(DATA_DIR, 'nutrismart.db');
export const db = new DatabaseSync(DB_FILE);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    family_name   TEXT NOT NULL DEFAULT 'Keluarga Saya',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS members (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'Lainnya',
    gender      TEXT NOT NULL CHECK (gender IN ('L','P')),
    birth_date  TEXT NOT NULL,
    weight      REAL,
    height      REAL,
    color       TEXT NOT NULL DEFAULT '#0f9d63',
    target_kcal INTEGER,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS foods (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL = data bawaan
    name          TEXT NOT NULL,
    category      TEXT NOT NULL,
    kcal          REAL NOT NULL,
    protein       REAL NOT NULL DEFAULT 0,
    fat           REAL NOT NULL DEFAULT 0,
    carbs         REAL NOT NULL DEFAULT 0,
    fiber         REAL NOT NULL DEFAULT 0,
    portion_name  TEXT NOT NULL DEFAULT 'porsi',
    portion_grams REAL NOT NULL DEFAULT 100,
    recommended   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS meal_plans (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    food_id    INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    date       TEXT NOT NULL,
    meal_type  TEXT NOT NULL CHECK (meal_type IN ('sarapan','siang','malam','camilan')),
    grams      REAL NOT NULL CHECK (grams > 0),
    status     TEXT NOT NULL DEFAULT 'rencana' CHECK (status IN ('rencana','dimakan')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_plans_user_date ON meal_plans(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_members_user    ON members(user_id);
  CREATE INDEX IF NOT EXISTS idx_foods_user      ON foods(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user   ON sessions(user_id);
`);

/** Menjalankan fungsi di dalam transaksi; otomatis rollback jika terjadi error. */
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
