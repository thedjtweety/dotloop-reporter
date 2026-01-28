ALTER TABLE `oauth_tokens` ADD `dotloopAccountId` int;--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `dotloopProfileId` int;--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `dotloopDefaultProfileId` int;--> statement-breakpoint
ALTER TABLE `oauth_tokens` ADD `dotloopProfileIds` text;