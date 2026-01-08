CREATE TABLE `daily_study_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`newItemsLearned` int NOT NULL DEFAULT 0,
	`itemsReviewed` int NOT NULL DEFAULT 0,
	`correctReviews` int NOT NULL DEFAULT 0,
	`incorrectReviews` int NOT NULL DEFAULT 0,
	`studyMinutes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_study_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('vocabulary','grammar') NOT NULL,
	`itemId` int NOT NULL,
	`reviewCount` int NOT NULL DEFAULT 0,
	`easeFactor` decimal(3,2) NOT NULL DEFAULT '2.50',
	`firstLearnedAt` timestamp NOT NULL DEFAULT (now()),
	`lastReviewedAt` timestamp NOT NULL DEFAULT (now()),
	`nextReviewAt` timestamp NOT NULL,
	`correctCount` int NOT NULL DEFAULT 0,
	`incorrectCount` int NOT NULL DEFAULT 0,
	`isMastered` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `study_records_id` PRIMARY KEY(`id`)
);
