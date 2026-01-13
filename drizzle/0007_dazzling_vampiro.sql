ALTER TABLE `agent_assignments` DROP INDEX `agent_assignments_tenant_agent_unique`;--> statement-breakpoint
ALTER TABLE `oauth_tokens` DROP INDEX `oauth_tokens_tokenHash_unique`;--> statement-breakpoint
ALTER TABLE `tenants` DROP INDEX `tenants_subdomain_unique`;--> statement-breakpoint
ALTER TABLE `tenants` DROP INDEX `tenants_customDomain_unique`;--> statement-breakpoint
ALTER TABLE `transactions` DROP INDEX `loopId_tenant_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `openId_tenant_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `email_tenant_unique`;--> statement-breakpoint
ALTER TABLE `agent_assignments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `audit_logs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `commission_calculations` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `commission_plans` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `oauth_tokens` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `platform_admin_logs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `teams` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tenants` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `token_audit_logs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `transactions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `uploads` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `agent_assignments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `audit_logs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `commission_calculations` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `commission_plans` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `oauth_tokens` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `platform_admin_logs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `teams` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `tenants` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `token_audit_logs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `uploads` MODIFY COLUMN `uploadedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `commission_plans` ADD `useSliding` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `commission_plans` ADD `tiers` text;--> statement-breakpoint
CREATE INDEX `agent_assignments_tenant_agent_unique` ON `agent_assignments` (`tenantId`,`agentName`);--> statement-breakpoint
CREATE INDEX `oauth_tokens_tokenHash_unique` ON `oauth_tokens` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `tenants_subdomain_unique` ON `tenants` (`subdomain`);--> statement-breakpoint
CREATE INDEX `tenants_customDomain_unique` ON `tenants` (`customDomain`);--> statement-breakpoint
CREATE INDEX `loopId_tenant_unique` ON `transactions` (`loopId`,`tenantId`);--> statement-breakpoint
CREATE INDEX `openId_tenant_unique` ON `users` (`openId`,`tenantId`);--> statement-breakpoint
CREATE INDEX `email_tenant_unique` ON `users` (`email`,`tenantId`);