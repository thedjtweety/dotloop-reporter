CREATE TABLE `agent_share_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkId` varchar(64) NOT NULL,
	`action` enum('created','copied','accessed','revoked','dataset_revoked') NOT NULL,
	`recipientEmail` varchar(320),
	`reportingPeriodLabel` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_share_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commission_calculation_snapshots` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`importRunId` varchar(64),
	`planVersionId` varchar(64),
	`agentName` varchar(255) NOT NULL,
	`reportingPeriodLabel` varchar(255) NOT NULL,
	`transactionCount` int NOT NULL,
	`grossCommission` decimal(15,2) NOT NULL,
	`netCommission` decimal(15,2) NOT NULL,
	`companyDollar` decimal(15,2) NOT NULL,
	`calculationData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commission_calculation_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commission_plan_versions` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`planId` varchar(64) NOT NULL,
	`versionNumber` int NOT NULL,
	`lifecycle` enum('draft','active','archived') NOT NULL DEFAULT 'active',
	`effectiveStartDate` varchar(10),
	`effectiveEndDate` varchar(10),
	`changeNote` text,
	`planSnapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commission_plan_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_mapping_templates` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`headers` text NOT NULL,
	`mappingJson` text NOT NULL,
	`useCount` int NOT NULL DEFAULT 0,
	`isDefault` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `import_mapping_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_runs` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`reportingPeriodLabel` varchar(255) NOT NULL,
	`periodStart` varchar(10),
	`periodEnd` varchar(10),
	`status` enum('draft','ready','active','archived') NOT NULL DEFAULT 'ready',
	`recordCount` int NOT NULL,
	`dataQuality` int NOT NULL,
	`fieldCompleteness` text,
	`warnings` text,
	`mappingTemplateId` varchar(64),
	`sourceChecksum` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `import_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agent_share_links` ADD `recipientEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `agent_share_links` ADD `reportingPeriodLabel` varchar(255);--> statement-breakpoint
CREATE INDEX `agent_share_access_logs_link_idx` ON `agent_share_access_logs` (`linkId`);--> statement-breakpoint
CREATE INDEX `agent_share_access_logs_created_idx` ON `agent_share_access_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `commission_calculation_snapshots_tenant_agent_idx` ON `commission_calculation_snapshots` (`tenantId`,`agentName`);--> statement-breakpoint
CREATE INDEX `commission_calculation_snapshots_import_idx` ON `commission_calculation_snapshots` (`importRunId`);--> statement-breakpoint
CREATE INDEX `commission_calculation_snapshots_plan_version_idx` ON `commission_calculation_snapshots` (`planVersionId`);--> statement-breakpoint
CREATE INDEX `commission_plan_versions_tenant_plan_idx` ON `commission_plan_versions` (`tenantId`,`planId`);--> statement-breakpoint
CREATE INDEX `commission_plan_versions_effective_idx` ON `commission_plan_versions` (`tenantId`,`effectiveStartDate`);--> statement-breakpoint
CREATE INDEX `import_mapping_templates_tenant_idx` ON `import_mapping_templates` (`tenantId`);--> statement-breakpoint
CREATE INDEX `import_mapping_templates_tenant_default_idx` ON `import_mapping_templates` (`tenantId`,`isDefault`);--> statement-breakpoint
CREATE INDEX `import_runs_tenant_created_idx` ON `import_runs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `import_runs_tenant_status_idx` ON `import_runs` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `import_runs_checksum_idx` ON `import_runs` (`tenantId`,`sourceChecksum`);--> statement-breakpoint
CREATE INDEX `agent_share_links_recipient_idx` ON `agent_share_links` (`recipientEmail`);