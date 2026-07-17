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

export const retroRooms = sqliteTable('retro_rooms', {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    name: text('name').notNull(),
    template: text('template').notNull(), // 'went-well' | 'mad-sad-glad' | 'start-stop-continue'
    stage: text('stage').notNull().$default(() => 'brainstorming'), // 'brainstorming' | 'grouping' | 'voting' | 'discussion'
    facilitatorId: text('facilitator_id').notNull().references(() => userProfiles.id),
    anonymousMode: text('anonymous_mode').notNull().$default(() => 'false'), // 'true' | 'false' stored as text in sqlite
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export const retroParticipants = sqliteTable('retro_participants', {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    roomId: text('room_id').notNull().references(() => retroRooms.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull().$default(() => 'participant'), // 'facilitator' | 'participant'
    joinedAt: text('joined_at').$defaultFn(() => new Date().toISOString()),
});

