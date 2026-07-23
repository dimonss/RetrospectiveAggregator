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

    // Ensure all tables exist for fresh database deployments
    try {
        sqlite.exec(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY NOT NULL,
                auth_user_id TEXT NOT NULL UNIQUE,
                telegram_id TEXT,
                google_id TEXT,
                email TEXT,
                first_name TEXT NOT NULL,
                last_name TEXT,
                username TEXT,
                photo_url TEXT,
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS retro_rooms (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                template TEXT NOT NULL,
                stage TEXT NOT NULL DEFAULT 'brainstorming',
                facilitator_id TEXT NOT NULL REFERENCES user_profiles(id),
                anonymous_mode TEXT NOT NULL DEFAULT 'false',
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS retro_participants (
                id TEXT PRIMARY KEY NOT NULL,
                room_id TEXT NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
                role TEXT NOT NULL DEFAULT 'participant',
                joined_at TEXT
            );

            CREATE TABLE IF NOT EXISTS retro_cards (
                id TEXT PRIMARY KEY NOT NULL,
                room_id TEXT NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
                column_id TEXT NOT NULL,
                text TEXT NOT NULL,
                author_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
                cluster_id TEXT,
                is_anonymous TEXT NOT NULL DEFAULT 'false',
                position INTEGER NOT NULL DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS retro_votes (
                id TEXT PRIMARY KEY NOT NULL,
                card_id TEXT NOT NULL REFERENCES retro_cards(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS retro_action_items (
                id TEXT PRIMARY KEY NOT NULL,
                card_id TEXT NOT NULL REFERENCES retro_cards(id) ON DELETE CASCADE,
                room_id TEXT NOT NULL REFERENCES retro_rooms(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                assignee_id TEXT REFERENCES user_profiles(id) ON DELETE SET NULL,
                done TEXT NOT NULL DEFAULT 'false',
                created_at TEXT,
                updated_at TEXT
            );
        `);
    } catch {
        // Tables already exist
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
