CREATE INDEX `adminId_idx` ON `audit_logs` (`adminId`);--> statement-breakpoint
CREATE INDEX `tenant_createdAt_idx` ON `audit_logs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `adminId_createdAt_idx` ON `audit_logs` (`adminId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `targetType_targetId_idx` ON `audit_logs` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `tenant_provider_idx` ON `oauth_tokens` (`tenantId`,`provider`);--> statement-breakpoint
CREATE INDEX `tenant_user_provider_idx` ON `oauth_tokens` (`tenantId`,`userId`,`provider`);--> statement-breakpoint
CREATE INDEX `admin_time_idx` ON `platform_admin_logs` (`adminUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_time_idx` ON `platform_admin_logs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `uploadId_user_idx` ON `transactions` (`uploadId`,`userId`);--> statement-breakpoint
CREATE INDEX `user_createdAt_idx` ON `transactions` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tenant_createdAt_idx` ON `transactions` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `user_uploadedAt_idx` ON `uploads` (`userId`,`uploadedAt`);--> statement-breakpoint
CREATE INDEX `tenant_uploadedAt_idx` ON `uploads` (`tenantId`,`uploadedAt`);