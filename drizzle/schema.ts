import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * ============================================
 * 用户相关表
 * ============================================
 */

/**
 * users - 用户表
 * 存储用户基本信息和认证数据
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
 * conversations - 对话会话表
 * 存储AI助手的对话会话信息
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * conversationMessages - 对话消息表
 * 存储对话中的具体消息内容
 */
export const conversationMessages = mysqlTable("conversationMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = typeof conversationMessages.$inferInsert;

/**
 * ============================================
 * 学习内容表
 * ============================================
 */

/**
 * vocabulary - 词汇表
 * 存储日语词汇的完整信息,包括汉字、假名、罗马音、释义等
 */
export const vocabulary = mysqlTable("vocabulary", {
  id: int("id").autoincrement().primaryKey(),
  expression: varchar("expression", { length: 255 }).notNull(),
  reading: varchar("reading", { length: 255 }).notNull(),
  romaji: varchar("romaji", { length: 255 }),
  meaning: text("meaning").notNull(),
  partOfSpeech: varchar("partOfSpeech", { length: 100 }),
  jlptLevel: mysqlEnum("jlptLevel", ["N5", "N4", "N3", "N2", "N1"]).notNull(),
  difficulty: int("difficulty").default(1),
  tags: json("tags").$type<string[]>(),
  category: varchar("category", { length: 50 }).default("standard"),
  source: varchar("source", { length: 255 }),
  detailedExplanation: text("detailedExplanation"),
  collocations: json("collocations").$type<string[]>(), // 常用搭配
  synonyms: json("synonyms").$type<string[]>(), // 同义词
  antonyms: json("antonyms").$type<string[]>(), // 反义词
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vocabulary = typeof vocabulary.$inferSelect;
export type InsertVocabulary = typeof vocabulary.$inferInsert;

/**
 * grammar - 语法表
 * 存储日语语法点信息,包括句型、解释、用法等
 */
export const grammar = mysqlTable("grammar", {
  id: int("id").autoincrement().primaryKey(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  meaning: text("meaning").notNull(),
  usage: text("usage"),
  jlptLevel: mysqlEnum("jlptLevel", ["N5", "N4", "N3", "N2", "N1"]).notNull(),
  difficulty: int("difficulty").default(1),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Grammar = typeof grammar.$inferSelect;
export type InsertGrammar = typeof grammar.$inferInsert;

/**
 * sentences - 例句表
 * 存储日语例句和对应的中文翻译,支持标注来源
 */
export const sentences = mysqlTable("sentences", {
  id: int("id").autoincrement().primaryKey(),
  japanese: text("japanese").notNull(),
  reading: text("reading"),
  romaji: text("romaji"),
  chinese: text("chinese").notNull(),
  source: varchar("source", { length: 255 }),
  sourceType: mysqlEnum("sourceType", ["web", "ai", "textbook", "anime", "drama", "other"]).default("other"),
  difficulty: int("difficulty").default(1),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sentence = typeof sentences.$inferSelect;
export type InsertSentence = typeof sentences.$inferInsert;

/**
 * scenes - 学习场景表
 * 存储场景化学习内容,如餐厅、购物、交通等
 */
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner"),
  orderIndex: int("orderIndex").default(0),
  content: json("content").$type<{
    vocabularyIds?: number[];
    grammarIds?: number[];
    dialogues?: Array<{ speaker: string; text: string; translation: string }>;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

/**
 * ============================================
 * 学习进度与复习表
 * ============================================
 */

/**
 * learning_progress - 学习进度表
 * 记录用户对每个学习项的掌握情况
 */
export const learningProgress = mysqlTable("learning_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["vocabulary", "grammar", "scene"]).notNull(),
  itemId: int("itemId").notNull(),
  masteryLevel: mysqlEnum("masteryLevel", ["learning", "familiar", "mastered"]).default("learning").notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  lastReviewedAt: timestamp("lastReviewedAt"),
  nextReviewAt: timestamp("nextReviewAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;

/**
 * review_schedule - 复习计划表
 * 基于艾宾浩斯遗忘曲线的复习计划
 */
export const reviewSchedule = mysqlTable("review_schedule", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["vocabulary", "grammar", "scene"]).notNull(),
  itemId: int("itemId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReviewSchedule = typeof reviewSchedule.$inferSelect;
export type InsertReviewSchedule = typeof reviewSchedule.$inferInsert;

/**
 * ============================================
 * 关联表
 * ============================================
 */

/**
 * vocabulary_sentences - 词汇例句关联表
 * 多对多关系:一个词汇可以有多个例句,一个例句可以包含多个词汇
 */
export const vocabularySentences = mysqlTable("vocabulary_sentences", {
  id: int("id").autoincrement().primaryKey(),
  vocabularyId: int("vocabularyId").notNull(),
  sentenceId: int("sentenceId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VocabularySentence = typeof vocabularySentences.$inferSelect;
export type InsertVocabularySentence = typeof vocabularySentences.$inferInsert;

/**
 * grammar_sentences - 语法例句关联表
 * 多对多关系:一个语法点可以有多个例句,一个例句可以包含多个语法点
 */
export const grammarSentences = mysqlTable("grammar_sentences", {
  id: int("id").autoincrement().primaryKey(),
  grammarId: int("grammarId").notNull(),
  sentenceId: int("sentenceId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GrammarSentence = typeof grammarSentences.$inferSelect;
export type InsertGrammarSentence = typeof grammarSentences.$inferInsert;

/**
 * ============================================
 * AI助手与资源管理表 (新增)
 * ============================================
 */

/**
 * learning_resources - 学习资源库表
 * 存储可靠的日语学习资源,供AI助手参考
 */
export const learningResources = mysqlTable("learning_resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  type: mysqlEnum("type", ["website", "api", "dataset", "dictionary"]).notNull(),
  category: mysqlEnum("category", ["vocabulary", "grammar", "listening", "reading", "comprehensive"]).notNull(),
  description: text("description"),
  reliability: int("reliability").default(5).notNull(), // 1-10评分
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  metadata: json("metadata").$type<{
    apiKey?: string;
    crawlRules?: any;
    updateFrequency?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearningResource = typeof learningResources.$inferSelect;
export type InsertLearningResource = typeof learningResources.$inferInsert;

/**
 * learning_curriculum - 学习大纲表
 * 存储完整的学习路径和各个阶段的目标
 */
export const learningCurriculum = mysqlTable("learning_curriculum", {
  id: int("id").autoincrement().primaryKey(),
  level: mysqlEnum("level", ["N5", "N4", "N3", "N2", "N1"]).notNull(),
  stage: int("stage").notNull(), // 阶段序号
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  objectives: json("objectives").$type<string[]>(), // 学习目标列表
  requiredVocabularyCount: int("requiredVocabularyCount").default(0),
  requiredGrammarCount: int("requiredGrammarCount").default(0),
  estimatedHours: int("estimatedHours").default(0),
  prerequisites: json("prerequisites").$type<number[]>(), // 前置阶段ID列表
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningCurriculum = typeof learningCurriculum.$inferSelect;
export type InsertLearningCurriculum = typeof learningCurriculum.$inferInsert;

/**
 * ai_generated_content - AI生成内容表
 * 记录AI生成的学习内容,避免重复生成
 */
export const aiGeneratedContent = mysqlTable("ai_generated_content", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentType: mysqlEnum("contentType", ["vocabulary", "grammar", "exercise", "explanation", "dialogue"]).notNull(),
  prompt: text("prompt").notNull(), // 生成时使用的提示词
  generatedContent: json("generatedContent").notNull(), // 生成的内容
  curriculumStageId: int("curriculumStageId"), // 关联的学习阶段
  isApproved: boolean("isApproved").default(false).notNull(), // 是否审核通过
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAiGeneratedContent = typeof aiGeneratedContent.$inferInsert;

/**
 * user_learning_path - 用户学习路径表
 * 记录用户的个性化学习路径和进度
 */
export const userLearningPath = mysqlTable("user_learning_path", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentCurriculumStageId: int("currentCurriculumStageId"), // 当前学习阶段
  completedStages: json("completedStages").$type<number[]>(), // 已完成阶段ID列表
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  totalStudyHours: decimal("totalStudyHours", { precision: 10, scale: 2 }).default("0.00").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserLearningPath = typeof userLearningPath.$inferSelect;
export type InsertUserLearningPath = typeof userLearningPath.$inferInsert;


/**
 * ============================================
 * 用户笔记表
 * ============================================
 */

/**
 * user_notes - 用户笔记表
 * 存储用户对词汇和语法点的个人笔记
 */
export const userNotes = mysqlTable("user_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["vocabulary", "grammar"]).notNull(),
  itemId: int("itemId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = typeof userNotes.$inferInsert;


/**
 * ============================================
 * 艾宾浩斯复习系统表
 * ============================================
 */

/**
 * study_records - 学习记录表
 * 存储用户的学习记录和复习计划,基于艾宾浩斯遗忘曲线
 * 复习间隔: 1天、2天、4天、7天、15天、30天
 */
export const studyRecords = mysqlTable("study_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: mysqlEnum("itemType", ["vocabulary", "grammar"]).notNull(),
  itemId: int("itemId").notNull(),
  
  // 学习状态
  reviewCount: int("reviewCount").default(0).notNull(), // 已复习次数 (0-6)
  easeFactor: decimal("easeFactor", { precision: 3, scale: 2 }).default("2.50").notNull(), // 难度系数
  
  // 时间记录
  firstLearnedAt: timestamp("firstLearnedAt").defaultNow().notNull(), // 首次学习时间
  lastReviewedAt: timestamp("lastReviewedAt").defaultNow().notNull(), // 上次复习时间
  nextReviewAt: timestamp("nextReviewAt").notNull(), // 下次复习时间
  
  // 复习结果统计
  correctCount: int("correctCount").default(0).notNull(), // 记住次数
  incorrectCount: int("incorrectCount").default(0).notNull(), // 忘记次数
  
  // 是否已掌握 (完成所有复习阶段)
  isMastered: boolean("isMastered").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudyRecord = typeof studyRecords.$inferSelect;
export type InsertStudyRecord = typeof studyRecords.$inferInsert;

/**
 * daily_study_stats - 每日学习统计表
 * 记录用户每日的学习和复习统计数据
 */
export const dailyStudyStats = mysqlTable("daily_study_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD 格式
  
  // 学习统计
  newItemsLearned: int("newItemsLearned").default(0).notNull(), // 新学习的项目数
  itemsReviewed: int("itemsReviewed").default(0).notNull(), // 复习的项目数
  correctReviews: int("correctReviews").default(0).notNull(), // 正确复习数
  incorrectReviews: int("incorrectReviews").default(0).notNull(), // 错误复习数
  
  // 学习时长 (分钟)
  studyMinutes: int("studyMinutes").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyStudyStats = typeof dailyStudyStats.$inferSelect;
export type InsertDailyStudyStats = typeof dailyStudyStats.$inferInsert;
