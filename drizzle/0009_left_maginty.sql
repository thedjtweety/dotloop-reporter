CREATE TABLE `upload_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadId` int NOT NULL,
	`userTeamId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('shared','viewed','downloaded','deleted') NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `upload_sharing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uploadId` int NOT NULL,
	`userTeamId` int NOT NULL,
	`sharedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`sharedBy` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userTeamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','editor','viewer') NOT NULL DEFAULT 'viewer',
	`addedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`addedBy` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `upload_idx` ON `upload_activity_log` (`uploadId`);--> statement-breakpoint
CREATE INDEX `user_team_idx` ON `upload_activity_log` (`userTeamId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `upload_activity_log` (`userId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `upload_activity_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `upload_idx` ON `upload_sharing` (`uploadId`);--> statement-breakpoint
CREATE INDEX `user_team_idx` ON `upload_sharing` (`userTeamId`);--> statement-breakpoint
CREATE INDEX `upload_user_team_unique` ON `upload_sharing` (`uploadId`,`userTeamId`);--> statement-breakpoint
CREATE INDEX `shared_at_idx` ON `upload_sharing` (`sharedAt`);--> statement-breakpoint
CREATE INDEX `user_team_idx` ON `user_team_members` (`userTeamId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `user_team_user_unique` ON `user_team_members` (`userTeamId`,`userId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `user_teams` (`tenantId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `user_teams` (`ownerId`);--> statement-breakpoint
CREATE INDEX `tenant_owner_idx` ON `user_teams` (`tenantId`,`ownerId`);