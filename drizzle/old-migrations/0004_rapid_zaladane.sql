CREATE TABLE `oauth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(50) NOT NULL DEFAULT 'dotloop',
	`encryptedAccessToken` text NOT NULL,
	`encryptedRefreshToken` text NOT NULL,
	`tokenExpiresAt` timestamp NOT NULL,
	`encryptionKeyVersion` int NOT NULL DEFAULT 1,
	`tokenHash` varchar(64) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`deviceFingerprint` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastUsedAt` timestamp,
	`lastRefreshedAt` timestamp,
	CONSTRAINT `oauth_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth_tokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `platform_admin_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`tenantId` int,
	`action` varchar(100) NOT NULL,
	`reason` text,
	`details` text,
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `platform_admin_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(63) NOT NULL,
	`customDomain` varchar(255),
	`status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active',
	`subscriptionTier` enum('free','basic','professional','enterprise') NOT NULL DEFAULT 'free',
	`settings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`),
	CONSTRAINT `tenants_customDomain_unique` UNIQUE(`customDomain`)
);
--> statement-breakpoint
CREATE TABLE `token_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`tokenId` int,
	`action` enum('token_created','token_refreshed','token_used','token_revoked','token_decryption_failed','suspicious_access','rate_limit_exceeded','security_alert') NOT NULL,
	`status` enum('success','failure','warning') NOT NULL,
	`errorMessage` text,
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`requestId` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `token_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `dotloop_integrations`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `action` enum('user_created','user_deleted','user_role_changed','upload_deleted','upload_viewed','settings_changed','data_exported','tenant_settings_changed','oauth_connected','oauth_disconnected') NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `targetType` enum('user','upload','system','tenant');--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `uploads` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','inactive','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `loopId_tenant_unique` UNIQUE(`loopId`,`tenantId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `openId_tenant_unique` UNIQUE(`openId`,`tenantId`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `email_tenant_unique` UNIQUE(`email`,`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `oauth_tokens` (`tenantId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `oauth_tokens` (`userId`);--> statement-breakpoint
CREATE INDEX `tokenHash_idx` ON `oauth_tokens` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `expires_idx` ON `oauth_tokens` (`tokenExpiresAt`);--> statement-breakpoint
CREATE INDEX `admin_idx` ON `platform_admin_logs` (`adminUserId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `platform_admin_logs` (`tenantId`);--> statement-breakpoint
CREATE INDEX `time_idx` ON `platform_admin_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `subdomain_idx` ON `tenants` (`subdomain`);--> statement-breakpoint
CREATE INDEX `customDomain_idx` ON `tenants` (`customDomain`);--> statement-breakpoint
CREATE INDEX `tenant_time_idx` ON `token_audit_logs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `token_audit_logs` (`action`,`createdAt`);--> statement-breakpoint
CREATE INDEX `suspicious_idx` ON `token_audit_logs` (`tenantId`,`createdAt`,`action`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `audit_logs` (`tenantId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `transactions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `upload_idx` ON `transactions` (`uploadId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `uploads` (`tenantId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `uploads` (`userId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `users` (`tenantId`);