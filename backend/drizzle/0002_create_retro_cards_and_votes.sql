CREATE TABLE `retro_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`column_id` text NOT NULL,
	`text` text NOT NULL,
	`author_id` text NOT NULL,
	`cluster_id` text,
	`is_anonymous` text DEFAULT 'false' NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`room_id`) REFERENCES `retro_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `retro_votes` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`card_id`) REFERENCES `retro_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
