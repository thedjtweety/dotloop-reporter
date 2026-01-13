-- Add back useSliding and tiers columns to commission_plans table
ALTER TABLE `commission_plans` ADD COLUMN `useSliding` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `commission_plans` ADD COLUMN `tiers` text;
