import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { randomUUID } from 'node:crypto';

export const userProfiles = sqliteTable('user_profiles', {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    authUserId: text('auth_user_id').notNull().unique(),
    telegramId: text('telegram_id'),
    googleId: text('google_id'),
    email: text('email'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    username: text('username'),
    photoUrl: text('photo_url'),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});
