CREATE TABLE `agent_share_datasets` (
	`id` varchar(64) NOT NULL,
	`ownerSecretHash` varchar(64) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`recordCount` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_share_datasets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_share_links` (
	`id` varchar(64) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`datasetId` varchar(64) NOT NULL,
	`agentName` varchar(255) NOT NULL,
	`expiresAt` timestamp,
	`isRevoked` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastAccessedAt` timestamp,
	CONSTRAINT `agent_share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_share_links_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `agent_share_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`datasetId` varchar(64) NOT NULL,
	`sourceKey` varchar(255) NOT NULL,
	`agents` text,
	`recordJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_share_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `agent_share_datasets_owner_hash_idx` ON `agent_share_datasets` (`ownerSecretHash`);--> statement-breakpoint
CREATE INDEX `agent_share_datasets_active_idx` ON `agent_share_datasets` (`isActive`);--> statement-breakpoint
CREATE INDEX `agent_share_links_dataset_agent_idx` ON `agent_share_links` (`datasetId`,`agentName`);--> statement-breakpoint
CREATE INDEX `agent_share_links_dataset_idx` ON `agent_share_links` (`datasetId`);--> statement-breakpoint
CREATE INDEX `agent_share_records_dataset_idx` ON `agent_share_records` (`datasetId`);--> statement-breakpoint
CREATE INDEX `agent_share_records_dataset_source_idx` ON `agent_share_records` (`datasetId`,`sourceKey`);