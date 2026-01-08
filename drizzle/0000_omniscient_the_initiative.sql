CREATE TABLE `ai_generated_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentType` enum('vocabulary','grammar','exercise','explanation','dialogue') NOT NULL,
	`prompt` text NOT NULL,
	`generatedContent` json NOT NULL,
	`curriculumStageId` int,
	`isApproved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_generated_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grammar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pattern` varchar(255) NOT NULL,
	`meaning` text NOT NULL,
	`usage` text,
	`jlptLevel` enum('N5','N4','N3','N2','N1') NOT NULL,
	`difficulty` int DEFAULT 1,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grammar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grammar_sentences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grammarId` int NOT NULL,
	`sentenceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grammar_sentences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_curriculum` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` enum('N5','N4','N3','N2','N1') NOT NULL,
	`stage` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`objectives` json,
	`requiredVocabularyCount` int DEFAULT 0,
	`requiredGrammarCount` int DEFAULT 0,
	`estimatedHours` int DEFAULT 0,
	`prerequisites` json,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_curriculum_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('vocabulary','grammar','scene') NOT NULL,
	`itemId` int NOT NULL,
	`masteryLevel` enum('learning','familiar','mastered') NOT NULL DEFAULT 'learning',
	`reviewCount` int NOT NULL DEFAULT 0,
	`lastReviewedAt` timestamp,
	`nextReviewAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` varchar(500) NOT NULL,
	`type` enum('website','api','dataset','dictionary') NOT NULL,
	`category` enum('vocabulary','grammar','listening','reading','comprehensive') NOT NULL,
	`description` text,
	`reliability` int NOT NULL DEFAULT 5,
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('vocabulary','grammar','scene') NOT NULL,
	`itemId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`orderIndex` int DEFAULT 0,
	`content` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`japanese` text NOT NULL,
	`reading` text,
	`romaji` text,
	`chinese` text NOT NULL,
	`source` varchar(255),
	`difficulty` int DEFAULT 1,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_learning_path` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentCurriculumStageId` int,
	`completedStages` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`totalStudyHours` decimal(10,2) NOT NULL DEFAULT '0.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_learning_path_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_learning_path_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expression` varchar(255) NOT NULL,
	`reading` varchar(255) NOT NULL,
	`romaji` varchar(255),
	`meaning` text NOT NULL,
	`partOfSpeech` varchar(100),
	`jlptLevel` enum('N5','N4','N3','N2','N1') NOT NULL,
	`difficulty` int DEFAULT 1,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vocabulary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vocabulary_sentences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vocabularyId` int NOT NULL,
	`sentenceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vocabulary_sentences_id` PRIMARY KEY(`id`)
);
