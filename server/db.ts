import { eq, like, or, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  vocabulary, 
  grammar, 
  examples, 
  scenes, 
  sceneVocabulary, 
  sceneGrammar,
  learningRecords,
  studySessions,
  exercises,
  exerciseAttempts,
  Vocabulary,
  Grammar,
  Example,
  Scene,
  LearningRecord,
  StudySession
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

// ===== User Management =====

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

// ===== Vocabulary Queries =====

export async function getVocabularyByLevel(jlptLevel: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(vocabulary)
    .where(eq(vocabulary.jlptLevel, jlptLevel as any))
    .orderBy(desc(vocabulary.frequency));
}

export async function getVocabularyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(vocabulary)
    .where(eq(vocabulary.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function searchVocabulary(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(vocabulary)
    .where(
      or(
        like(vocabulary.expression, `%${searchTerm}%`),
        like(vocabulary.reading, `%${searchTerm}%`),
        like(vocabulary.romaji, `%${searchTerm}%`),
        like(vocabulary.meaning, `%${searchTerm}%`)
      )
    )
    .limit(50);
}

export async function getVocabularyExamples(vocabId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(examples)
    .where(eq(examples.vocabularyId, vocabId));
}

// ===== Grammar Queries =====

export async function getGrammarByLevel(jlptLevel: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(grammar)
    .where(eq(grammar.jlptLevel, jlptLevel as any));
}

export async function getGrammarById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(grammar)
    .where(eq(grammar.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function searchGrammar(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(grammar)
    .where(
      or(
        like(grammar.grammarPoint, `%${searchTerm}%`),
        like(grammar.meaning, `%${searchTerm}%`),
        like(grammar.structure, `%${searchTerm}%`)
      )
    )
    .limit(50);
}

export async function getGrammarExamples(grammarId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(examples)
    .where(eq(examples.grammarId, grammarId));
}

// ===== Scene Queries =====

export async function getAllScenes() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenes)
    .orderBy(asc(scenes.order));
}

export async function getSceneById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(scenes)
    .where(eq(scenes.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getSceneVocabulary(sceneId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    vocabulary: vocabulary,
    importance: sceneVocabulary.importance
  })
  .from(sceneVocabulary)
  .innerJoin(vocabulary, eq(sceneVocabulary.vocabularyId, vocabulary.id))
  .where(eq(sceneVocabulary.sceneId, sceneId));
}

export async function getSceneGrammar(sceneId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    grammar: grammar,
    importance: sceneGrammar.importance
  })
  .from(sceneGrammar)
  .innerJoin(grammar, eq(sceneGrammar.grammarId, grammar.id))
  .where(eq(sceneGrammar.sceneId, sceneId));
}

export async function getSceneExamples(sceneId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(examples)
    .where(eq(examples.sceneId, sceneId));
}

// ===== Learning Record Queries =====

export async function getUserLearningRecord(userId: number, itemType: string, itemId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(learningRecords)
    .where(
      and(
        eq(learningRecords.userId, userId),
        eq(learningRecords.itemType, itemType as any),
        eq(learningRecords.itemId, itemId)
      )
    )
    .limit(1);
  
  return result[0] || null;
}

export async function createOrUpdateLearningRecord(
  userId: number,
  itemType: 'vocabulary' | 'grammar' | 'scene',
  itemId: number,
  masteryLevel: 'learning' | 'familiar' | 'mastered',
  nextReviewAt?: Date
) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getUserLearningRecord(userId, itemType, itemId);
  
  if (existing) {
    await db.update(learningRecords)
      .set({
        masteryLevel,
        reviewCount: (existing.reviewCount || 0) + 1,
        lastReviewedAt: new Date(),
        nextReviewAt: nextReviewAt || existing.nextReviewAt,
        updatedAt: new Date()
      })
      .where(eq(learningRecords.id, existing.id));
  } else {
    await db.insert(learningRecords).values({
      userId,
      itemType,
      itemId,
      masteryLevel,
      reviewCount: 1,
      lastReviewedAt: new Date(),
      nextReviewAt: nextReviewAt || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default: 1 day later
    });
  }
}

export async function getDueReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(learningRecords)
    .where(
      and(
        eq(learningRecords.userId, userId),
        sql`${learningRecords.nextReviewAt} <= NOW()`
      )
    )
    .orderBy(asc(learningRecords.nextReviewAt));
}

export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return {
    totalLearned: 0,
    vocabularyCount: 0,
    grammarCount: 0,
    sceneCount: 0,
    masteredCount: 0
  };
  
  const records = await db.select().from(learningRecords)
    .where(eq(learningRecords.userId, userId));
  
  return {
    totalLearned: records.length,
    vocabularyCount: records.filter(r => r.itemType === 'vocabulary').length,
    grammarCount: records.filter(r => r.itemType === 'grammar').length,
    sceneCount: records.filter(r => r.itemType === 'scene').length,
    masteredCount: records.filter(r => r.masteryLevel === 'mastered').length
  };
}

// ===== Study Session Queries =====

export async function getTodayStudySession(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await db.select().from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        sql`DATE(${studySessions.date}) = DATE(${today})`
      )
    )
    .limit(1);
  
  return result[0] || null;
}

export async function updateStudySession(
  userId: number,
  updates: {
    duration?: number;
    itemsLearned?: number;
    itemsReviewed?: number;
    exercisesCompleted?: number;
  }
) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getTodayStudySession(userId);
  
  if (existing) {
    await db.update(studySessions)
      .set({
        duration: updates.duration !== undefined ? (existing.duration || 0) + updates.duration : existing.duration,
        itemsLearned: updates.itemsLearned !== undefined ? (existing.itemsLearned || 0) + updates.itemsLearned : existing.itemsLearned,
        itemsReviewed: updates.itemsReviewed !== undefined ? (existing.itemsReviewed || 0) + updates.itemsReviewed : existing.itemsReviewed,
        exercisesCompleted: updates.exercisesCompleted !== undefined ? (existing.exercisesCompleted || 0) + updates.exercisesCompleted : existing.exercisesCompleted
      })
      .where(eq(studySessions.id, existing.id));
  } else {
    await db.insert(studySessions).values({
      userId,
      date: new Date(),
      duration: updates.duration || 0,
      itemsLearned: updates.itemsLearned || 0,
      itemsReviewed: updates.itemsReviewed || 0,
      exercisesCompleted: updates.exercisesCompleted || 0
    });
  }
}

export async function getUserStudyHistory(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await db.select().from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        sql`${studySessions.date} >= ${startDate}`
      )
    )
    .orderBy(desc(studySessions.date));
}
