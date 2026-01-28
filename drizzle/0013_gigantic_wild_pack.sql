CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tenantId` int NOT NULL,
	`activeOAuthTokenId` int,
	`defaultUploadView` varchar(50) DEFAULT 'dashboard',
	`theme` varchar(20) DEFAULT 'light',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `connectionName` varchar(255);--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `isActive` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `isPrimary` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `dotloopAccountEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `dotloopAccountName` varchar(255);--> statement-breakpoint
CREATE INDEX `user_preferences_user_unique` ON `user_preferences` (`userId`);--> statement-breakpoint
CREATE INDEX `user_preferences_tenant_idx` ON `user_preferences` (`tenantId`);--> statement-breakpoint
CREATE INDEX `oauth_tokens_primary_idx` ON `oauth_tokens` (`userId`,`isPrimary`);