CREATE TABLE `forecast_results` (
	`id` varchar(64) NOT NULL,
	`snapshotId` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`timeframe` int NOT NULL,
	`resultDate` timestamp NOT NULL,
	`actualDeals` int NOT NULL,
	`actualRevenue` int NOT NULL,
	`actualCommission` int NOT NULL,
	`dealsVariance` int,
	`revenueVariance` int,
	`commissionVariance` int,
	`dealsAccuracy` int,
	`revenueAccuracy` int,
	`commissionAccuracy` int,
	`hitRate` int,
	`mape` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `forecast_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forecast_snapshots` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`uploadId` int,
	`timeframe` int NOT NULL,
	`snapshotDate` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`projectedDeals` int NOT NULL,
	`projectedRevenue` int NOT NULL,
	`projectedCommission` int NOT NULL,
	`avgProbability` int NOT NULL,
	`confidenceLevel` int NOT NULL,
	`pipelineCount` int NOT NULL,
	`forecastedDealsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `forecast_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `upload_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`uploadId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`uploadedAt` timestamp NOT NULL,
	`totalTransactions` int NOT NULL,
	`totalSalesVolume` int NOT NULL,
	`averagePrice` int NOT NULL,
	`totalCommission` int NOT NULL,
	`closingRate` int NOT NULL,
	`avgDaysToClose` int NOT NULL,
	`activeListings` int NOT NULL,
	`underContract` int NOT NULL,
	`closedDeals` int NOT NULL,
	`archivedDeals` int NOT NULL,
	`totalCompanyDollar` int NOT NULL,
	`buySideCommission` int NOT NULL,
	`sellSideCommission` int NOT NULL,
	`metricsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
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
CREATE INDEX `forecast_results_snapshot_idx` ON `forecast_results` (`snapshotId`);--> statement-breakpoint
CREATE INDEX `forecast_results_tenant_idx` ON `forecast_results` (`tenantId`);--> statement-breakpoint
CREATE INDEX `forecast_results_timeframe_idx` ON `forecast_results` (`timeframe`);--> statement-breakpoint
CREATE INDEX `forecast_results_tenant_date_idx` ON `forecast_results` (`tenantId`,`resultDate`);--> statement-breakpoint
CREATE INDEX `forecast_results_date_idx` ON `forecast_results` (`resultDate`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_tenant_idx` ON `forecast_snapshots` (`tenantId`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_upload_idx` ON `forecast_snapshots` (`uploadId`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_timeframe_idx` ON `forecast_snapshots` (`timeframe`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_tenant_date_idx` ON `forecast_snapshots` (`tenantId`,`snapshotDate`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_date_idx` ON `forecast_snapshots` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `upload_idx` ON `upload_activity_log` (`uploadId`);--> statement-breakpoint
CREATE INDEX `user_team_idx` ON `upload_activity_log` (`userTeamId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `upload_activity_log` (`userId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `upload_activity_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `upload_idx` ON `upload_sharing` (`uploadId`);--> statement-breakpoint
CREATE INDEX `user_team_idx` ON `upload_sharing` (`userTeamId`);--> statement-breakpoint
CREATE INDEX `upload_user_team_unique` ON `upload_sharing` (`uploadId`,`userTeamId`);--> statement-breakpoint
CREATE INDEX `shared_at_idx` ON `upload_sharing` (`sharedAt`);--> statement-breakpoint
CREATE INDEX `upload_snapshots_tenant_idx` ON `upload_snapshots` (`tenantId`);--> statement-breakpoint
CREATE INDEX `upload_snapshots_upload_idx` ON `upload_snapshots` (`uploadId`);--> statement-breakpoint
CREATE INDEX `upload_snapshots_tenant_uploadedAt_idx` ON `upload_snapshots` (`tenantId`,`uploadedAt`);--> statement-breakpoint
CREATE INDEX `upload_snapshots_createdAt_idx` ON `upload_snapshots` (`createdAt`);--> statement-breakpoint
CREATE INDEX `user_team_idx` ON `user_team_members` (`userTeamId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `user_team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `user_team_user_unique` ON `user_team_members` (`userTeamId`,`userId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `user_teams` (`tenantId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `user_teams` (`ownerId`);--> statement-breakpoint
CREATE INDEX `tenant_owner_idx` ON `user_teams` (`tenantId`,`ownerId`);