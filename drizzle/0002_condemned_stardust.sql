ALTER TABLE `sentences` ADD `sourceType` enum('web','ai','textbook','anime','drama','other') DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `vocabulary` ADD `category` varchar(50) DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `vocabulary` ADD `source` varchar(255);--> statement-breakpoint
ALTER TABLE `vocabulary` ADD `detailedExplanation` text;