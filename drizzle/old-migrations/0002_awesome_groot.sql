ALTER TABLE `uploads` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `uploads` ADD `validationTimeMs` int;--> statement-breakpoint
ALTER TABLE `uploads` ADD `parsingTimeMs` int;--> statement-breakpoint
ALTER TABLE `uploads` ADD `uploadTimeMs` int;--> statement-breakpoint
ALTER TABLE `uploads` ADD `totalTimeMs` int;--> statement-breakpoint
ALTER TABLE `uploads` ADD `status` enum('success','failed','partial') DEFAULT 'success' NOT NULL;--> statement-breakpoint
ALTER TABLE `uploads` ADD `errorMessage` text;