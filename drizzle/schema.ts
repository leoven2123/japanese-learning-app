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


/**
 * ============================================
 * 沉浸式场景学习系统表
 * ============================================
 */

/**
 * learning_units - 学习单元表(原子化学习内容)
 * 每个学习单元是一个可组合的原子,包含场景、表达、媒体素材等
 */
export const learningUnits = mysqlTable("learning_units", {
  id: int("id").autoincrement().primaryKey(),
  
  // 单元类型和分类
  unitType: mysqlEnum("unitType", ["scene", "expression", "media", "dialogue"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // 大类:家庭、购物、交通等
  subCategory: varchar("subCategory", { length: 100 }), // 子类:便利店、超市等
  
  // 标题和描述(纯日语)
  titleJa: varchar("titleJa", { length: 255 }).notNull(), // 日语标题
  titleZh: varchar("titleZh", { length: 255 }), // 中文标题(可选,用于后台管理)
  descriptionJa: text("descriptionJa"), // 日语描述
  
  // 难度(1-10细粒度)
  difficulty: int("difficulty").default(1).notNull(),
  jlptLevel: mysqlEnum("jlptLevel", ["N5", "N4", "N3", "N2", "N1"]),
  
  // 学习目标
  targetExpressions: json("targetExpressions").$type<string[]>(), // 目标表达
  targetPatterns: json("targetPatterns").$type<string[]>(), // 目标句型
  targetVocabularyIds: json("targetVocabularyIds").$type<number[]>(), // 关联词汇ID
  targetGrammarIds: json("targetGrammarIds").$type<number[]>(), // 关联语法ID
  
  // 前置条件
  prerequisites: json("prerequisites").$type<number[]>(), // 前置单元ID
  relatedUnits: json("relatedUnits").$type<number[]>(), // 相关单元ID
  
  // 内容
  content: json("content").$type<{
    dialogues?: Array<{
      speaker: string;
      speakerRole?: string;
      text: string;
      reading?: string;
      notes?: string; // 点击可查看的注释
    }>;
    situationDescription?: string; // 场景描述(日语)
    culturalNotes?: string; // 文化背景(日语)
    keyPoints?: string[]; // 学习要点
  }>(),
  
  // 来源标注
  sourceType: mysqlEnum("sourceType", ["original", "anime", "jpop", "movie", "drama", "novel"]),
  sourceTitle: varchar("sourceTitle", { length: 255 }),
  sourceYear: int("sourceYear"),
  sourceEpisode: varchar("sourceEpisode", { length: 100 }),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  
  // 排序和状态
  orderIndex: int("orderIndex").default(0),
  isPublished: boolean("isPublished").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningUnit = typeof learningUnits.$inferSelect;
export type InsertLearningUnit = typeof learningUnits.$inferInsert;

/**
 * media_materials - 媒体素材库
 * 存储动漫、J-POP、电影等学习素材
 */
export const mediaMaterials = mysqlTable("media_materials", {
  id: int("id").autoincrement().primaryKey(),
  
  // 素材类型
  mediaType: mysqlEnum("mediaType", ["anime", "jpop", "movie", "drama", "novel", "manga"]).notNull(),
  
  // 基本信息
  title: varchar("title", { length: 255 }).notNull(), // 作品名
  titleJa: varchar("titleJa", { length: 255 }), // 日语原名
  artist: varchar("artist", { length: 255 }), // 歌手/导演/作者
  year: int("year"),
  episode: varchar("episode", { length: 100 }), // 集数/章节
  
  // 内容
  contentJa: text("contentJa").notNull(), // 日语原文(歌词/对话/片段)
  contentReading: text("contentReading"), // 假名注音
  
  // 分析内容
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
  
  // 难度和分类
  difficulty: int("difficulty").default(5).notNull(),
  jlptLevel: mysqlEnum("jlptLevel", ["N5", "N4", "N3", "N2", "N1"]),
  tags: json("tags").$type<string[]>(),
  themes: json("themes").$type<string[]>(), // 主题:爱情、友情、冒险等
  
  // 来源
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  imageUrl: varchar("imageUrl", { length: 500 }),
  audioUrl: varchar("audioUrl", { length: 500 }),
  
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MediaMaterial = typeof mediaMaterials.$inferSelect;
export type InsertMediaMaterial = typeof mediaMaterials.$inferInsert;

/**
 * scene_categories - 场景分类表
 * 定义场景的层级分类结构
 */
export const sceneCategories = mysqlTable("scene_categories", {
  id: int("id").autoincrement().primaryKey(),
  
  // 分类信息
  nameJa: varchar("nameJa", { length: 100 }).notNull(), // 日语名称
  nameZh: varchar("nameZh", { length: 100 }).notNull(), // 中文名称
  parentId: int("parentId"), // 父分类ID(用于层级结构)
  
  // 描述
  descriptionJa: text("descriptionJa"),
  descriptionZh: text("descriptionZh"),
  
  // 图标和样式
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  
  // 难度范围
  minDifficulty: int("minDifficulty").default(1),
  maxDifficulty: int("maxDifficulty").default(10),
  
  // 排序
  orderIndex: int("orderIndex").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SceneCategory = typeof sceneCategories.$inferSelect;
export type InsertSceneCategory = typeof sceneCategories.$inferInsert;

/**
 * user_unit_progress - 用户单元学习进度
 * 记录用户对每个学习单元的学习状态
 */
export const userUnitProgress = mysqlTable("user_unit_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  unitId: int("unitId").notNull(),
  
  // 学习状态
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "mastered"]).default("not_started").notNull(),
  
  // 完成度(0-100)
  completionRate: int("completionRate").default(0).notNull(),
  
  // 学习记录
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  lastAccessedAt: timestamp("lastAccessedAt"),
  
  // 复习相关
  reviewCount: int("reviewCount").default(0).notNull(),
  nextReviewAt: timestamp("nextReviewAt"),
  
  // 用户评分和笔记
  userRating: int("userRating"), // 1-5星
  userNotes: text("userNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserUnitProgress = typeof userUnitProgress.$inferSelect;
export type InsertUserUnitProgress = typeof userUnitProgress.$inferInsert;

/**
 * daily_learning_plans - 每日学习计划
 * AI生成的每日个性化学习计划
 */
export const dailyLearningPlans = mysqlTable("daily_learning_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  
  // 计划内容
  plannedUnits: json("plannedUnits").$type<Array<{
    unitId: number;
    type: "new" | "review";
    estimatedMinutes: number;
    priority: number;
  }>>(),
  
  // 完成情况
  completedUnits: json("completedUnits").$type<number[]>(),
  
  // AI决策理由
  aiReasoning: text("aiReasoning"),
  
  // 统计
  totalPlannedMinutes: int("totalPlannedMinutes").default(0),
  actualStudyMinutes: int("actualStudyMinutes").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyLearningPlan = typeof dailyLearningPlans.$inferSelect;
export type InsertDailyLearningPlan = typeof dailyLearningPlans.$inferInsert;

/**
 * expression_bank - 表达库
 * 存储常用日语表达,按功能分类
 */
export const expressionBank = mysqlTable("expression_bank", {
  id: int("id").autoincrement().primaryKey(),
  
  // 表达内容
  expressionJa: varchar("expressionJa", { length: 500 }).notNull(),
  reading: varchar("reading", { length: 500 }),
  meaningJa: text("meaningJa"), // 日语解释(优先)
  meaningZh: text("meaningZh"), // 中文解释
  
  // 分类
  functionCategory: varchar("functionCategory", { length: 100 }).notNull(), // 功能:问候、请求、感谢等
  situationCategory: varchar("situationCategory", { length: 100 }), // 场景:正式、非正式、商务等
  
  // 难度
  difficulty: int("difficulty").default(1).notNull(),
  jlptLevel: mysqlEnum("jlptLevel", ["N5", "N4", "N3", "N2", "N1"]),
  
  // 使用说明
  usageNotes: text("usageNotes"),
  examples: json("examples").$type<Array<{
    sentence: string;
    reading?: string;
    context?: string;
  }>>(),
  
  // 关联
  relatedExpressions: json("relatedExpressions").$type<number[]>(),
  relatedVocabularyIds: json("relatedVocabularyIds").$type<number[]>(),
  relatedGrammarIds: json("relatedGrammarIds").$type<number[]>(),
  
  // 来源
  sourceType: mysqlEnum("sourceType", ["original", "anime", "jpop", "movie", "drama"]),
  sourceTitle: varchar("sourceTitle", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpressionBank = typeof expressionBank.$inferSelect;
export type InsertExpressionBank = typeof expressionBank.$inferInsert;
