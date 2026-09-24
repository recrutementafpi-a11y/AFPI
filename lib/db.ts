import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "afpi.db");

declare global {
  var __afpiDb: Database.Database | undefined;
}

const db = global.__afpiDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") global.__afpiDb = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS groupes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'formateur', 'stagiaire')),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    groupe_id INTEGER REFERENCES groupes(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions_formation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    groupe_id INTEGER NOT NULL REFERENCES groupes(id),
    formateur_id INTEGER REFERENCES users(id),
    titre TEXT NOT NULL,
    lieu TEXT,
    debut TEXT NOT NULL,
    fin TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS emargements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions_formation(id),
    stagiaire_id INTEGER NOT NULL REFERENCES users(id),
    signature TEXT NOT NULL,
    signed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(session_id, stagiaire_id)
  );
`);

export default db;
