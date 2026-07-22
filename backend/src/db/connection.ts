import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

let db: ReturnType<typeof drizzle<typeof schema>>;

export function initDb(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');

    // Ensure position column exists on retro_cards for existing databases
    try {
        sqlite.exec('ALTER TABLE `retro_cards` ADD COLUMN `position` integer DEFAULT 0 NOT NULL');
    } catch {
        // Column already exists or table not created yet
    }

    db = drizzle(sqlite, { schema });
    return db;
}

export function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return db;
}
