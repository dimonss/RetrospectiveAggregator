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

    try {
        sqlite.exec(`
            CREATE TABLE IF NOT EXISTS retro_action_items (
                id TEXT PRIMARY KEY NOT NULL,
                card_id TEXT NOT NULL REFERENCES retro_cards(id) ON DELETE CASCADE,
                room_id TEXT NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                assignee_id TEXT REFERENCES user_profiles(id) ON DELETE SET NULL,
                done TEXT NOT NULL DEFAULT 'false',
                created_at TEXT,
                updated_at TEXT
            )
        `);
    } catch {
        // Table already exists
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
