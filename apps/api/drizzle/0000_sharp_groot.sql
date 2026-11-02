CREATE TABLE `reservations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unit_id` text NOT NULL,
	`requester` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`cancelled_at` text,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reservations_interval_check" CHECK("reservations"."starts_at" < "reservations"."ends_at"),
	CONSTRAINT "reservations_status_check" CHECK("reservations"."status" in ('active', 'cancelled')),
	CONSTRAINT "reservations_requester_check" CHECK(trim("reservations"."requester") <> '')
);
--> statement-breakpoint
CREATE INDEX `reservations_unit_status_start_idx` ON `reservations` (`unit_id`,`status`,`starts_at`);--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
