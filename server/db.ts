import { eq, and, or, like, inArray, notInArray, sql, desc, asc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  vocabulary,
  grammar,
  sentences,
  scenes,
  learningProgress,
  reviewSchedule,
  vocabularySentences,
  grammarSentences,
  learningResources,
  learningCurriculum,
  aiGeneratedContent,
  userLearningPath,
  conversations,
  conversationMessages,
  InsertConversation,
  InsertConversationMessage,
  userNotes,
  InsertUserNote,
  studyRecords,
  InsertStudyRecord,
  dailyStudyStats,
  InsertDailyStudyStats,
  learningUnits,
  InsertLearningUnit,
  mediaMaterials,
  InsertMediaMaterial,
  sceneCategories,
  InsertSceneCategory,
  userUnitProgress,
  InsertUserUnitProgress,
  dailyLearningPlans,
  InsertDailyLearningPlan,
  expressionBank,
  InsertExpressionBank,
  knowledgeExpansions,
  InsertKnowledgeExpansion
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

/**
 * ============================================
 * 用户相关查询
 * ============================================
 */

/**
 * 创建新用户
 */
export async function createUser(data: {
  username?: string;
  email?: string;
  passwordHash: string;
  name?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values({
    username: data.username || null,
    email: data.email || null,
    passwordHash: data.passwordHash,
    name: data.name || null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  }).returning({ id: users.id });

  return result[0].id;
}

/**
 * 通过 ID 获取用户
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 通过邮箱获取用户
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 通过用户名获取用户
 */
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 通过邮箱或用户名获取用户（用于登录）
 */
export async function getUserByEmailOrUsername(identifier: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(
    or(
      eq(users.email, identifier),
      eq(users.username, identifier)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 更新用户最后登录时间
 */
export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ lastSignedIn: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * ============================================
 * 词汇相关查询
 * ============================================
 */

// 首字母范围映射
const KANA_RANGES: Record<string, { start: string; end: string }> = {
  a: { start: "あ", end: "お" },
  ka: { start: "か", end: "ご" },
  sa: { start: "さ", end: "ぞ" },
  ta: { start: "た", end: "ど" },
  na: { start: "な", end: "の" },
  ha: { start: "は", end: "ぽ" },
  ma: { start: "ま", end: "も" },
  ya: { start: "や", end: "よ" },
  ra: { start: "ら", end: "ろ" },
  wa: { start: "わ", end: "ん" },
};

export async function getVocabularyList(params: {
  jlptLevel?: string;
  search?: string;
  firstLetter?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];
  if (params.jlptLevel) {
    conditions.push(eq(vocabulary.jlptLevel, params.jlptLevel as any));
  }
  if (params.search) {
    conditions.push(
      or(
        like(vocabulary.expression, `%${params.search}%`),
        like(vocabulary.reading, `%${params.search}%`),
        like(vocabulary.romaji, `%${params.search}%`),
        like(vocabulary.meaning, `%${params.search}%`)
      )
    );
  }
  if (params.firstLetter && KANA_RANGES[params.firstLetter]) {
    const range = KANA_RANGES[params.firstLetter];
    conditions.push(
      and(
        gte(vocabulary.reading, range.start),
        lte(vocabulary.reading, range.end + "ん")
      )
    );
  }

  // 获取总数
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(vocabulary)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const countResult = await countQuery;
  const total = countResult[0]?.count || 0;

  // 获取分页数据
  let query = db
    .select()
    .from(vocabulary)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // 添加排序
  if (params.sortBy === "kana") {
    query = query.orderBy(vocabulary.reading) as any;
  } else {
    query = query.orderBy(vocabulary.id) as any;
  }

  query = query.limit(params.limit || 50).offset(params.offset || 0) as any;

  const items = await query;
  
  return { items, total };
}

export async function getVocabularyById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(vocabulary).where(eq(vocabulary.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getVocabularyByExpression(expression: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(vocabulary).where(eq(vocabulary.expression, expression)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createVocabulary(data: {
  expression: string;
  reading: string;
  meaning: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  partOfSpeech: string | null;
  tags: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vocabulary).values([{
    expression: data.expression,
    reading: data.reading,
    meaning: data.meaning,
    jlptLevel: data.level,
    partOfSpeech: data.partOfSpeech,
    tags: data.tags ? [data.tags] : undefined,
  }]);
  return result;
}

export async function getVocabularyWithExamples(id: number) {
  const db = await getDb();
  if (!db) return null;

  const vocab = await getVocabularyById(id);
  if (!vocab) return null;

  const exampleLinks = await db
    .select()
    .from(vocabularySentences)
    .where(eq(vocabularySentences.vocabularyId, id));

  const exampleIds = exampleLinks.map(link => link.sentenceId);
  
  let examples: any[] = [];
  if (exampleIds.length > 0) {
    examples = await db
      .select()
      .from(sentences)
      .where(inArray(sentences.id, exampleIds));
  }

  return {
    ...vocab,
    examples
  };
}

/**
 * ============================================
 * 语法相关查询
 * ============================================
 */

export async function getGrammarList(params: {
  jlptLevel?: string;
  search?: string;
  firstLetter?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];
  if (params.jlptLevel) {
    conditions.push(eq(grammar.jlptLevel, params.jlptLevel as any));
  }
  if (params.search) {
    conditions.push(
      or(
        like(grammar.pattern, `%${params.search}%`),
        like(grammar.meaning, `%${params.search}%`)
      )
    );
  }
  if (params.firstLetter && KANA_RANGES[params.firstLetter]) {
    const range = KANA_RANGES[params.firstLetter];
    conditions.push(
      and(
        gte(grammar.pattern, range.start),
        lte(grammar.pattern, range.end + "ん")
      )
    );
  }

  // 获取总数
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(grammar)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  const countResult = await countQuery;
  const total = countResult[0]?.count || 0;

  // 获取分页数据
  let query = db
    .select()
    .from(grammar)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // 添加排序
  if (params.sortBy === "kana") {
    query = query.orderBy(grammar.pattern) as any;
  } else {
    query = query.orderBy(grammar.id) as any;
  }

  query = query.limit(params.limit || 50).offset(params.offset || 0) as any;

  const items = await query;
  
  return { items, total };
}

export async function getGrammarById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(grammar).where(eq(grammar.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getGrammarByPattern(pattern: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(grammar).where(eq(grammar.pattern, pattern)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createGrammar(data: {
  pattern: string;
  meaning: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  explanation: string | null;
  tags: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(grammar).values([{
    pattern: data.pattern,
    meaning: data.meaning,
    jlptLevel: data.level,
    usage: data.explanation,
    tags: data.tags ? [data.tags] : undefined,
  }]);
  return result;
}

export async function getGrammarWithExamples(id: number) {
  const db = await getDb();
  if (!db) return null;

  const grammarItem = await getGrammarById(id);
  if (!grammarItem) return null;

  const exampleLinks = await db
    .select()
    .from(grammarSentences)
    .where(eq(grammarSentences.grammarId, id));

  const exampleIds = exampleLinks.map(link => link.sentenceId);
  
  let examples: any[] = [];
  if (exampleIds.length > 0) {
    examples = await db
      .select()
      .from(sentences)
      .where(inArray(sentences.id, exampleIds));
  }

  return {
    ...grammarItem,
    examples
  };
}

/**
 * ============================================
 * 场景相关查询
 * ============================================
 */

export async function getSceneList() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(scenes).orderBy(asc(scenes.orderIndex));
}

export async function getSceneById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(scenes).where(eq(scenes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * ============================================
 * 学习进度相关查询
 * ============================================
 */

export async function getUserProgress(userId: number, itemType?: string, itemId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(learningProgress.userId, userId)];
  if (itemType) {
    conditions.push(eq(learningProgress.itemType, itemType as any));
  }
  if (itemId) {
    conditions.push(eq(learningProgress.itemId, itemId));
  }

  return await db
    .select()
    .from(learningProgress)
    .where(and(...conditions));
}

export async function upsertLearningProgress(data: {
  userId: number;
  itemType: "vocabulary" | "grammar" | "scene";
  itemId: number;
  masteryLevel: "learning" | "familiar" | "mastered";
}) {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(learningProgress)
    .where(
      and(
        eq(learningProgress.userId, data.userId),
        eq(learningProgress.itemType, data.itemType),
        eq(learningProgress.itemId, data.itemId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const currentReviewCount = existing[0].reviewCount ?? 0;
    await db
      .update(learningProgress)
      .set({
        masteryLevel: data.masteryLevel,
        reviewCount: currentReviewCount + 1,
        lastReviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(learningProgress.id, existing[0].id));
  } else {
    await db.insert(learningProgress).values({
      userId: data.userId,
      itemType: data.itemType,
      itemId: data.itemId,
      masteryLevel: data.masteryLevel,
      reviewCount: 1,
      lastReviewedAt: new Date()
    });
  }
}

/**
 * ============================================
 * 复习计划相关查询
 * ============================================
 */

export async function getReviewSchedule(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(reviewSchedule)
    .where(
      and(
        eq(reviewSchedule.userId, userId),
        eq(reviewSchedule.completed, false)
      )
    )
    .orderBy(asc(reviewSchedule.scheduledAt))
    .limit(limit || 20);
}

/**
 * ============================================
 * 学习资源相关查询
 * ============================================
 */

export async function getActiveResources(category?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(learningResources.isActive, true)];
  if (category) {
    conditions.push(eq(learningResources.category, category as any));
  }

  return await db
    .select()
    .from(learningResources)
    .where(and(...conditions))
    .orderBy(desc(learningResources.reliability));
}

/**
 * ============================================
 * 学习大纲相关查询
 * ============================================
 */

export async function getCurriculumByLevel(level: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(learningCurriculum)
    .where(eq(learningCurriculum.level, level as any))
    .orderBy(asc(learningCurriculum.orderIndex));
}

export async function getCurriculumStageById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(learningCurriculum)
    .where(eq(learningCurriculum.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * ============================================
 * 用户学习路径相关查询
 * ============================================
 */

export async function getUserLearningPath(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userLearningPath)
    .where(eq(userLearningPath.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function initUserLearningPath(userId: number) {
  const db = await getDb();
  if (!db) return;

  const existing = await getUserLearningPath(userId);
  if (existing) return existing;

  // 获取N5的第一个阶段作为起点
  const firstStage = await db
    .select()
    .from(learningCurriculum)
    .where(eq(learningCurriculum.level, "N5"))
    .orderBy(asc(learningCurriculum.orderIndex))
    .limit(1);

  await db.insert(userLearningPath).values({
    userId,
    currentCurriculumStageId: firstStage.length > 0 ? firstStage[0].id : null,
    completedStages: [],
    startedAt: new Date(),
    lastActiveAt: new Date(),
    totalStudyHours: "0.00"
  });

  return await getUserLearningPath(userId);
}

/**
 * ============================================
 * AI生成内容相关查询
 * ============================================
 */

export async function getAIGeneratedContent(params: {
  userId: number;
  contentType?: string;
  curriculumStageId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(aiGeneratedContent.userId, params.userId)];
  if (params.contentType) {
    conditions.push(eq(aiGeneratedContent.contentType, params.contentType as any));
  }
  if (params.curriculumStageId) {
    conditions.push(eq(aiGeneratedContent.curriculumStageId, params.curriculumStageId));
  }

  return await db
    .select()
    .from(aiGeneratedContent)
    .where(and(...conditions))
    .orderBy(desc(aiGeneratedContent.createdAt))
    .limit(params.limit || 10);
}

export async function saveAIGeneratedContent(data: {
  userId: number;
  contentType: "vocabulary" | "grammar" | "exercise" | "explanation" | "dialogue";
  prompt: string;
  generatedContent: any;
  curriculumStageId?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(aiGeneratedContent).values({
    userId: data.userId,
    contentType: data.contentType,
    prompt: data.prompt,
    generatedContent: data.generatedContent,
    curriculumStageId: data.curriculumStageId,
    isApproved: false,
    createdAt: new Date()
  });

  return result;
}


/**
 * ============================================
 * AI助手对话历史查询
 * ============================================
 */

/**
 * 创建新的对话会话
 */
export async function createConversation(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values({
    userId,
    title,
    lastMessageAt: new Date(),
  });

  return result[0].insertId;
}

/**
 * 获取用户的对话列表
 */
export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.lastMessageAt));
}

/**
 * 获取对话的所有消息
 */
export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(asc(conversationMessages.createdAt));
}

/**
 * 添加消息到对话
 */
export async function addMessageToConversation(
  conversationId: number,
  role: "user" | "assistant",
  content: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 插入消息
  await db.insert(conversationMessages).values({
    conversationId,
    role,
    content,
  });

  // 更新对话的最后消息时间
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

/**
 * 删除对话
 */
export async function deleteConversation(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 先删除所有消息
  await db
    .delete(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId));

  // 再删除对话(确保是用户自己的对话)
  await db
    .delete(conversations)
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ));
}

/**
 * 更新对话标题
 */
export async function updateConversationTitle(
  conversationId: number,
  userId: number,
  title: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ title })
    .where(and(
      eq(conversations.id, conversationId),
      eq(conversations.userId, userId)
    ));
}

/**
 * ============================================
 * 用户笔记相关查询
 * ============================================
 */

/**
 * 获取用户对某个词汇或语法的笔记
 */
export async function getUserNote(
  userId: number,
  itemType: "vocabulary" | "grammar",
  itemId: number
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userNotes)
    .where(and(
      eq(userNotes.userId, userId),
      eq(userNotes.itemType, itemType),
      eq(userNotes.itemId, itemId)
    ))
    .limit(1);

  return result[0] || null;
}

/**
 * 创建或更新用户笔记
 */
export async function upsertUserNote(data: {
  userId: number;
  itemType: "vocabulary" | "grammar";
  itemId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 检查是否已存在笔记
  const existing = await getUserNote(data.userId, data.itemType, data.itemId);

  if (existing) {
    // 更新现有笔记
    await db
      .update(userNotes)
      .set({ content: data.content })
      .where(eq(userNotes.id, existing.id));
    return { ...existing, content: data.content };
  } else {
    // 创建新笔记
    const result = await db.insert(userNotes).values({
      userId: data.userId,
      itemType: data.itemType,
      itemId: data.itemId,
      content: data.content,
    });
    return {
      id: Number(result[0].insertId),
      ...data,
    };
  }
}

/**
 * 删除用户笔记
 */
export async function deleteUserNote(
  userId: number,
  itemType: "vocabulary" | "grammar",
  itemId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(userNotes)
    .where(and(
      eq(userNotes.userId, userId),
      eq(userNotes.itemType, itemType),
      eq(userNotes.itemId, itemId)
    ));
}

/**
 * 获取用户的所有笔记
 */
export async function getUserNotes(
  userId: number,
  itemType?: "vocabulary" | "grammar"
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(userNotes.userId, userId)];
  if (itemType) {
    conditions.push(eq(userNotes.itemType, itemType));
  }

  return await db
    .select()
    .from(userNotes)
    .where(and(...conditions))
    .orderBy(desc(userNotes.updatedAt));
}


/**
 * ============================================
 * 艾宾浩斯复习系统相关函数
 * ============================================
 */

// 艾宾浩斯遗忘曲线复习间隔(天数)
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

/**
 * 计算下次复习时间
 */
function calculateNextReviewTime(reviewCount: number, easeFactor: number = 2.5): Date {
  const intervalIndex = Math.min(reviewCount, REVIEW_INTERVALS.length - 1);
  const baseInterval = REVIEW_INTERVALS[intervalIndex];
  const adjustedInterval = Math.round(baseInterval * easeFactor / 2.5);
  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + adjustedInterval);
  return nextReview;
}

/**
 * 添加学习记录(将词汇或语法加入学习计划)
 */
export async function addStudyRecord(
  userId: number,
  itemType: "vocabulary" | "grammar",
  itemId: number
) {
  const db = await getDb();
  if (!db) return null;

  // 检查是否已存在
  const existing = await db
    .select()
    .from(studyRecords)
    .where(and(
      eq(studyRecords.userId, userId),
      eq(studyRecords.itemType, itemType),
      eq(studyRecords.itemId, itemId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]; // 已存在,直接返回
  }

  // 创建新的学习记录
  const nextReviewAt = calculateNextReviewTime(0);
  
  const result = await db.insert(studyRecords).values({
    userId,
    itemType,
    itemId,
    reviewCount: 0,
    easeFactor: "2.50",
    firstLearnedAt: new Date(),
    lastReviewedAt: new Date(),
    nextReviewAt,
    correctCount: 0,
    incorrectCount: 0,
    isMastered: false,
  });

  // 更新每日统计
  await updateDailyStats(userId, { newItemsLearned: 1 });

  return { id: result[0].insertId, nextReviewAt };
}

/**
 * 获取用户待复习的内容
 */
export async function getDueReviews(
  userId: number,
  itemType?: "vocabulary" | "grammar",
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const conditions = [
    eq(studyRecords.userId, userId),
    lte(studyRecords.nextReviewAt, now),
    eq(studyRecords.isMastered, false)
  ];

  if (itemType) {
    conditions.push(eq(studyRecords.itemType, itemType));
  }

  return await db
    .select()
    .from(studyRecords)
    .where(and(...conditions))
    .orderBy(asc(studyRecords.nextReviewAt))
    .limit(limit);
}

/**
 * 获取用户的学习记录统计
 */
export async function getStudyStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  
  // 总学习数
  const totalLearned = await db
    .select({ count: sql<number>`count(*)` })
    .from(studyRecords)
    .where(eq(studyRecords.userId, userId));

  // 待复习数
  const dueReviews = await db
    .select({ count: sql<number>`count(*)` })
    .from(studyRecords)
    .where(and(
      eq(studyRecords.userId, userId),
      lte(studyRecords.nextReviewAt, now),
      eq(studyRecords.isMastered, false)
    ));

  // 已掌握数
  const mastered = await db
    .select({ count: sql<number>`count(*)` })
    .from(studyRecords)
    .where(and(
      eq(studyRecords.userId, userId),
      eq(studyRecords.isMastered, true)
    ));

  // 按类型统计
  const byType = await db
    .select({
      itemType: studyRecords.itemType,
      count: sql<number>`count(*)`
    })
    .from(studyRecords)
    .where(eq(studyRecords.userId, userId))
    .groupBy(studyRecords.itemType);

  return {
    totalLearned: totalLearned[0]?.count || 0,
    dueReviews: dueReviews[0]?.count || 0,
    mastered: mastered[0]?.count || 0,
    vocabularyCount: byType.find(b => b.itemType === "vocabulary")?.count || 0,
    grammarCount: byType.find(b => b.itemType === "grammar")?.count || 0,
  };
}

/**
 * 更新复习结果
 * @param quality 记忆质量: 1=忘记, 2=困难, 3=一般, 4=简单, 5=完美
 */
export async function updateReviewResult(
  userId: number,
  recordId: number,
  quality: 1 | 2 | 3 | 4 | 5
) {
  const db = await getDb();
  if (!db) return null;

  // 获取当前记录
  const records = await db
    .select()
    .from(studyRecords)
    .where(and(
      eq(studyRecords.id, recordId),
      eq(studyRecords.userId, userId)
    ))
    .limit(1);

  if (records.length === 0) return null;

  const record = records[0];
  const isCorrect = quality >= 3;
  
  // 计算新的难度系数 (SM-2算法简化版)
  let newEaseFactor = parseFloat(record.easeFactor as string);
  if (quality < 3) {
    newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
  } else if (quality > 3) {
    newEaseFactor = Math.min(3.0, newEaseFactor + 0.1);
  }

  // 计算新的复习次数
  let newReviewCount = record.reviewCount;
  if (isCorrect) {
    newReviewCount = Math.min(record.reviewCount + 1, REVIEW_INTERVALS.length);
  } else {
    // 忘记了,重置复习进度
    newReviewCount = 0;
  }

  // 检查是否已掌握
  const isMastered = newReviewCount >= REVIEW_INTERVALS.length;

  // 计算下次复习时间
  const nextReviewAt = isMastered 
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 已掌握,一年后再复习
    : calculateNextReviewTime(newReviewCount, newEaseFactor);

  // 更新记录
  await db
    .update(studyRecords)
    .set({
      reviewCount: newReviewCount,
      easeFactor: newEaseFactor.toFixed(2),
      lastReviewedAt: new Date(),
      nextReviewAt,
      correctCount: isCorrect ? record.correctCount + 1 : record.correctCount,
      incorrectCount: isCorrect ? record.incorrectCount : record.incorrectCount + 1,
      isMastered,
    })
    .where(eq(studyRecords.id, recordId));

  // 更新每日统计
  await updateDailyStats(userId, {
    itemsReviewed: 1,
    correctReviews: isCorrect ? 1 : 0,
    incorrectReviews: isCorrect ? 0 : 1,
  });

  return {
    newReviewCount,
    newEaseFactor,
    nextReviewAt,
    isMastered,
  };
}

/**
 * 更新每日学习统计
 */
async function updateDailyStats(
  userId: number,
  updates: {
    newItemsLearned?: number;
    itemsReviewed?: number;
    correctReviews?: number;
    incorrectReviews?: number;
    studyMinutes?: number;
  }
) {
  const db = await getDb();
  if (!db) return;

  const today = new Date().toISOString().split('T')[0];

  // 尝试获取今日记录
  const existing = await db
    .select()
    .from(dailyStudyStats)
    .where(and(
      eq(dailyStudyStats.userId, userId),
      eq(dailyStudyStats.date, today)
    ))
    .limit(1);

  if (existing.length > 0) {
    // 更新现有记录
    await db
      .update(dailyStudyStats)
      .set({
        newItemsLearned: existing[0].newItemsLearned + (updates.newItemsLearned || 0),
        itemsReviewed: existing[0].itemsReviewed + (updates.itemsReviewed || 0),
        correctReviews: existing[0].correctReviews + (updates.correctReviews || 0),
        incorrectReviews: existing[0].incorrectReviews + (updates.incorrectReviews || 0),
        studyMinutes: existing[0].studyMinutes + (updates.studyMinutes || 0),
      })
      .where(eq(dailyStudyStats.id, existing[0].id));
  } else {
    // 创建新记录
    await db.insert(dailyStudyStats).values({
      userId,
      date: today,
      newItemsLearned: updates.newItemsLearned || 0,
      itemsReviewed: updates.itemsReviewed || 0,
      correctReviews: updates.correctReviews || 0,
      incorrectReviews: updates.incorrectReviews || 0,
      studyMinutes: updates.studyMinutes || 0,
    });
  }
}

/**
 * 获取用户的每日学习统计(最近N天)
 */
export async function getDailyStats(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  return await db
    .select()
    .from(dailyStudyStats)
    .where(and(
      eq(dailyStudyStats.userId, userId),
      gte(dailyStudyStats.date, startDateStr)
    ))
    .orderBy(desc(dailyStudyStats.date));
}

/**
 * 检查用户是否已学习某个项目
 */
export async function isItemInStudyPlan(
  userId: number,
  itemType: "vocabulary" | "grammar",
  itemId: number
) {
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select({ id: studyRecords.id })
    .from(studyRecords)
    .where(and(
      eq(studyRecords.userId, userId),
      eq(studyRecords.itemType, itemType),
      eq(studyRecords.itemId, itemId)
    ))
    .limit(1);

  return existing.length > 0;
}

/**
 * 从学习计划中移除项目
 */
export async function removeFromStudyPlan(
  userId: number,
  itemType: "vocabulary" | "grammar",
  itemId: number
) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(studyRecords)
    .where(and(
      eq(studyRecords.userId, userId),
      eq(studyRecords.itemType, itemType),
      eq(studyRecords.itemId, itemId)
    ));

  return true;
}


/**
 * ============================================
 * 沉浸式场景学习系统查询
 * ============================================
 */

/**
 * 获取场景分类列表
 */
export async function getSceneCategories(parentId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (parentId !== undefined) {
    return await db
      .select()
      .from(sceneCategories)
      .where(eq(sceneCategories.parentId, parentId))
      .orderBy(asc(sceneCategories.orderIndex));
  }

  return await db
    .select()
    .from(sceneCategories)
    .orderBy(asc(sceneCategories.orderIndex));
}

/**
 * 获取学习单元列表
 */
export async function getLearningUnits(params: {
  category?: string;
  subCategory?: string;
  unitType?: string;
  jlptLevel?: string;
  difficulty?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [eq(learningUnits.isPublished, true)];
  
  if (params.category) {
    conditions.push(eq(learningUnits.category, params.category));
  }
  if (params.subCategory) {
    conditions.push(eq(learningUnits.subCategory, params.subCategory));
  }
  if (params.unitType) {
    conditions.push(eq(learningUnits.unitType, params.unitType as any));
  }
  if (params.jlptLevel) {
    conditions.push(eq(learningUnits.jlptLevel, params.jlptLevel as any));
  }
  if (params.difficulty) {
    conditions.push(eq(learningUnits.difficulty, params.difficulty));
  }

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(learningUnits)
      .where(and(...conditions))
      .orderBy(asc(learningUnits.difficulty), asc(learningUnits.orderIndex))
      .limit(params.limit || 50)
      .offset(params.offset || 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(learningUnits)
      .where(and(...conditions))
  ]);

  return {
    items,
    total: countResult[0]?.count || 0
  };
}

/**
 * 获取学习单元详情
 */
export async function getLearningUnitById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(learningUnits)
    .where(eq(learningUnits.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * 创建学习单元
 */
export async function createLearningUnit(data: InsertLearningUnit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(learningUnits).values(data);
  return result[0].insertId;
}

/**
 * 获取媒体素材列表
 */
export async function getMediaMaterials(params: {
  mediaType?: string;
  jlptLevel?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [eq(mediaMaterials.isPublished, true)];
  
  if (params.mediaType) {
    conditions.push(eq(mediaMaterials.mediaType, params.mediaType as any));
  }
  if (params.jlptLevel) {
    conditions.push(eq(mediaMaterials.jlptLevel, params.jlptLevel as any));
  }

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(mediaMaterials)
      .where(and(...conditions))
      .orderBy(desc(mediaMaterials.createdAt))
      .limit(params.limit || 50)
      .offset(params.offset || 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(mediaMaterials)
      .where(and(...conditions))
  ]);

  return {
    items,
    total: countResult[0]?.count || 0
  };
}

/**
 * 获取媒体素材详情
 */
export async function getMediaMaterialById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(mediaMaterials)
    .where(eq(mediaMaterials.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * 创建媒体素材
 */
export async function createMediaMaterial(data: InsertMediaMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(mediaMaterials).values(data);
  return result[0].insertId;
}

/**
 * 获取用户单元学习进度
 */
export async function getUserUnitProgress(userId: number, unitId?: number) {
  const db = await getDb();
  if (!db) return unitId ? null : [];

  if (unitId) {
    const result = await db
      .select()
      .from(userUnitProgress)
      .where(
        and(
          eq(userUnitProgress.userId, userId),
          eq(userUnitProgress.unitId, unitId)
        )
      )
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  return await db
    .select()
    .from(userUnitProgress)
    .where(eq(userUnitProgress.userId, userId))
    .orderBy(desc(userUnitProgress.lastAccessedAt));
}

/**
 * 更新用户单元学习进度
 */
export async function updateUserUnitProgress(data: {
  userId: number;
  unitId: number;
  status?: "not_started" | "in_progress" | "completed" | "mastered";
  completionRate?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserUnitProgress(data.userId, data.unitId);

  if (existing && typeof existing === 'object' && 'id' in existing) {
    await db
      .update(userUnitProgress)
      .set({
        status: data.status || existing.status,
        completionRate: data.completionRate ?? existing.completionRate,
        lastAccessedAt: new Date(),
        completedAt: data.status === 'completed' || data.status === 'mastered' ? new Date() : existing.completedAt,
      })
      .where(eq(userUnitProgress.id, existing.id));
  } else {
    await db.insert(userUnitProgress).values({
      userId: data.userId,
      unitId: data.unitId,
      status: data.status || "in_progress",
      completionRate: data.completionRate || 0,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    });
  }
}

/**
 * 获取每日学习计划
 */
export async function getDailyLearningPlan(userId: number, date: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(dailyLearningPlans)
    .where(
      and(
        eq(dailyLearningPlans.userId, userId),
        eq(dailyLearningPlans.date, date)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * 创建或更新每日学习计划
 */
export async function upsertDailyLearningPlan(data: {
  userId: number;
  date: string;
  plannedUnits: Array<{
    unitId: number;
    type: "new" | "review";
    estimatedMinutes: number;
    priority: number;
  }>;
  aiReasoning?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getDailyLearningPlan(data.userId, data.date);
  const totalMinutes = data.plannedUnits.reduce((sum, u) => sum + u.estimatedMinutes, 0);

  if (existing) {
    await db
      .update(dailyLearningPlans)
      .set({
        plannedUnits: data.plannedUnits,
        aiReasoning: data.aiReasoning,
        totalPlannedMinutes: totalMinutes,
      })
      .where(eq(dailyLearningPlans.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(dailyLearningPlans).values({
      userId: data.userId,
      date: data.date,
      plannedUnits: data.plannedUnits,
      completedUnits: [],
      aiReasoning: data.aiReasoning,
      totalPlannedMinutes: totalMinutes,
      actualStudyMinutes: 0,
    });
    return result[0].insertId;
  }
}

/**
 * 获取表达库列表
 */
export async function getExpressions(params: {
  functionCategory?: string;
  situationCategory?: string;
  jlptLevel?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];
  
  if (params.functionCategory) {
    conditions.push(eq(expressionBank.functionCategory, params.functionCategory));
  }
  if (params.situationCategory) {
    conditions.push(eq(expressionBank.situationCategory, params.situationCategory));
  }
  if (params.jlptLevel) {
    conditions.push(eq(expressionBank.jlptLevel, params.jlptLevel as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(expressionBank)
      .where(whereClause)
      .orderBy(asc(expressionBank.difficulty))
      .limit(params.limit || 50)
      .offset(params.offset || 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(expressionBank)
      .where(whereClause)
  ]);

  return {
    items,
    total: countResult[0]?.count || 0
  };
}

/**
 * 创建表达
 */
export async function createExpression(data: InsertExpressionBank) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(expressionBank).values(data);
  return result[0].insertId;
}

/**
 * 获取用户推荐的学习单元(基于进度和难度)
 */
export async function getRecommendedUnits(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  // 获取用户已完成的单元
  const completedProgress = await db
    .select({ unitId: userUnitProgress.unitId })
    .from(userUnitProgress)
    .where(
      and(
        eq(userUnitProgress.userId, userId),
        inArray(userUnitProgress.status, ["completed", "mastered"])
      )
    );

  const completedIds = completedProgress.map(p => p.unitId);

  // 获取用户当前的最高难度
  const maxDifficultyResult = await db
    .select({ maxDiff: sql<number>`MAX(${learningUnits.difficulty})` })
    .from(learningUnits)
    .innerJoin(userUnitProgress, eq(learningUnits.id, userUnitProgress.unitId))
    .where(
      and(
        eq(userUnitProgress.userId, userId),
        inArray(userUnitProgress.status, ["completed", "mastered"])
      )
    );

  const currentMaxDifficulty = maxDifficultyResult[0]?.maxDiff || 0;

  // 推荐难度在当前水平附近的未完成单元
  const recommendedUnits = await db
    .select()
    .from(learningUnits)
    .where(
      and(
        eq(learningUnits.isPublished, true),
        lte(learningUnits.difficulty, currentMaxDifficulty + 2),
        completedIds.length > 0 
          ? notInArray(learningUnits.id, completedIds)
          : undefined
      )
    )
    .orderBy(asc(learningUnits.difficulty), asc(learningUnits.orderIndex))
    .limit(limit);

  return recommendedUnits;
}


// 获取知识扩展内容
export async function getKnowledgeExpansion(unitId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(knowledgeExpansions)
    .where(eq(knowledgeExpansions.unitId, unitId))
    .limit(1);

  return result[0]?.content || null;
}

// 保存知识扩展内容
export async function saveKnowledgeExpansion(unitId: number, content: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 检查是否已存在
  const existing = await db
    .select()
    .from(knowledgeExpansions)
    .where(eq(knowledgeExpansions.unitId, unitId))
    .limit(1);

  if (existing.length > 0) {
    // 更新现有记录
    await db
      .update(knowledgeExpansions)
      .set({ content, updatedAt: new Date() })
      .where(eq(knowledgeExpansions.unitId, unitId));
  } else {
    // 插入新记录
    await db.insert(knowledgeExpansions).values({
      unitId,
      content,
    });
  }

  return content;
}
