import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vocabulary table - stores Japanese words with readings and meanings
 */
export const vocabulary = mysqlTable("vocabulary", {
  id: int("id").autoincrement().primaryKey(),
  expression: varchar("expression", { length: 200 }).notNull(), // Japanese word (kanji/kana)
  reading: varchar("reading", { length: 200 }).notNull(), // Hiragana/katakana reading
  romaji: varchar("romaji", { length: 200 }), // Romaji reading
  meaning: text("meaning").notNull(), // Chinese translation
  partOfSpeech: varchar("partOfSpeech", { length: 50 }), // 词性: 名词、动词、形容词等
  jlptLevel: mysqlEnum("jlptLevel", ["N5", "N4", "N3", "N2", "N1"]).notNull(),
  formalityLevel: mysqlEnum("formalityLevel", ["formal", "casual", "slang"]).default("casual"),
  frequency: int("frequency").default(0), // Usage frequency
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jlptLevelIdx: index("jlptLevel_idx").on(table.jlptLevel),
  expressionIdx: index("expression_idx").on(table.expression),
}));

export type Vocabulary = typeof vocabulary.$inferSelect;
export type InsertVocabulary = typeof vocabulary.$inferInsert;

/**
 * Grammar points table - stores Japanese grammar patterns
 */
export const grammar = mysqlTable("grammar", {
  id: int("id").autoincrement().primaryKey(),
  grammarPoint: text("grammarPoint").notNull(), // Grammar pattern in Japanese
  meaning: text("meaning").notNull(), // Chinese explanation
  structure: text("structure"), // Grammar structure/formula
  jlptLevel: mysqlEnum("jlptLevel", ["N5", "N4", "N3", "N2", "N1"]).notNull(),
  category: varchar("category", { length: 100 }), // Category: particles, verb forms, etc.
  formalityLevel: mysqlEnum("formalityLevel", ["formal", "casual", "both"]).default("both"),
  usageNotes: text("usageNotes"), // Detailed usage notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jlptLevelIdx: index("jlptLevel_idx").on(table.jlptLevel),
}));

export type Grammar = typeof grammar.$inferSelect;
export type InsertGrammar = typeof grammar.$inferInsert;

/**
 * Example sentences table - stores example sentences for vocabulary and grammar
 */
export const examples = mysqlTable("examples", {
  id: int("id").autoincrement().primaryKey(),
  japanese: text("japanese").notNull(), // Japanese sentence
  reading: text("reading"), // Furigana/reading
  chinese: text("chinese").notNull(), // Chinese translation
  romaji: text("romaji"), // Romaji
  source: varchar("source", { length: 200 }), // Source: anime, drama, song, etc.
  sourceType: mysqlEnum("sourceType", ["anime", "drama", "song", "literature", "daily", "other"]).default("daily"),
  vocabularyId: int("vocabularyId"), // Related vocabulary ID
  grammarId: int("grammarId"), // Related grammar ID
  sceneId: int("sceneId"), // Related scene ID
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  vocabIdx: index("vocabulary_idx").on(table.vocabularyId),
  grammarIdx: index("grammar_idx").on(table.grammarId),
  sceneIdx: index("scene_idx").on(table.sceneId),
}));

export type Example = typeof examples.$inferSelect;
export type InsertExample = typeof examples.$inferInsert;

/**
 * Learning scenes table - stores different learning scenarios
 */
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(), // Scene title
  description: text("description"), // Scene description
  category: varchar("category", { length: 100 }), // Category: shopping, restaurant, etc.
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner"),
  order: int("order").default(0), // Display order
  imageUrl: text("imageUrl"), // Scene illustration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

/**
 * Scene vocabulary mapping - links vocabulary to scenes
 */
export const sceneVocabulary = mysqlTable("sceneVocabulary", {
  id: int("id").autoincrement().primaryKey(),
  sceneId: int("sceneId").notNull(),
  vocabularyId: int("vocabularyId").notNull(),
  importance: mysqlEnum("importance", ["core", "supplementary"]).default("core"),
}, (table) => ({
  sceneIdx: index("scene_idx").on(table.sceneId),
  vocabIdx: index("vocabulary_idx").on(table.vocabularyId),
}));

/**
 * Scene grammar mapping - links grammar to scenes
 */
export const sceneGrammar = mysqlTable("sceneGrammar", {
  id: int("id").autoincrement().primaryKey(),
  sceneId: int("sceneId").notNull(),
  grammarId: int("grammarId").notNull(),
  importance: mysqlEnum("importance", ["core", "supplementary"]).default("core"),
}, (table) => ({
  sceneIdx: index("scene_idx").on(table.sceneId),
  grammarIdx: index("grammar_idx").on(table.grammarId),
}));

/**
 * Practice exercises table - stores exercises for scenes
 */
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  sceneId: int("sceneId").notNull(),
  type: mysqlEnum("type", ["fillBlank", "sentenceTransform", "dialogue", "multipleChoice"]).notNull(),
  question: text("question").notNull(), // Exercise question
  options: text("options"), // JSON array of options for multiple choice
  correctAnswer: text("correctAnswer").notNull(), // Correct answer
  explanation: text("explanation"), // Answer explanation
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  sceneIdx: index("scene_idx").on(table.sceneId),
}));

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

/**
 * User learning records - tracks what users have learned
 */
export const learningRecords = mysqlTable("learningRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["vocabulary", "grammar", "scene"]).notNull(),
  itemId: int("itemId").notNull(), // ID of vocabulary, grammar, or scene
  masteryLevel: mysqlEnum("masteryLevel", ["learning", "familiar", "mastered"]).default("learning"),
  reviewCount: int("reviewCount").default(0), // Number of times reviewed
  lastReviewedAt: timestamp("lastReviewedAt"), // Last review time
  nextReviewAt: timestamp("nextReviewAt"), // Next scheduled review time
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  itemIdx: index("item_idx").on(table.itemType, table.itemId),
  nextReviewIdx: index("nextReview_idx").on(table.nextReviewAt),
}));

export type LearningRecord = typeof learningRecords.$inferSelect;
export type InsertLearningRecord = typeof learningRecords.$inferInsert;

/**
 * User study sessions - tracks daily study activity
 */
export const studySessions = mysqlTable("studySessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(), // Study date
  duration: int("duration").default(0), // Study duration in minutes
  itemsLearned: int("itemsLearned").default(0), // Number of items learned
  itemsReviewed: int("itemsReviewed").default(0), // Number of items reviewed
  exercisesCompleted: int("exercisesCompleted").default(0), // Number of exercises completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("user_date_idx").on(table.userId, table.date),
}));

export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;

/**
 * Exercise attempts - tracks user exercise attempts
 */
export const exerciseAttempts = mysqlTable("exerciseAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseId: int("exerciseId").notNull(),
  userAnswer: text("userAnswer").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  exerciseIdx: index("exercise_idx").on(table.exerciseId),
}));

export type ExerciseAttempt = typeof exerciseAttempts.$inferSelect;
export type InsertExerciseAttempt = typeof exerciseAttempts.$inferInsert;
