CREATE TABLE IF NOT EXISTS `retro_action_item_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`action_item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`action_item_id`) REFERENCES `retro_action_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_action_item_comments_action_item_id` ON `retro_action_item_comments` (`action_item_id`);
