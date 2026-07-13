CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text NOT NULL,
	`telegram_id` text,
	`google_id` text,
	`email` text,
	`first_name` text NOT NULL,
	`last_name` text,
	`username` text,
	`photo_url` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_auth_user_id_unique` ON `user_profiles` (`auth_user_id`);