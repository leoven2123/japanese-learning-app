import { serial, pgEnum, pgTable, text, timestamp, varchar, boolean, json, integer, numeric } from "drizzle-orm/pg-core";

// PostgreSQL enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const conversationRoleEnum = pgEnum("conversation_role", ["user", "assistant"]);
export const itemTypeEnum = pgEnum("item_type", ["vocabulary", "grammar", "scene"]);
export const itemTypeVGEnum = pgEnum("item_type_vg", ["vocabulary", "grammar"]);
export const masteryLevelEnum = pgEnum("mastery_level", ["learning", "familiar", "mastered"]);
export const jlptLevelEnum = pgEnum("jlpt_level", ["N5", "N4", "N3", "N2", "N1"]);
export const sourceTypeEnum = pgEnum("source_type", ["web", "ai", "textbook", "anime", "drama", "other"]);
export const difficultyEnum = pgEnum("difficulty_level", ["beginner", "intermediate", "advanced"]);
export const resourceTypeEnum = pgEnum("resource_type", ["website", "api", "dataset", "dictionary"]);
export const resourceCategoryEnum = pgEnum("resource_category", ["vocabulary", "grammar", "listening", "reading", "comprehensive"]);
export const contentTypeEnum = pgEnum("content_type", ["vocabulary", "grammar", "exercise", "explanation", "dialogue"]);
export const unitTypeEnum = pgEnum("unit_type", ["scene", "expression", "media", "dialogue"]);
export const mediaTypeEnum = pgEnum("media_type", ["anime", "jpop", "movie", "drama", "novel", "manga"]);
export const unitSourceTypeEnum = pgEnum("unit_source_type", ["original", "anime", "jpop", "movie", "drama", "novel"]);
export const expressionSourceTypeEnum = pgEnum("expression_source_type", ["original", "anime", "jpop", "movie", "drama"]);
export const progressStatusEnum = pgEnum("progress_status", ["not_started", "in_progress", "completed", "mastered"]);

/**
 * ============================================
 * 用户相关表
 * ============================================
 */

/**
 * users - 用户表
 * 存储用户基本信息和认证数据
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: text("name"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * conversations - 对话会话表
 * 存储AI助手的对话会话信息
 */
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * conversationMessages - 对话消息表
 * 存储对话中的具体消息内容
 */
export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: conversationRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  expression: varchar("expression", { length: 255 }).notNull(),
  reading: varchar("reading", { length: 255 }).notNull(),
  romaji: varchar("romaji", { length: 255 }),
  meaning: text("meaning").notNull(),
  partOfSpeech: varchar("part_of_speech", { length: 100 }),
  jlptLevel: jlptLevelEnum("jlpt_level").notNull(),
  difficulty: integer("difficulty").default(1),
  tags: json("tags").$type<string[]>(),
  category: varchar("category", { length: 50 }).default("standard"),
  source: varchar("source", { length: 255 }),
  detailedExplanation: text("detailed_explanation"),
  collocations: json("collocations").$type<string[]>(),
  synonyms: json("synonyms").$type<string[]>(),
  antonyms: json("antonyms").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Vocabulary = typeof vocabulary.$inferSelect;
export type InsertVocabulary = typeof vocabulary.$inferInsert;

/**
 * grammar - 语法表
 * 存储日语语法点信息,包括句型、解释、用法等
 */
export const grammar = pgTable("grammar", {
  id: serial("id").primaryKey(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  meaning: text("meaning").notNull(),
  usage: text("usage"),
  jlptLevel: jlptLevelEnum("jlpt_level").notNull(),
  difficulty: integer("difficulty").default(1),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Grammar = typeof grammar.$inferSelect;
export type InsertGrammar = typeof grammar.$inferInsert;

/**
 * sentences - 例句表
 * 存储日语例句和对应的中文翻译,支持标注来源
 */
export const sentences = pgTable("sentences", {
  id: serial("id").primaryKey(),
  japanese: text("japanese").notNull(),
  reading: text("reading"),
  romaji: text("romaji"),
  chinese: text("chinese").notNull(),
  source: varchar("source", { length: 255 }),
  sourceType: sourceTypeEnum("source_type").default("other"),
  difficulty: integer("difficulty").default(1),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Sentence = typeof sentences.$inferSelect;
export type InsertSentence = typeof sentences.$inferInsert;

/**
 * scenes - 学习场景表
 * 存储场景化学习内容,如餐厅、购物、交通等
 */
export const scenes = pgTable("scenes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  difficulty: difficultyEnum("difficulty").default("beginner"),
  orderIndex: integer("order_index").default(0),
  content: json("content").$type<{
    vocabularyIds?: number[];
    grammarIds?: number[];
    dialogues?: Array<{ speaker: string; text: string; translation: string }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const learningProgress = pgTable("learning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  masteryLevel: masteryLevelEnum("mastery_level").default("learning").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;

/**
 * review_schedule - 复习计划表
 * 基于艾宾浩斯遗忘曲线的复习计划
 */
export const reviewSchedule = pgTable("review_schedule", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
export const vocabularySentences = pgTable("vocabulary_sentences", {
  id: serial("id").primaryKey(),
  vocabularyId: integer("vocabulary_id").notNull(),
  sentenceId: integer("sentence_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VocabularySentence = typeof vocabularySentences.$inferSelect;
export type InsertVocabularySentence = typeof vocabularySentences.$inferInsert;

/**
 * grammar_sentences - 语法例句关联表
 * 多对多关系:一个语法点可以有多个例句,一个例句可以包含多个语法点
 */
export const grammarSentences = pgTable("grammar_sentences", {
  id: serial("id").primaryKey(),
  grammarId: integer("grammar_id").notNull(),
  sentenceId: integer("sentence_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GrammarSentence = typeof grammarSentences.$inferSelect;
export type InsertGrammarSentence = typeof grammarSentences.$inferInsert;

/**
 * ============================================
 * AI助手与资源管理表
 * ============================================
 */

/**
 * learning_resources - 学习资源库表
 * 存储可靠的日语学习资源,供AI助手参考
 */
export const learningResources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  type: resourceTypeEnum("type").notNull(),
  category: resourceCategoryEnum("category").notNull(),
  description: text("description"),
  reliability: integer("reliability").default(5).notNull(),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: json("metadata").$type<{
    apiKey?: string;
    crawlRules?: any;
    updateFrequency?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LearningResource = typeof learningResources.$inferSelect;
export type InsertLearningResource = typeof learningResources.$inferInsert;

/**
 * learning_curriculum - 学习大纲表
 * 存储完整的学习路径和各个阶段的目标
 */
export const learningCurriculum = pgTable("learning_curriculum", {
  id: serial("id").primaryKey(),
  level: jlptLevelEnum("level").notNull(),
  stage: integer("stage").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  objectives: json("objectives").$type<string[]>(),
  requiredVocabularyCount: integer("required_vocabulary_count").default(0),
  requiredGrammarCount: integer("required_grammar_count").default(0),
  estimatedHours: integer("estimated_hours").default(0),
  prerequisites: json("prerequisites").$type<number[]>(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LearningCurriculum = typeof learningCurriculum.$inferSelect;
export type InsertLearningCurriculum = typeof learningCurriculum.$inferInsert;

/**
 * ai_generated_content - AI生成内容表
 * 记录AI生成的学习内容,避免重复生成
 */
export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  prompt: text("prompt").notNull(),
  generatedContent: json("generated_content").notNull(),
  curriculumStageId: integer("curriculum_stage_id"),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAiGeneratedContent = typeof aiGeneratedContent.$inferInsert;

/**
 * user_learning_path - 用户学习路径表
 * 记录用户的个性化学习路径和进度
 */
export const userLearningPath = pgTable("user_learning_path", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currentCurriculumStageId: integer("current_curriculum_stage_id"),
  completedStages: json("completed_stages").$type<number[]>(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  totalStudyHours: numeric("total_study_hours", { precision: 10, scale: 2 }).default("0.00").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: itemTypeVGEnum("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const studyRecords = pgTable("study_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: itemTypeVGEnum("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  easeFactor: numeric("ease_factor", { precision: 3, scale: 2 }).default("2.50").notNull(),
  firstLearnedAt: timestamp("first_learned_at").defaultNow().notNull(),
  lastReviewedAt: timestamp("last_reviewed_at").defaultNow().notNull(),
  nextReviewAt: timestamp("next_review_at").notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  incorrectCount: integer("incorrect_count").default(0).notNull(),
  isMastered: boolean("is_mastered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StudyRecord = typeof studyRecords.$inferSelect;
export type InsertStudyRecord = typeof studyRecords.$inferInsert;

/**
 * daily_study_stats - 每日学习统计表
 * 记录用户每日的学习和复习统计数据
 */
export const dailyStudyStats = pgTable("daily_study_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  newItemsLearned: integer("new_items_learned").default(0).notNull(),
  itemsReviewed: integer("items_reviewed").default(0).notNull(),
  correctReviews: integer("correct_reviews").default(0).notNull(),
  incorrectReviews: integer("incorrect_reviews").default(0).notNull(),
  studyMinutes: integer("study_minutes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DailyStudyStats = typeof dailyStudyStats.$inferSelect;
export type InsertDailyStudyStats = typeof dailyStudyStats.$inferInsert;

/**
 * ============================================
 * 沉浸式场景学习系统表
 * ============================================
 */

/**
 * learning_units - 学习单元表(原子化学习内容)
 * 每个学习单元是一个可组合的原子,包含场景、表达、媒体素材等
 */
export const learningUnits = pgTable("learning_units", {
  id: serial("id").primaryKey(),
  unitType: unitTypeEnum("unit_type").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subCategory: varchar("sub_category", { length: 100 }),
  titleJa: varchar("title_ja", { length: 255 }).notNull(),
  titleZh: varchar("title_zh", { length: 255 }),
  descriptionJa: text("description_ja"),
  difficulty: integer("difficulty").default(1).notNull(),
  jlptLevel: jlptLevelEnum("jlpt_level"),
  targetExpressions: json("target_expressions").$type<string[]>(),
  targetPatterns: json("target_patterns").$type<string[]>(),
  targetVocabularyIds: json("target_vocabulary_ids").$type<number[]>(),
  targetGrammarIds: json("target_grammar_ids").$type<number[]>(),
  prerequisites: json("prerequisites").$type<number[]>(),
  relatedUnits: json("related_units").$type<number[]>(),
  content: json("content").$type<{
    dialogues?: Array<{
      speaker: string;
      speakerRole?: string;
      text: string;
      reading?: string;
      notes?: string;
    }>;
    situationDescription?: string;
    culturalNotes?: string;
    keyPoints?: string[];
  }>(),
  sourceType: unitSourceTypeEnum("source_type"),
  sourceTitle: varchar("source_title", { length: 255 }),
  sourceYear: integer("source_year"),
  sourceEpisode: varchar("source_episode", { length: 100 }),
  sourceUrl: varchar("source_url", { length: 500 }),
  orderIndex: integer("order_index").default(0),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LearningUnit = typeof learningUnits.$inferSelect;
export type InsertLearningUnit = typeof learningUnits.$inferInsert;

/**
 * media_materials - 媒体素材库
 * 存储动漫、J-POP、电影等学习素材
 */
export const mediaMaterials = pgTable("media_materials", {
  id: serial("id").primaryKey(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  titleJa: varchar("title_ja", { length: 255 }),
  artist: varchar("artist", { length: 255 }),
  year: integer("year"),
  episode: varchar("episode", { length: 100 }),
  contentJa: text("content_ja").notNull(),
  contentReading: text("content_reading"),
  analysis: json("analysis").$type<{
    keyExpressions?: Array<{
      expression: string;
      reading?: string;
      meaning?: string;
      usageNote?: string;
    }>;
    grammarPoints?: string[];
    culturalContext?: string;
    emotionalTone?: string;
    difficultyNotes?: string;
  }>(),
  difficulty: integer("difficulty").default(5).notNull(),
  jlptLevel: jlptLevelEnum("jlpt_level"),
  tags: json("tags").$type<string[]>(),
  themes: json("themes").$type<string[]>(),
  sourceUrl: varchar("source_url", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  audioUrl: varchar("audio_url", { length: 500 }),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MediaMaterial = typeof mediaMaterials.$inferSelect;
export type InsertMediaMaterial = typeof mediaMaterials.$inferInsert;

/**
 * scene_categories - 场景分类表
 * 定义场景的层级分类结构
 */
export const sceneCategories = pgTable("scene_categories", {
  id: serial("id").primaryKey(),
  nameJa: varchar("name_ja", { length: 100 }).notNull(),
  nameZh: varchar("name_zh", { length: 100 }).notNull(),
  parentId: integer("parent_id"),
  descriptionJa: text("description_ja"),
  descriptionZh: text("description_zh"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  minDifficulty: integer("min_difficulty").default(1),
  maxDifficulty: integer("max_difficulty").default(10),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SceneCategory = typeof sceneCategories.$inferSelect;
export type InsertSceneCategory = typeof sceneCategories.$inferInsert;

/**
 * user_unit_progress - 用户单元学习进度
 * 记录用户对每个学习单元的学习状态
 */
export const userUnitProgress = pgTable("user_unit_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  unitId: integer("unit_id").notNull(),
  status: progressStatusEnum("status").default("not_started").notNull(),
  completionRate: integer("completion_rate").default(0).notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at"),
  reviewCount: integer("review_count").default(0).notNull(),
  nextReviewAt: timestamp("next_review_at"),
  userRating: integer("user_rating"),
  userNotes: text("user_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserUnitProgress = typeof userUnitProgress.$inferSelect;
export type InsertUserUnitProgress = typeof userUnitProgress.$inferInsert;

/**
 * daily_learning_plans - 每日学习计划
 * AI生成的每日个性化学习计划
 */
export const dailyLearningPlans = pgTable("daily_learning_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  plannedUnits: json("planned_units").$type<Array<{
    unitId: number;
    type: "new" | "review";
    estimatedMinutes: number;
    priority: number;
  }>>(),
  completedUnits: json("completed_units").$type<number[]>(),
  aiReasoning: text("ai_reasoning"),
  totalPlannedMinutes: integer("total_planned_minutes").default(0),
  actualStudyMinutes: integer("actual_study_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DailyLearningPlan = typeof dailyLearningPlans.$inferSelect;
export type InsertDailyLearningPlan = typeof dailyLearningPlans.$inferInsert;

/**
 * expression_bank - 表达库
 * 存储常用日语表达,按功能分类
 */
export const expressionBank = pgTable("expression_bank", {
  id: serial("id").primaryKey(),
  expressionJa: varchar("expression_ja", { length: 500 }).notNull(),
  reading: varchar("reading", { length: 500 }),
  meaningJa: text("meaning_ja"),
  meaningZh: text("meaning_zh"),
  functionCategory: varchar("function_category", { length: 100 }).notNull(),
  situationCategory: varchar("situation_category", { length: 100 }),
  difficulty: integer("difficulty").default(1).notNull(),
  jlptLevel: jlptLevelEnum("jlpt_level"),
  usageNotes: text("usage_notes"),
  examples: json("examples").$type<Array<{
    sentence: string;
    reading?: string;
    context?: string;
  }>>(),
  relatedExpressions: json("related_expressions").$type<number[]>(),
  relatedVocabularyIds: json("related_vocabulary_ids").$type<number[]>(),
  relatedGrammarIds: json("related_grammar_ids").$type<number[]>(),
  sourceType: expressionSourceTypeEnum("source_type"),
  sourceTitle: varchar("source_title", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ExpressionBank = typeof expressionBank.$inferSelect;
export type InsertExpressionBank = typeof expressionBank.$inferInsert;

/**
 * knowledge_expansions - 知识扩展缓存表
 * 存储AI生成的学习单元知识扩展内容
 */
export const knowledgeExpansions = pgTable("knowledge_expansions", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull().unique(),
  content: json("content").$type<{
    sceneApplications?: {
      title: string;
      mainScenes: Array<{
        scene: string;
        description: string;
        example: string;
        exampleReading: string;
      }>;
      variations: Array<{
        context: string;
        expression: string;
        expressionReading: string;
        explanation: string;
      }>;
    };
    languageOrigin?: {
      title: string;
      etymology: string;
      historicalDevelopment: string;
      keyMilestones: Array<{
        period: string;
        event: string;
      }>;
    };
    ancientVsModern?: {
      title: string;
      introduction: string;
      comparisons: Array<{
        aspect: string;
        ancient: string;
        modern: string;
        explanation: string;
      }>;
    };
    culturalBackground?: {
      title: string;
      content: string;
      customs: Array<{
        name: string;
        description: string;
      }>;
    };
    learningTips?: {
      title: string;
      tips: string[];
      commonMistakes: Array<{
        mistake: string;
        correction: string;
      }>;
    };
    references?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    generatedAt?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KnowledgeExpansion = typeof knowledgeExpansions.$inferSelect;
export type InsertKnowledgeExpansion = typeof knowledgeExpansions.$inferInsert;
