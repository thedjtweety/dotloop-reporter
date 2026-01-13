CREATE TABLE `tier_history` (
	`id` varchar(64) NOT NULL,
	`tenantId` int NOT NULL,
	`agentName` varchar(255) NOT NULL,
	`planId` varchar(64) NOT NULL,
	`previousTierIndex` int,
	`previousTierThreshold` int,
	`previousSplitPercentage` int,
	`newTierIndex` int NOT NULL,
	`newTierThreshold` int NOT NULL,
	`newSplitPercentage` int NOT NULL,
	`ytdAmount` int NOT NULL,
	`transactionId` varchar(64),
	`transactionDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tier_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tier_history_tenant_idx` ON `tier_history` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tier_history_agent_idx` ON `tier_history` (`agentName`);--> statement-breakpoint
CREATE INDEX `tier_history_plan_idx` ON `tier_history` (`planId`);--> statement-breakpoint
CREATE INDEX `tier_history_date_idx` ON `tier_history` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tier_history_tenant_agent_plan_idx` ON `tier_history` (`tenantId`,`agentName`,`planId`);