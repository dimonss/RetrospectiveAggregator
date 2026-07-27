import 'dotenv/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const dbPath = process.env.DATABASE_PATH || './data/retro_aggregator.db';
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

console.log('Checking database state...');

// Ensure migration tracking table exists with standard Drizzle structure
sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at numeric
    );
`);

if (existsSync('./drizzle/meta/_journal.json')) {
    const journal = JSON.parse(readFileSync('./drizzle/meta/_journal.json', 'utf-8'));

    // 1. Check if retro_cards table exists and has position column
    const cardTables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='retro_cards'").all();
    if (cardTables.length > 0) {
        const cardCols = sqlite.prepare("PRAGMA table_info('retro_cards')").all() as Array<{ name: string }>;
        if (cardCols.some((col) => col.name === 'position')) {
            const entry3 = journal.entries[3];
            if (entry3) {
                const existing = sqlite.prepare('SELECT 1 FROM "__drizzle_migrations" WHERE created_at = ?').get(entry3.when);
                if (!existing) {
                    const sqlContent = readFileSync(`./drizzle/${entry3.tag}.sql`, 'utf-8');
                    const h = createHash('sha256').update(sqlContent).digest('hex');
                    sqlite.prepare('INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)').run(h, entry3.when);
                    console.log('Marked migration 0003 (position column) as already applied.');
                }
            }
        }
    }

    // 2. Check if retro_rooms table exists and has deleted column
    const roomTables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='retro_rooms'").all();
    if (roomTables.length > 0) {
        const roomCols = sqlite.prepare("PRAGMA table_info('retro_rooms')").all() as Array<{ name: string }>;
        if (roomCols.some((col) => col.name === 'deleted')) {
            const entry4 = journal.entries[4];
            if (entry4) {
                const existing = sqlite.prepare('SELECT 1 FROM "__drizzle_migrations" WHERE created_at = ?').get(entry4.when);
                if (!existing) {
                    const sqlContent = readFileSync(`./drizzle/${entry4.tag}.sql`, 'utf-8');
                    const h = createHash('sha256').update(sqlContent).digest('hex');
                    sqlite.prepare('INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)').run(h, entry4.when);
                    console.log('Marked migration 0004 (deleted column) as already applied.');
                }
            }
        }
    }

    // Mark previous migrations (0000, 0001, 0002) as applied if newer ones are present
    const maxRecord = sqlite.prepare('SELECT MAX(created_at) as max_when FROM "__drizzle_migrations"').get() as { max_when: number | null };
    if (maxRecord && maxRecord.max_when) {
        for (let i = 0; i < journal.entries.length; i++) {
            const entry = journal.entries[i];
            if (entry.when <= maxRecord.max_when) {
                const existing = sqlite.prepare('SELECT 1 FROM "__drizzle_migrations" WHERE created_at = ?').get(entry.when);
                if (!existing) {
                    const sqlContent = readFileSync(`./drizzle/${entry.tag}.sql`, 'utf-8');
                    const h = createHash('sha256').update(sqlContent).digest('hex');
                    sqlite.prepare('INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)').run(h, entry.when);
                }
            }
        }
    }
}

console.log('Running migrations...');
migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations applied successfully!');

sqlite.close();
