CREATE TABLE `knowledge_expansions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`content` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_expansions_id` PRIMARY KEY(`id`),
	CONSTRAINT `knowledge_expansions_unitId_unique` UNIQUE(`unitId`)
);
