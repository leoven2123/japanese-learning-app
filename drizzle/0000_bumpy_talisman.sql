CREATE TABLE `examples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`japanese` text NOT NULL,
	`reading` text,
	`chinese` text NOT NULL,
	`romaji` text,
	`source` varchar(200),
	`sourceType` enum('anime','drama','song','literature','daily','other') DEFAULT 'daily',
	`vocabularyId` int,
	`grammarId` int,
	`sceneId` int,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `examples_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exerciseAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`userAnswer` text NOT NULL,
	`isCorrect` boolean NOT NULL,
	`attemptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exerciseAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sceneId` int NOT NULL,
	`type` enum('fillBlank','sentenceTransform','dialogue','multipleChoice') NOT NULL,
	`question` text NOT NULL,
	`options` text,
	`correctAnswer` text NOT NULL,
	`explanation` text,
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grammar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grammarPoint` text NOT NULL,
	`meaning` text NOT NULL,
	`structure` text,
	`jlptLevel` enum('N5','N4','N3','N2','N1') NOT NULL,
	`category` varchar(100),
	`formalityLevel` enum('formal','casual','both') DEFAULT 'both',
	`usageNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grammar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learningRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('vocabulary','grammar','scene') NOT NULL,
	`itemId` int NOT NULL,
	`masteryLevel` enum('learning','familiar','mastered') DEFAULT 'learning',
	`reviewCount` int DEFAULT 0,
	`lastReviewedAt` timestamp,
	`nextReviewAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sceneGrammar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sceneId` int NOT NULL,
	`grammarId` int NOT NULL,
	`importance` enum('core','supplementary') DEFAULT 'core',
	CONSTRAINT `sceneGrammar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sceneVocabulary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sceneId` int NOT NULL,
	`vocabularyId` int NOT NULL,
	`importance` enum('core','supplementary') DEFAULT 'core',
	CONSTRAINT `sceneVocabulary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` varchar(100),
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`order` int DEFAULT 0,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studySessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`duration` int DEFAULT 0,
	`itemsLearned` int DEFAULT 0,
	`itemsReviewed` int DEFAULT 0,
	`exercisesCompleted` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studySessions_id` PRIMARY KEY(`id`)
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
	`expression` varchar(200) NOT NULL,
	`reading` varchar(200) NOT NULL,
	`romaji` varchar(200),
	`meaning` text NOT NULL,
	`partOfSpeech` varchar(50),
	`jlptLevel` enum('N5','N4','N3','N2','N1') NOT NULL,
	`formalityLevel` enum('formal','casual','slang') DEFAULT 'casual',
	`frequency` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vocabulary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `vocabulary_idx` ON `examples` (`vocabularyId`);--> statement-breakpoint
CREATE INDEX `grammar_idx` ON `examples` (`grammarId`);--> statement-breakpoint
CREATE INDEX `scene_idx` ON `examples` (`sceneId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `exerciseAttempts` (`userId`);--> statement-breakpoint
CREATE INDEX `exercise_idx` ON `exerciseAttempts` (`exerciseId`);--> statement-breakpoint
CREATE INDEX `scene_idx` ON `exercises` (`sceneId`);--> statement-breakpoint
CREATE INDEX `jlptLevel_idx` ON `grammar` (`jlptLevel`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `learningRecords` (`userId`);--> statement-breakpoint
CREATE INDEX `item_idx` ON `learningRecords` (`itemType`,`itemId`);--> statement-breakpoint
CREATE INDEX `nextReview_idx` ON `learningRecords` (`nextReviewAt`);--> statement-breakpoint
CREATE INDEX `scene_idx` ON `sceneGrammar` (`sceneId`);--> statement-breakpoint
CREATE INDEX `grammar_idx` ON `sceneGrammar` (`grammarId`);--> statement-breakpoint
CREATE INDEX `scene_idx` ON `sceneVocabulary` (`sceneId`);--> statement-breakpoint
CREATE INDEX `vocabulary_idx` ON `sceneVocabulary` (`vocabularyId`);--> statement-breakpoint
CREATE INDEX `user_date_idx` ON `studySessions` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `jlptLevel_idx` ON `vocabulary` (`jlptLevel`);--> statement-breakpoint
CREATE INDEX `expression_idx` ON `vocabulary` (`expression`);