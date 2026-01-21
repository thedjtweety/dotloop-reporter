ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'dotloop';--> statement-breakpoint
ALTER TABLE `users` ADD `dotloopUserId` varchar(64);--> statement-breakpoint
CREATE INDEX `dotloopUserId_unique` ON `users` (`dotloopUserId`);