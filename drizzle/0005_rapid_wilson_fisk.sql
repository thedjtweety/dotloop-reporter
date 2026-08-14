CREATE TABLE `migration_audit_events` (
	`id` varchar(64) NOT NULL,
	`runId` varchar(64) NOT NULL,
	`manifestItemId` varchar(64),
	`action` enum('run_created','manifest_imported','row_validated','row_updated','exception_created','exception_resolved','row_reconciled','run_completed','run_archived','audit_exported') NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `migration_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `migration_exceptions` (
	`id` varchar(64) NOT NULL,
	`runId` varchar(64) NOT NULL,
	`manifestItemId` varchar(64),
	`category` enum('missing_source_reference','missing_required_metadata','duplicate_transaction','missing_destination_loop','file_count_mismatch','invalid_manifest_row','manual_review') NOT NULL,
	`severity` enum('warning','blocking') NOT NULL DEFAULT 'blocking',
	`status` enum('open','resolved','waived') NOT NULL DEFAULT 'open',
	`details` text NOT NULL,
	`resolutionNote` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `migration_exceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `migration_manifest_items` (
	`id` varchar(64) NOT NULL,
	`runId` varchar(64) NOT NULL,
	`sourceTransactionId` varchar(255),
	`transactionName` varchar(500) NOT NULL,
	`propertyAddress` text,
	`primaryAgent` varchar(255),
	`closingDate` varchar(10),
	`sourceFolderReference` text,
	`expectedFileCount` int NOT NULL DEFAULT 0,
	`reconciledFileCount` int NOT NULL DEFAULT 0,
	`destinationLoopId` varchar(255),
	`destinationLoopName` varchar(500),
	`status` enum('pending','ready','in_progress','reconciled','exception','excluded') NOT NULL DEFAULT 'pending',
	`validationJson` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `migration_manifest_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `migration_runs` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sourceSystem` enum('skyslope') NOT NULL DEFAULT 'skyslope',
	`storageProvider` enum('google_drive','dropbox','local','other') NOT NULL DEFAULT 'local',
	`storageReference` text,
	`status` enum('planning','staging','manifest_ready','reconciling','completed','archived') NOT NULL DEFAULT 'planning',
	`recordsExpected` int NOT NULL DEFAULT 0,
	`recordsImported` int NOT NULL DEFAULT 0,
	`recordsReconciled` int NOT NULL DEFAULT 0,
	`openExceptionCount` int NOT NULL DEFAULT 0,
	`manifestChecksum` varchar(64),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `migration_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `migration_audit_events_run_created_idx` ON `migration_audit_events` (`runId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `migration_audit_events_item_idx` ON `migration_audit_events` (`manifestItemId`);--> statement-breakpoint
CREATE INDEX `migration_exceptions_run_status_idx` ON `migration_exceptions` (`runId`,`status`);--> statement-breakpoint
CREATE INDEX `migration_exceptions_item_idx` ON `migration_exceptions` (`manifestItemId`);--> statement-breakpoint
CREATE INDEX `migration_exceptions_category_idx` ON `migration_exceptions` (`category`);--> statement-breakpoint
CREATE INDEX `migration_manifest_items_run_status_idx` ON `migration_manifest_items` (`runId`,`status`);--> statement-breakpoint
CREATE INDEX `migration_manifest_items_run_source_idx` ON `migration_manifest_items` (`runId`,`sourceTransactionId`);--> statement-breakpoint
CREATE INDEX `migration_manifest_items_destination_loop_idx` ON `migration_manifest_items` (`destinationLoopId`);--> statement-breakpoint
CREATE INDEX `migration_runs_tenant_status_idx` ON `migration_runs` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `migration_runs_tenant_created_idx` ON `migration_runs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `migration_runs_tenant_checksum_idx` ON `migration_runs` (`tenantId`,`manifestChecksum`);