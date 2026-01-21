CREATE TABLE `agent_assignments` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`agentName` varchar(255) NOT NULL,
	`planId` varchar(64) NOT NULL,
	`teamId` varchar(64),
	`anniversaryDate` varchar(5),
	`startDate` varchar(10),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_assignments_tenant_agent_unique` UNIQUE(`tenantId`,`agentName`)
);
--> statement-breakpoint
CREATE TABLE `commission_calculations` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`uploadId` int,
	`calculationDate` varchar(10) NOT NULL,
	`breakdowns` text NOT NULL,
	`ytdSummaries` text NOT NULL,
	`transactionCount` int NOT NULL,
	`agentCount` int NOT NULL,
	`totalCompanyDollar` int NOT NULL,
	`totalGrossCommission` int NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commission_calculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commission_plans` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`splitPercentage` int NOT NULL,
	`capAmount` int NOT NULL DEFAULT 0,
	`postCapSplit` int NOT NULL DEFAULT 100,
	`deductions` text,
	`royaltyPercentage` int,
	`royaltyCap` int,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commission_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`leadAgent` varchar(255) NOT NULL,
	`teamSplitPercentage` int NOT NULL,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_assignments_tenant_idx` ON `agent_assignments` (`tenantId`);--> statement-breakpoint
CREATE INDEX `agent_assignments_agent_idx` ON `agent_assignments` (`agentName`);--> statement-breakpoint
CREATE INDEX `agent_assignments_plan_idx` ON `agent_assignments` (`planId`);--> statement-breakpoint
CREATE INDEX `agent_assignments_team_idx` ON `agent_assignments` (`teamId`);--> statement-breakpoint
CREATE INDEX `agent_assignments_active_idx` ON `agent_assignments` (`isActive`);--> statement-breakpoint
CREATE INDEX `commission_calculations_tenant_idx` ON `commission_calculations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `commission_calculations_date_idx` ON `commission_calculations` (`calculationDate`);--> statement-breakpoint
CREATE INDEX `commission_calculations_upload_idx` ON `commission_calculations` (`uploadId`);--> statement-breakpoint
CREATE INDEX `commission_plans_tenant_idx` ON `commission_plans` (`tenantId`);--> statement-breakpoint
CREATE INDEX `commission_plans_active_idx` ON `commission_plans` (`isActive`);--> statement-breakpoint
CREATE INDEX `teams_tenant_idx` ON `teams` (`tenantId`);--> statement-breakpoint
CREATE INDEX `teams_active_idx` ON `teams` (`isActive`);