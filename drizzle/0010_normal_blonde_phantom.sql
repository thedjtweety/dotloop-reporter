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
CREATE INDEX `forecast_results_snapshot_idx` ON `forecast_results` (`snapshotId`);--> statement-breakpoint
CREATE INDEX `forecast_results_tenant_idx` ON `forecast_results` (`tenantId`);--> statement-breakpoint
CREATE INDEX `forecast_results_timeframe_idx` ON `forecast_results` (`timeframe`);--> statement-breakpoint
CREATE INDEX `forecast_results_tenant_date_idx` ON `forecast_results` (`tenantId`,`resultDate`);--> statement-breakpoint
CREATE INDEX `forecast_results_date_idx` ON `forecast_results` (`resultDate`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_tenant_idx` ON `forecast_snapshots` (`tenantId`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_upload_idx` ON `forecast_snapshots` (`uploadId`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_timeframe_idx` ON `forecast_snapshots` (`timeframe`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_tenant_date_idx` ON `forecast_snapshots` (`tenantId`,`snapshotDate`);--> statement-breakpoint
CREATE INDEX `forecast_snapshots_date_idx` ON `forecast_snapshots` (`snapshotDate`);