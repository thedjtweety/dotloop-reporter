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
CREATE INDEX `upload_snapshots_tenant_idx` ON `upload_snapshots` (`tenantId`);--> statement-breakpoint
CREATE INDEX `upload_snapshots_upload_idx` ON `upload_snapshots` (`uploadId`);--> statement-breakpoint
CREATE INDEX `upload_snapshots_tenant_uploadedAt_idx` ON `upload_snapshots` (`tenantId`,`uploadedAt`);--> statement-breakpoint
CREATE INDEX `upload_snapshots_createdAt_idx` ON `upload_snapshots` (`createdAt`);