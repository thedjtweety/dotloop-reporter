CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`adminName` varchar(255) NOT NULL,
	`adminEmail` varchar(320),
	`action` enum('user_created','user_deleted','user_role_changed','upload_deleted','upload_viewed','settings_changed','data_exported') NOT NULL,
	`targetType` enum('user','upload','system'),
	`targetId` int,
	`targetName` varchar(255),
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
