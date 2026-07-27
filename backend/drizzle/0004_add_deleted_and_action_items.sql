ALTER TABLE `retro_rooms` ADD COLUMN `deleted` text DEFAULT 'false' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `retro_action_items` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`room_id` text NOT NULL,
	`text` text NOT NULL,
	`assignee_id` text,
	`done` text DEFAULT 'false' NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`card_id`) REFERENCES `retro_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `retro_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE set null
);
