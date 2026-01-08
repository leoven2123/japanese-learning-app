import { eq, and, or, like, inArray, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
  InsertConversationMessage
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * ============================================
 * 用户相关查询
 * ============================================
 */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * ============================================
 * 词汇相关查询
 * ============================================
 */

export async function getVocabularyList(params: {
  jlptLevel?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

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

  const query = db
    .select()
    .from(vocabulary)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(params.limit || 50)
    .offset(params.offset || 0);

  return await query;
}

export async function getVocabularyById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(vocabulary).where(eq(vocabulary.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
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
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

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

  const query = db
    .select()
    .from(grammar)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(params.limit || 50)
    .offset(params.offset || 0);

  return await query;
}

export async function getGrammarById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(grammar).where(eq(grammar.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
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
