CREATE TABLE `retro_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`template` text NOT NULL,
	`stage` text DEFAULT 'brainstorming' NOT NULL,
	`facilitator_id` text NOT NULL,
	`anonymous_mode` text DEFAULT 'false' NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`facilitator_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `retro_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'participant' NOT NULL,
	`joined_at` text,
	FOREIGN KEY (`room_id`) REFERENCES `retro_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
