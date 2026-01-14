"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_express2 = require("@trpc/server/adapters/express");

// server/_core/oauth.ts
function registerOAuthRoutes(_app) {
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const isSecure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // In development (HTTP), use "lax" since "none" requires secure
    // In production (HTTPS), use "none" for cross-origin support
    sameSite: isSecure ? "none" : "lax",
    secure: isSecure
  };
}

// server/_core/systemRouter.ts
var import_zod = require("zod");

// server/_core/notification.ts
var import_server = require("@trpc/server");

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/notification.ts
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"), 1);
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/admin.ts
var import_zod2 = require("zod");

// server/db.ts
var import_drizzle_orm = require("drizzle-orm");
var import_postgres_js = require("drizzle-orm/postgres-js");
var import_postgres = __toESM(require("postgres"), 1);

// drizzle/schema.ts
var import_pg_core = require("drizzle-orm/pg-core");
var userRoleEnum = (0, import_pg_core.pgEnum)("user_role", ["user", "admin"]);
var conversationRoleEnum = (0, import_pg_core.pgEnum)("conversation_role", ["user", "assistant"]);
var itemTypeEnum = (0, import_pg_core.pgEnum)("item_type", ["vocabulary", "grammar", "scene"]);
var itemTypeVGEnum = (0, import_pg_core.pgEnum)("item_type_vg", ["vocabulary", "grammar"]);
var masteryLevelEnum = (0, import_pg_core.pgEnum)("mastery_level", ["learning", "familiar", "mastered"]);
var jlptLevelEnum = (0, import_pg_core.pgEnum)("jlpt_level", ["N5", "N4", "N3", "N2", "N1"]);
var sourceTypeEnum = (0, import_pg_core.pgEnum)("source_type", ["web", "ai", "textbook", "anime", "drama", "other"]);
var difficultyEnum = (0, import_pg_core.pgEnum)("difficulty_level", ["beginner", "intermediate", "advanced"]);
var resourceTypeEnum = (0, import_pg_core.pgEnum)("resource_type", ["website", "api", "dataset", "dictionary"]);
var resourceCategoryEnum = (0, import_pg_core.pgEnum)("resource_category", ["vocabulary", "grammar", "listening", "reading", "comprehensive"]);
var contentTypeEnum = (0, import_pg_core.pgEnum)("content_type", ["vocabulary", "grammar", "exercise", "explanation", "dialogue"]);
var unitTypeEnum = (0, import_pg_core.pgEnum)("unit_type", ["scene", "expression", "media", "dialogue"]);
var mediaTypeEnum = (0, import_pg_core.pgEnum)("media_type", ["anime", "jpop", "movie", "drama", "novel", "manga"]);
var unitSourceTypeEnum = (0, import_pg_core.pgEnum)("unit_source_type", ["original", "anime", "jpop", "movie", "drama", "novel"]);
var expressionSourceTypeEnum = (0, import_pg_core.pgEnum)("expression_source_type", ["original", "anime", "jpop", "movie", "drama"]);
var progressStatusEnum = (0, import_pg_core.pgEnum)("progress_status", ["not_started", "in_progress", "completed", "mastered"]);
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  username: (0, import_pg_core.varchar)("username", { length: 64 }).unique(),
  email: (0, import_pg_core.varchar)("email", { length: 320 }).unique(),
  passwordHash: (0, import_pg_core.varchar)("password_hash", { length: 255 }),
  name: (0, import_pg_core.text)("name"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull(),
  lastSignedIn: (0, import_pg_core.timestamp)("last_signed_in").defaultNow().notNull()
});
var conversations = (0, import_pg_core.pgTable)("conversations", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  lastMessageAt: (0, import_pg_core.timestamp)("last_message_at").defaultNow().notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var conversationMessages = (0, import_pg_core.pgTable)("conversation_messages", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  conversationId: (0, import_pg_core.integer)("conversation_id").notNull(),
  role: conversationRoleEnum("role").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var vocabulary = (0, import_pg_core.pgTable)("vocabulary", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  expression: (0, import_pg_core.varchar)("expression", { length: 255 }).notNull(),
  reading: (0, import_pg_core.varchar)("reading", { length: 255 }).notNull(),
  romaji: (0, import_pg_core.varchar)("romaji", { length: 255 }),
  meaning: (0, import_pg_core.text)("meaning").notNull(),
  partOfSpeech: (0, import_pg_core.varchar)("part_of_speech", { length: 100 }),
  jlptLevel: jlptLevelEnum("jlpt_level").notNull(),
  difficulty: (0, import_pg_core.integer)("difficulty").default(1),
  tags: (0, import_pg_core.json)("tags").$type(),
  category: (0, import_pg_core.varchar)("category", { length: 50 }).default("standard"),
  source: (0, import_pg_core.varchar)("source", { length: 255 }),
  detailedExplanation: (0, import_pg_core.text)("detailed_explanation"),
  collocations: (0, import_pg_core.json)("collocations").$type(),
  synonyms: (0, import_pg_core.json)("synonyms").$type(),
  antonyms: (0, import_pg_core.json)("antonyms").$type(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var grammar = (0, import_pg_core.pgTable)("grammar", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  pattern: (0, import_pg_core.varchar)("pattern", { length: 255 }).notNull(),
  meaning: (0, import_pg_core.text)("meaning").notNull(),
  usage: (0, import_pg_core.text)("usage"),
  jlptLevel: jlptLevelEnum("jlpt_level").notNull(),
  difficulty: (0, import_pg_core.integer)("difficulty").default(1),
  tags: (0, import_pg_core.json)("tags").$type(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var sentences = (0, import_pg_core.pgTable)("sentences", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  japanese: (0, import_pg_core.text)("japanese").notNull(),
  reading: (0, import_pg_core.text)("reading"),
  romaji: (0, import_pg_core.text)("romaji"),
  chinese: (0, import_pg_core.text)("chinese").notNull(),
  source: (0, import_pg_core.varchar)("source", { length: 255 }),
  sourceType: sourceTypeEnum("source_type").default("other"),
  difficulty: (0, import_pg_core.integer)("difficulty").default(1),
  tags: (0, import_pg_core.json)("tags").$type(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var scenes = (0, import_pg_core.pgTable)("scenes", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  description: (0, import_pg_core.text)("description"),
  category: (0, import_pg_core.varchar)("category", { length: 100 }).notNull(),
  difficulty: difficultyEnum("difficulty").default("beginner"),
  orderIndex: (0, import_pg_core.integer)("order_index").default(0),
  content: (0, import_pg_core.json)("content").$type(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var learningProgress = (0, import_pg_core.pgTable)("learning_progress", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  itemId: (0, import_pg_core.integer)("item_id").notNull(),
  masteryLevel: masteryLevelEnum("mastery_level").default("learning").notNull(),
  reviewCount: (0, import_pg_core.integer)("review_count").default(0).notNull(),
  lastReviewedAt: (0, import_pg_core.timestamp)("last_reviewed_at"),
  nextReviewAt: (0, import_pg_core.timestamp)("next_review_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var reviewSchedule = (0, import_pg_core.pgTable)("review_schedule", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  itemId: (0, import_pg_core.integer)("item_id").notNull(),
  scheduledAt: (0, import_pg_core.timestamp)("scheduled_at").notNull(),
  completed: (0, import_pg_core.boolean)("completed").default(false).notNull(),
  completedAt: (0, import_pg_core.timestamp)("completed_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var vocabularySentences = (0, import_pg_core.pgTable)("vocabulary_sentences", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  vocabularyId: (0, import_pg_core.integer)("vocabulary_id").notNull(),
  sentenceId: (0, import_pg_core.integer)("sentence_id").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var grammarSentences = (0, import_pg_core.pgTable)("grammar_sentences", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  grammarId: (0, import_pg_core.integer)("grammar_id").notNull(),
  sentenceId: (0, import_pg_core.integer)("sentence_id").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var learningResources = (0, import_pg_core.pgTable)("learning_resources", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  url: (0, import_pg_core.varchar)("url", { length: 500 }).notNull(),
  type: resourceTypeEnum("type").notNull(),
  category: resourceCategoryEnum("category").notNull(),
  description: (0, import_pg_core.text)("description"),
  reliability: (0, import_pg_core.integer)("reliability").default(5).notNull(),
  lastUpdatedAt: (0, import_pg_core.timestamp)("last_updated_at").defaultNow().notNull(),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  metadata: (0, import_pg_core.json)("metadata").$type(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var learningCurriculum = (0, import_pg_core.pgTable)("learning_curriculum", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  level: jlptLevelEnum("level").notNull(),
  stage: (0, import_pg_core.integer)("stage").notNull(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  description: (0, import_pg_core.text)("description"),
  objectives: (0, import_pg_core.json)("objectives").$type(),
  requiredVocabularyCount: (0, import_pg_core.integer)("required_vocabulary_count").default(0),
  requiredGrammarCount: (0, import_pg_core.integer)("required_grammar_count").default(0),
  estimatedHours: (0, import_pg_core.integer)("estimated_hours").default(0),
  prerequisites: (0, import_pg_core.json)("prerequisites").$type(),
  orderIndex: (0, import_pg_core.integer)("order_index").default(0).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var aiGeneratedContent = (0, import_pg_core.pgTable)("ai_generated_content", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  prompt: (0, import_pg_core.text)("prompt").notNull(),
  generatedContent: (0, import_pg_core.json)("generated_content").notNull(),
  curriculumStageId: (0, import_pg_core.integer)("curriculum_stage_id"),
  isApproved: (0, import_pg_core.boolean)("is_approved").default(false).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var userLearningPath = (0, import_pg_core.pgTable)("user_learning_path", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull().unique(),
  currentCurriculumStageId: (0, import_pg_core.integer)("current_curriculum_stage_id"),
  completedStages: (0, import_pg_core.json)("completed_stages").$type(),
  startedAt: (0, import_pg_core.timestamp)("started_at").defaultNow().notNull(),
  lastActiveAt: (0, import_pg_core.timestamp)("last_active_at").defaultNow().notNull(),
  totalStudyHours: (0, import_pg_core.numeric)("total_study_hours", { precision: 10, scale: 2 }).default("0.00").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var userNotes = (0, import_pg_core.pgTable)("user_notes", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  itemType: itemTypeVGEnum("item_type").notNull(),
  itemId: (0, import_pg_core.integer)("item_id").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var studyRecords = (0, import_pg_core.pgTable)("study_records", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  itemType: itemTypeVGEnum("item_type").notNull(),
  itemId: (0, import_pg_core.integer)("item_id").notNull(),
  reviewCount: (0, import_pg_core.integer)("review_count").default(0).notNull(),
  easeFactor: (0, import_pg_core.numeric)("ease_factor", { precision: 3, scale: 2 }).default("2.50").notNull(),
  firstLearnedAt: (0, import_pg_core.timestamp)("first_learned_at").defaultNow().notNull(),
  lastReviewedAt: (0, import_pg_core.timestamp)("last_reviewed_at").defaultNow().notNull(),
  nextReviewAt: (0, import_pg_core.timestamp)("next_review_at").notNull(),
  correctCount: (0, import_pg_core.integer)("correct_count").default(0).notNull(),
  incorrectCount: (0, import_pg_core.integer)("incorrect_count").default(0).notNull(),
  isMastered: (0, import_pg_core.boolean)("is_mastered").default(false).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var dailyStudyStats = (0, import_pg_core.pgTable)("daily_study_stats", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  date: (0, import_pg_core.varchar)("date", { length: 10 }).notNull(),
  newItemsLearned: (0, import_pg_core.integer)("new_items_learned").default(0).notNull(),
  itemsReviewed: (0, import_pg_core.integer)("items_reviewed").default(0).notNull(),
  correctReviews: (0, import_pg_core.integer)("correct_reviews").default(0).notNull(),
  incorrectReviews: (0, import_pg_core.integer)("incorrect_reviews").default(0).notNull(),
  studyMinutes: (0, import_pg_core.integer)("study_minutes").default(0).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var learningUnits = (0, import_pg_core.pgTable)("learning_units", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  unitType: unitTypeEnum("unit_type").notNull(),
  category: (0, import_pg_core.varchar)("category", { length: 100 }).notNull(),
  subCategory: (0, import_pg_core.varchar)("sub_category", { length: 100 }),
  titleJa: (0, import_pg_core.varchar)("title_ja", { length: 255 }).notNull(),
  titleZh: (0, import_pg_core.varchar)("title_zh", { length: 255 }),
  descriptionJa: (0, import_pg_core.text)("description_ja"),
  difficulty: (0, import_pg_core.integer)("difficulty").default(1).notNull(),
  jlptLevel: jlptLevelEnum("jlpt_level"),
  targetExpressions: (0, import_pg_core.json)("target_expressions").$type(),
  targetPatterns: (0, import_pg_core.json)("target_patterns").$type(),
  targetVocabularyIds: (0, import_pg_core.json)("target_vocabulary_ids").$type(),
  targetGrammarIds: (0, import_pg_core.json)("target_grammar_ids").$type(),
  prerequisites: (0, import_pg_core.json)("prerequisites").$type(),
  relatedUnits: (0, import_pg_core.json)("related_units").$type(),
  content: (0, import_pg_core.json)("content").$type(),
  sourceType: unitSourceTypeEnum("source_type"),
  sourceTitle: (0, import_pg_core.varchar)("source_title", { length: 255 }),
  sourceYear: (0, import_pg_core.integer)("source_year"),
  sourceEpisode: (0, import_pg_core.varchar)("source_episode", { length: 100 }),
  sourceUrl: (0, import_pg_core.varchar)("source_url", { length: 500 }),
  orderIndex: (0, import_pg_core.integer)("order_index").default(0),
  isPublished: (0, import_pg_core.boolean)("is_published").default(true).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var mediaMaterials = (0, import_pg_core.pgTable)("media_materials", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  titleJa: (0, import_pg_core.varchar)("title_ja", { length: 255 }),
  artist: (0, import_pg_core.varchar)("artist", { length: 255 }),
  year: (0, import_pg_core.integer)("year"),
  episode: (0, import_pg_core.varchar)("episode", { length: 100 }),
  contentJa: (0, import_pg_core.text)("content_ja").notNull(),
  contentReading: (0, import_pg_core.text)("content_reading"),
  analysis: (0, import_pg_core.json)("analysis").$type(),
  difficulty: (0, import_pg_core.integer)("difficulty").default(5).notNull(),
  jlptLevel: jlptLevelEnum("jlpt_level"),
  tags: (0, import_pg_core.json)("tags").$type(),
  themes: (0, import_pg_core.json)("themes").$type(),
  sourceUrl: (0, import_pg_core.varchar)("source_url", { length: 500 }),
  imageUrl: (0, import_pg_core.varchar)("image_url", { length: 500 }),
  audioUrl: (0, import_pg_core.varchar)("audio_url", { length: 500 }),
  isPublished: (0, import_pg_core.boolean)("is_published").default(true).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var sceneCategories = (0, import_pg_core.pgTable)("scene_categories", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  nameJa: (0, import_pg_core.varchar)("name_ja", { length: 100 }).notNull(),
  nameZh: (0, import_pg_core.varchar)("name_zh", { length: 100 }).notNull(),
  parentId: (0, import_pg_core.integer)("parent_id"),
  descriptionJa: (0, import_pg_core.text)("description_ja"),
  descriptionZh: (0, import_pg_core.text)("description_zh"),
  icon: (0, import_pg_core.varchar)("icon", { length: 50 }),
  color: (0, import_pg_core.varchar)("color", { length: 20 }),
  minDifficulty: (0, import_pg_core.integer)("min_difficulty").default(1),
  maxDifficulty: (0, import_pg_core.integer)("max_difficulty").default(10),
  orderIndex: (0, import_pg_core.integer)("order_index").default(0),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var userUnitProgress = (0, import_pg_core.pgTable)("user_unit_progress", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  unitId: (0, import_pg_core.integer)("unit_id").notNull(),
  status: progressStatusEnum("status").default("not_started").notNull(),
  completionRate: (0, import_pg_core.integer)("completion_rate").default(0).notNull(),
  startedAt: (0, import_pg_core.timestamp)("started_at"),
  completedAt: (0, import_pg_core.timestamp)("completed_at"),
  lastAccessedAt: (0, import_pg_core.timestamp)("last_accessed_at"),
  reviewCount: (0, import_pg_core.integer)("review_count").default(0).notNull(),
  nextReviewAt: (0, import_pg_core.timestamp)("next_review_at"),
  userRating: (0, import_pg_core.integer)("user_rating"),
  userNotes: (0, import_pg_core.text)("user_notes"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var dailyLearningPlans = (0, import_pg_core.pgTable)("daily_learning_plans", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  userId: (0, import_pg_core.integer)("user_id").notNull(),
  date: (0, import_pg_core.varchar)("date", { length: 10 }).notNull(),
  plannedUnits: (0, import_pg_core.json)("planned_units").$type(),
  completedUnits: (0, import_pg_core.json)("completed_units").$type(),
  aiReasoning: (0, import_pg_core.text)("ai_reasoning"),
  totalPlannedMinutes: (0, import_pg_core.integer)("total_planned_minutes").default(0),
  actualStudyMinutes: (0, import_pg_core.integer)("actual_study_minutes").default(0),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var expressionBank = (0, import_pg_core.pgTable)("expression_bank", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  expressionJa: (0, import_pg_core.varchar)("expression_ja", { length: 500 }).notNull(),
  reading: (0, import_pg_core.varchar)("reading", { length: 500 }),
  meaningJa: (0, import_pg_core.text)("meaning_ja"),
  meaningZh: (0, import_pg_core.text)("meaning_zh"),
  functionCategory: (0, import_pg_core.varchar)("function_category", { length: 100 }).notNull(),
  situationCategory: (0, import_pg_core.varchar)("situation_category", { length: 100 }),
  difficulty: (0, import_pg_core.integer)("difficulty").default(1).notNull(),
  jlptLevel: jlptLevelEnum("jlpt_level"),
  usageNotes: (0, import_pg_core.text)("usage_notes"),
  examples: (0, import_pg_core.json)("examples").$type(),
  relatedExpressions: (0, import_pg_core.json)("related_expressions").$type(),
  relatedVocabularyIds: (0, import_pg_core.json)("related_vocabulary_ids").$type(),
  relatedGrammarIds: (0, import_pg_core.json)("related_grammar_ids").$type(),
  sourceType: expressionSourceTypeEnum("source_type"),
  sourceTitle: (0, import_pg_core.varchar)("source_title", { length: 255 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var knowledgeExpansions = (0, import_pg_core.pgTable)("knowledge_expansions", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  unitId: (0, import_pg_core.integer)("unit_id").notNull().unique(),
  content: (0, import_pg_core.json)("content").$type(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});

// server/db.ts
var _db = null;
var _client = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = (0, import_postgres.default)(process.env.DATABASE_URL);
      _db = (0, import_postgres_js.drizzle)(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}
async function createUser(data) {
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
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date(),
    lastSignedIn: /* @__PURE__ */ new Date()
  }).returning({ id: users.id });
  return result[0].id;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByUsername(username) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByEmailOrUsername(identifier) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(
    (0, import_drizzle_orm.or)(
      (0, import_drizzle_orm.eq)(users.email, identifier),
      (0, import_drizzle_orm.eq)(users.username, identifier)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserLastSignedIn(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(users.id, userId));
}
var KANA_RANGES = {
  a: { start: "\u3042", end: "\u304A" },
  ka: { start: "\u304B", end: "\u3054" },
  sa: { start: "\u3055", end: "\u305E" },
  ta: { start: "\u305F", end: "\u3069" },
  na: { start: "\u306A", end: "\u306E" },
  ha: { start: "\u306F", end: "\u307D" },
  ma: { start: "\u307E", end: "\u3082" },
  ya: { start: "\u3084", end: "\u3088" },
  ra: { start: "\u3089", end: "\u308D" },
  wa: { start: "\u308F", end: "\u3093" }
};
async function getVocabularyList(params) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (params.jlptLevel) {
    conditions.push((0, import_drizzle_orm.eq)(vocabulary.jlptLevel, params.jlptLevel));
  }
  if (params.search) {
    conditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(vocabulary.expression, `%${params.search}%`),
        (0, import_drizzle_orm.like)(vocabulary.reading, `%${params.search}%`),
        (0, import_drizzle_orm.like)(vocabulary.romaji, `%${params.search}%`),
        (0, import_drizzle_orm.like)(vocabulary.meaning, `%${params.search}%`)
      )
    );
  }
  if (params.firstLetter && KANA_RANGES[params.firstLetter]) {
    const range = KANA_RANGES[params.firstLetter];
    conditions.push(
      (0, import_drizzle_orm.and)(
        (0, import_drizzle_orm.gte)(vocabulary.reading, range.start),
        (0, import_drizzle_orm.lte)(vocabulary.reading, range.end + "\u3093")
      )
    );
  }
  const countQuery = db.select({ count: import_drizzle_orm.sql`count(*)` }).from(vocabulary).where(conditions.length > 0 ? (0, import_drizzle_orm.and)(...conditions) : void 0);
  const countResult = await countQuery;
  const total = countResult[0]?.count || 0;
  let query = db.select().from(vocabulary).where(conditions.length > 0 ? (0, import_drizzle_orm.and)(...conditions) : void 0);
  if (params.sortBy === "kana") {
    query = query.orderBy(vocabulary.reading);
  } else {
    query = query.orderBy(vocabulary.id);
  }
  query = query.limit(params.limit || 50).offset(params.offset || 0);
  const items = await query;
  return { items, total };
}
async function getVocabularyById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vocabulary).where((0, import_drizzle_orm.eq)(vocabulary.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getVocabularyByExpression(expression) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vocabulary).where((0, import_drizzle_orm.eq)(vocabulary.expression, expression)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function createVocabulary(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vocabulary).values([{
    expression: data.expression,
    reading: data.reading,
    meaning: data.meaning,
    jlptLevel: data.level,
    partOfSpeech: data.partOfSpeech,
    tags: data.tags ? [data.tags] : void 0
  }]);
  return result;
}
async function getVocabularyWithExamples(id) {
  const db = await getDb();
  if (!db) return null;
  const vocab = await getVocabularyById(id);
  if (!vocab) return null;
  const exampleLinks = await db.select().from(vocabularySentences).where((0, import_drizzle_orm.eq)(vocabularySentences.vocabularyId, id));
  const exampleIds = exampleLinks.map((link) => link.sentenceId);
  let examples = [];
  if (exampleIds.length > 0) {
    examples = await db.select().from(sentences).where((0, import_drizzle_orm.inArray)(sentences.id, exampleIds));
  }
  return {
    ...vocab,
    examples
  };
}
async function getGrammarList(params) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (params.jlptLevel) {
    conditions.push((0, import_drizzle_orm.eq)(grammar.jlptLevel, params.jlptLevel));
  }
  if (params.search) {
    conditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(grammar.pattern, `%${params.search}%`),
        (0, import_drizzle_orm.like)(grammar.meaning, `%${params.search}%`)
      )
    );
  }
  if (params.firstLetter && KANA_RANGES[params.firstLetter]) {
    const range = KANA_RANGES[params.firstLetter];
    conditions.push(
      (0, import_drizzle_orm.and)(
        (0, import_drizzle_orm.gte)(grammar.pattern, range.start),
        (0, import_drizzle_orm.lte)(grammar.pattern, range.end + "\u3093")
      )
    );
  }
  const countQuery = db.select({ count: import_drizzle_orm.sql`count(*)` }).from(grammar).where(conditions.length > 0 ? (0, import_drizzle_orm.and)(...conditions) : void 0);
  const countResult = await countQuery;
  const total = countResult[0]?.count || 0;
  let query = db.select().from(grammar).where(conditions.length > 0 ? (0, import_drizzle_orm.and)(...conditions) : void 0);
  if (params.sortBy === "kana") {
    query = query.orderBy(grammar.pattern);
  } else {
    query = query.orderBy(grammar.id);
  }
  query = query.limit(params.limit || 50).offset(params.offset || 0);
  const items = await query;
  return { items, total };
}
async function getGrammarById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(grammar).where((0, import_drizzle_orm.eq)(grammar.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getGrammarByPattern(pattern) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(grammar).where((0, import_drizzle_orm.eq)(grammar.pattern, pattern)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function createGrammar(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(grammar).values([{
    pattern: data.pattern,
    meaning: data.meaning,
    jlptLevel: data.level,
    usage: data.explanation,
    tags: data.tags ? [data.tags] : void 0
  }]);
  return result;
}
async function getGrammarWithExamples(id) {
  const db = await getDb();
  if (!db) return null;
  const grammarItem = await getGrammarById(id);
  if (!grammarItem) return null;
  const exampleLinks = await db.select().from(grammarSentences).where((0, import_drizzle_orm.eq)(grammarSentences.grammarId, id));
  const exampleIds = exampleLinks.map((link) => link.sentenceId);
  let examples = [];
  if (exampleIds.length > 0) {
    examples = await db.select().from(sentences).where((0, import_drizzle_orm.inArray)(sentences.id, exampleIds));
  }
  return {
    ...grammarItem,
    examples
  };
}
async function getSceneList() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scenes).orderBy((0, import_drizzle_orm.asc)(scenes.orderIndex));
}
async function getSceneById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(scenes).where((0, import_drizzle_orm.eq)(scenes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getUserProgress(userId, itemType, itemId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [(0, import_drizzle_orm.eq)(learningProgress.userId, userId)];
  if (itemType) {
    conditions.push((0, import_drizzle_orm.eq)(learningProgress.itemType, itemType));
  }
  if (itemId) {
    conditions.push((0, import_drizzle_orm.eq)(learningProgress.itemId, itemId));
  }
  return await db.select().from(learningProgress).where((0, import_drizzle_orm.and)(...conditions));
}
async function upsertLearningProgress(data) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(learningProgress).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(learningProgress.userId, data.userId),
      (0, import_drizzle_orm.eq)(learningProgress.itemType, data.itemType),
      (0, import_drizzle_orm.eq)(learningProgress.itemId, data.itemId)
    )
  ).limit(1);
  if (existing.length > 0) {
    const currentReviewCount = existing[0].reviewCount ?? 0;
    await db.update(learningProgress).set({
      masteryLevel: data.masteryLevel,
      reviewCount: currentReviewCount + 1,
      lastReviewedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm.eq)(learningProgress.id, existing[0].id));
  } else {
    await db.insert(learningProgress).values({
      userId: data.userId,
      itemType: data.itemType,
      itemId: data.itemId,
      masteryLevel: data.masteryLevel,
      reviewCount: 1,
      lastReviewedAt: /* @__PURE__ */ new Date()
    });
  }
}
async function getReviewSchedule(userId, limit) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reviewSchedule).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(reviewSchedule.userId, userId),
      (0, import_drizzle_orm.eq)(reviewSchedule.completed, false)
    )
  ).orderBy((0, import_drizzle_orm.asc)(reviewSchedule.scheduledAt)).limit(limit || 20);
}
async function getActiveResources(category) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [(0, import_drizzle_orm.eq)(learningResources.isActive, true)];
  if (category) {
    conditions.push((0, import_drizzle_orm.eq)(learningResources.category, category));
  }
  return await db.select().from(learningResources).where((0, import_drizzle_orm.and)(...conditions)).orderBy((0, import_drizzle_orm.desc)(learningResources.reliability));
}
async function getCurriculumByLevel(level) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(learningCurriculum).where((0, import_drizzle_orm.eq)(learningCurriculum.level, level)).orderBy((0, import_drizzle_orm.asc)(learningCurriculum.orderIndex));
}
async function getCurriculumStageById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(learningCurriculum).where((0, import_drizzle_orm.eq)(learningCurriculum.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getUserLearningPath(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userLearningPath).where((0, import_drizzle_orm.eq)(userLearningPath.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function initUserLearningPath(userId) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserLearningPath(userId);
  if (existing) return existing;
  const firstStage = await db.select().from(learningCurriculum).where((0, import_drizzle_orm.eq)(learningCurriculum.level, "N5")).orderBy((0, import_drizzle_orm.asc)(learningCurriculum.orderIndex)).limit(1);
  await db.insert(userLearningPath).values({
    userId,
    currentCurriculumStageId: firstStage.length > 0 ? firstStage[0].id : null,
    completedStages: [],
    startedAt: /* @__PURE__ */ new Date(),
    lastActiveAt: /* @__PURE__ */ new Date(),
    totalStudyHours: "0.00"
  });
  return await getUserLearningPath(userId);
}
async function getAIGeneratedContent(params) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [(0, import_drizzle_orm.eq)(aiGeneratedContent.userId, params.userId)];
  if (params.contentType) {
    conditions.push((0, import_drizzle_orm.eq)(aiGeneratedContent.contentType, params.contentType));
  }
  if (params.curriculumStageId) {
    conditions.push((0, import_drizzle_orm.eq)(aiGeneratedContent.curriculumStageId, params.curriculumStageId));
  }
  return await db.select().from(aiGeneratedContent).where((0, import_drizzle_orm.and)(...conditions)).orderBy((0, import_drizzle_orm.desc)(aiGeneratedContent.createdAt)).limit(params.limit || 10);
}
async function saveAIGeneratedContent(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aiGeneratedContent).values({
    userId: data.userId,
    contentType: data.contentType,
    prompt: data.prompt,
    generatedContent: data.generatedContent,
    curriculumStageId: data.curriculumStageId,
    isApproved: false,
    createdAt: /* @__PURE__ */ new Date()
  });
  return result;
}
async function createConversation(userId, title) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(conversations).values({
    userId,
    title,
    lastMessageAt: /* @__PURE__ */ new Date()
  }).returning({ id: conversations.id });
  return result[0].id;
}
async function getUserConversations(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(conversations).where((0, import_drizzle_orm.eq)(conversations.userId, userId)).orderBy((0, import_drizzle_orm.desc)(conversations.lastMessageAt));
}
async function getConversationMessages(conversationId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(conversationMessages).where((0, import_drizzle_orm.eq)(conversationMessages.conversationId, conversationId)).orderBy((0, import_drizzle_orm.asc)(conversationMessages.createdAt));
}
async function addMessageToConversation(conversationId, role, content) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(conversationMessages).values({
    conversationId,
    role,
    content
  });
  await db.update(conversations).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(conversations.id, conversationId));
}
async function deleteConversation(conversationId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(conversationMessages).where((0, import_drizzle_orm.eq)(conversationMessages.conversationId, conversationId));
  await db.delete(conversations).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(conversations.id, conversationId),
    (0, import_drizzle_orm.eq)(conversations.userId, userId)
  ));
}
async function updateConversationTitle(conversationId, userId, title) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set({ title }).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(conversations.id, conversationId),
    (0, import_drizzle_orm.eq)(conversations.userId, userId)
  ));
}
async function getUserNote(userId, itemType, itemId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userNotes).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(userNotes.userId, userId),
    (0, import_drizzle_orm.eq)(userNotes.itemType, itemType),
    (0, import_drizzle_orm.eq)(userNotes.itemId, itemId)
  )).limit(1);
  return result[0] || null;
}
async function upsertUserNote(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserNote(data.userId, data.itemType, data.itemId);
  if (existing) {
    await db.update(userNotes).set({ content: data.content }).where((0, import_drizzle_orm.eq)(userNotes.id, existing.id));
    return { ...existing, content: data.content };
  } else {
    const result = await db.insert(userNotes).values({
      userId: data.userId,
      itemType: data.itemType,
      itemId: data.itemId,
      content: data.content
    }).returning({ id: userNotes.id });
    return {
      id: result[0].id,
      ...data
    };
  }
}
async function deleteUserNote(userId, itemType, itemId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userNotes).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(userNotes.userId, userId),
    (0, import_drizzle_orm.eq)(userNotes.itemType, itemType),
    (0, import_drizzle_orm.eq)(userNotes.itemId, itemId)
  ));
}
var REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];
function calculateNextReviewTime(reviewCount, easeFactor = 2.5) {
  const intervalIndex = Math.min(reviewCount, REVIEW_INTERVALS.length - 1);
  const baseInterval = REVIEW_INTERVALS[intervalIndex];
  const adjustedInterval = Math.round(baseInterval * easeFactor / 2.5);
  const nextReview = /* @__PURE__ */ new Date();
  nextReview.setDate(nextReview.getDate() + adjustedInterval);
  return nextReview;
}
async function addStudyRecord(userId, itemType, itemId) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(studyRecords).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(studyRecords.userId, userId),
    (0, import_drizzle_orm.eq)(studyRecords.itemType, itemType),
    (0, import_drizzle_orm.eq)(studyRecords.itemId, itemId)
  )).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  const nextReviewAt = calculateNextReviewTime(0);
  const result = await db.insert(studyRecords).values({
    userId,
    itemType,
    itemId,
    reviewCount: 0,
    easeFactor: "2.50",
    firstLearnedAt: /* @__PURE__ */ new Date(),
    lastReviewedAt: /* @__PURE__ */ new Date(),
    nextReviewAt,
    correctCount: 0,
    incorrectCount: 0,
    isMastered: false
  }).returning({ id: studyRecords.id });
  await updateDailyStats(userId, { newItemsLearned: 1 });
  return { id: result[0].id, nextReviewAt };
}
async function getDueReviews(userId, itemType, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const now = /* @__PURE__ */ new Date();
  const conditions = [
    (0, import_drizzle_orm.eq)(studyRecords.userId, userId),
    (0, import_drizzle_orm.lte)(studyRecords.nextReviewAt, now),
    (0, import_drizzle_orm.eq)(studyRecords.isMastered, false)
  ];
  if (itemType) {
    conditions.push((0, import_drizzle_orm.eq)(studyRecords.itemType, itemType));
  }
  return await db.select().from(studyRecords).where((0, import_drizzle_orm.and)(...conditions)).orderBy((0, import_drizzle_orm.asc)(studyRecords.nextReviewAt)).limit(limit);
}
async function getStudyStats(userId) {
  const db = await getDb();
  if (!db) return null;
  const now = /* @__PURE__ */ new Date();
  const totalLearned = await db.select({ count: import_drizzle_orm.sql`count(*)` }).from(studyRecords).where((0, import_drizzle_orm.eq)(studyRecords.userId, userId));
  const dueReviews = await db.select({ count: import_drizzle_orm.sql`count(*)` }).from(studyRecords).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(studyRecords.userId, userId),
    (0, import_drizzle_orm.lte)(studyRecords.nextReviewAt, now),
    (0, import_drizzle_orm.eq)(studyRecords.isMastered, false)
  ));
  const mastered = await db.select({ count: import_drizzle_orm.sql`count(*)` }).from(studyRecords).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(studyRecords.userId, userId),
    (0, import_drizzle_orm.eq)(studyRecords.isMastered, true)
  ));
  const byType = await db.select({
    itemType: studyRecords.itemType,
    count: import_drizzle_orm.sql`count(*)`
  }).from(studyRecords).where((0, import_drizzle_orm.eq)(studyRecords.userId, userId)).groupBy(studyRecords.itemType);
  return {
    totalLearned: totalLearned[0]?.count || 0,
    dueReviews: dueReviews[0]?.count || 0,
    mastered: mastered[0]?.count || 0,
    vocabularyCount: byType.find((b) => b.itemType === "vocabulary")?.count || 0,
    grammarCount: byType.find((b) => b.itemType === "grammar")?.count || 0
  };
}
async function updateReviewResult(userId, recordId, quality) {
  const db = await getDb();
  if (!db) return null;
  const records = await db.select().from(studyRecords).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(studyRecords.id, recordId),
    (0, import_drizzle_orm.eq)(studyRecords.userId, userId)
  )).limit(1);
  if (records.length === 0) return null;
  const record = records[0];
  const isCorrect = quality >= 3;
  let newEaseFactor = parseFloat(record.easeFactor);
  if (quality < 3) {
    newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
  } else if (quality > 3) {
    newEaseFactor = Math.min(3, newEaseFactor + 0.1);
  }
  let newReviewCount = record.reviewCount;
  if (isCorrect) {
    newReviewCount = Math.min(record.reviewCount + 1, REVIEW_INTERVALS.length);
  } else {
    newReviewCount = 0;
  }
  const isMastered = newReviewCount >= REVIEW_INTERVALS.length;
  const nextReviewAt = isMastered ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3) : calculateNextReviewTime(newReviewCount, newEaseFactor);
  await db.update(studyRecords).set({
    reviewCount: newReviewCount,
    easeFactor: newEaseFactor.toFixed(2),
    lastReviewedAt: /* @__PURE__ */ new Date(),
    nextReviewAt,
    correctCount: isCorrect ? record.correctCount + 1 : record.correctCount,
    incorrectCount: isCorrect ? record.incorrectCount : record.incorrectCount + 1,
    isMastered
  }).where((0, import_drizzle_orm.eq)(studyRecords.id, recordId));
  await updateDailyStats(userId, {
    itemsReviewed: 1,
    correctReviews: isCorrect ? 1 : 0,
    incorrectReviews: isCorrect ? 0 : 1
  });
  return {
    newReviewCount,
    newEaseFactor,
    nextReviewAt,
    isMastered
  };
}
async function updateDailyStats(userId, updates) {
  const db = await getDb();
  if (!db) return;
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const existing = await db.select().from(dailyStudyStats).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(dailyStudyStats.userId, userId),
    (0, import_drizzle_orm.eq)(dailyStudyStats.date, today)
  )).limit(1);
  if (existing.length > 0) {
    await db.update(dailyStudyStats).set({
      newItemsLearned: existing[0].newItemsLearned + (updates.newItemsLearned || 0),
      itemsReviewed: existing[0].itemsReviewed + (updates.itemsReviewed || 0),
      correctReviews: existing[0].correctReviews + (updates.correctReviews || 0),
      incorrectReviews: existing[0].incorrectReviews + (updates.incorrectReviews || 0),
      studyMinutes: existing[0].studyMinutes + (updates.studyMinutes || 0)
    }).where((0, import_drizzle_orm.eq)(dailyStudyStats.id, existing[0].id));
  } else {
    await db.insert(dailyStudyStats).values({
      userId,
      date: today,
      newItemsLearned: updates.newItemsLearned || 0,
      itemsReviewed: updates.itemsReviewed || 0,
      correctReviews: updates.correctReviews || 0,
      incorrectReviews: updates.incorrectReviews || 0,
      studyMinutes: updates.studyMinutes || 0
    });
  }
}
async function getDailyStats(userId, days = 7) {
  const db = await getDb();
  if (!db) return [];
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];
  return await db.select().from(dailyStudyStats).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(dailyStudyStats.userId, userId),
    (0, import_drizzle_orm.gte)(dailyStudyStats.date, startDateStr)
  )).orderBy((0, import_drizzle_orm.desc)(dailyStudyStats.date));
}
async function isItemInStudyPlan(userId, itemType, itemId) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select({ id: studyRecords.id }).from(studyRecords).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(studyRecords.userId, userId),
    (0, import_drizzle_orm.eq)(studyRecords.itemType, itemType),
    (0, import_drizzle_orm.eq)(studyRecords.itemId, itemId)
  )).limit(1);
  return existing.length > 0;
}
async function removeFromStudyPlan(userId, itemType, itemId) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(studyRecords).where((0, import_drizzle_orm.and)(
    (0, import_drizzle_orm.eq)(studyRecords.userId, userId),
    (0, import_drizzle_orm.eq)(studyRecords.itemType, itemType),
    (0, import_drizzle_orm.eq)(studyRecords.itemId, itemId)
  ));
  return true;
}
async function getSceneCategories(parentId) {
  const db = await getDb();
  if (!db) return [];
  if (parentId !== void 0) {
    return await db.select().from(sceneCategories).where((0, import_drizzle_orm.eq)(sceneCategories.parentId, parentId)).orderBy((0, import_drizzle_orm.asc)(sceneCategories.orderIndex));
  }
  return await db.select().from(sceneCategories).orderBy((0, import_drizzle_orm.asc)(sceneCategories.orderIndex));
}
async function getLearningUnits(params) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [(0, import_drizzle_orm.eq)(learningUnits.isPublished, true)];
  if (params.category) {
    conditions.push((0, import_drizzle_orm.eq)(learningUnits.category, params.category));
  }
  if (params.subCategory) {
    conditions.push((0, import_drizzle_orm.eq)(learningUnits.subCategory, params.subCategory));
  }
  if (params.unitType) {
    conditions.push((0, import_drizzle_orm.eq)(learningUnits.unitType, params.unitType));
  }
  if (params.jlptLevel) {
    conditions.push((0, import_drizzle_orm.eq)(learningUnits.jlptLevel, params.jlptLevel));
  }
  if (params.difficulty) {
    conditions.push((0, import_drizzle_orm.eq)(learningUnits.difficulty, params.difficulty));
  }
  const [items, countResult] = await Promise.all([
    db.select().from(learningUnits).where((0, import_drizzle_orm.and)(...conditions)).orderBy((0, import_drizzle_orm.asc)(learningUnits.difficulty), (0, import_drizzle_orm.asc)(learningUnits.orderIndex)).limit(params.limit || 50).offset(params.offset || 0),
    db.select({ count: import_drizzle_orm.sql`count(*)` }).from(learningUnits).where((0, import_drizzle_orm.and)(...conditions))
  ]);
  return {
    items,
    total: countResult[0]?.count || 0
  };
}
async function getLearningUnitById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(learningUnits).where((0, import_drizzle_orm.eq)(learningUnits.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getMediaMaterials(params) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [(0, import_drizzle_orm.eq)(mediaMaterials.isPublished, true)];
  if (params.mediaType) {
    conditions.push((0, import_drizzle_orm.eq)(mediaMaterials.mediaType, params.mediaType));
  }
  if (params.jlptLevel) {
    conditions.push((0, import_drizzle_orm.eq)(mediaMaterials.jlptLevel, params.jlptLevel));
  }
  const [items, countResult] = await Promise.all([
    db.select().from(mediaMaterials).where((0, import_drizzle_orm.and)(...conditions)).orderBy((0, import_drizzle_orm.desc)(mediaMaterials.createdAt)).limit(params.limit || 50).offset(params.offset || 0),
    db.select({ count: import_drizzle_orm.sql`count(*)` }).from(mediaMaterials).where((0, import_drizzle_orm.and)(...conditions))
  ]);
  return {
    items,
    total: countResult[0]?.count || 0
  };
}
async function getMediaMaterialById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(mediaMaterials).where((0, import_drizzle_orm.eq)(mediaMaterials.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getUserUnitProgress(userId, unitId) {
  const db = await getDb();
  if (!db) return unitId ? null : [];
  if (unitId) {
    const result = await db.select().from(userUnitProgress).where(
      (0, import_drizzle_orm.and)(
        (0, import_drizzle_orm.eq)(userUnitProgress.userId, userId),
        (0, import_drizzle_orm.eq)(userUnitProgress.unitId, unitId)
      )
    ).limit(1);
    return result.length > 0 ? result[0] : null;
  }
  return await db.select().from(userUnitProgress).where((0, import_drizzle_orm.eq)(userUnitProgress.userId, userId)).orderBy((0, import_drizzle_orm.desc)(userUnitProgress.lastAccessedAt));
}
async function updateUserUnitProgress(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserUnitProgress(data.userId, data.unitId);
  if (existing && typeof existing === "object" && "id" in existing) {
    await db.update(userUnitProgress).set({
      status: data.status || existing.status,
      completionRate: data.completionRate ?? existing.completionRate,
      lastAccessedAt: /* @__PURE__ */ new Date(),
      completedAt: data.status === "completed" || data.status === "mastered" ? /* @__PURE__ */ new Date() : existing.completedAt
    }).where((0, import_drizzle_orm.eq)(userUnitProgress.id, existing.id));
  } else {
    await db.insert(userUnitProgress).values({
      userId: data.userId,
      unitId: data.unitId,
      status: data.status || "in_progress",
      completionRate: data.completionRate || 0,
      startedAt: /* @__PURE__ */ new Date(),
      lastAccessedAt: /* @__PURE__ */ new Date()
    });
  }
}
async function getDailyLearningPlan(userId, date) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dailyLearningPlans).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(dailyLearningPlans.userId, userId),
      (0, import_drizzle_orm.eq)(dailyLearningPlans.date, date)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function upsertDailyLearningPlan(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getDailyLearningPlan(data.userId, data.date);
  const totalMinutes = data.plannedUnits.reduce((sum, u) => sum + u.estimatedMinutes, 0);
  if (existing) {
    await db.update(dailyLearningPlans).set({
      plannedUnits: data.plannedUnits,
      aiReasoning: data.aiReasoning,
      totalPlannedMinutes: totalMinutes
    }).where((0, import_drizzle_orm.eq)(dailyLearningPlans.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(dailyLearningPlans).values({
      userId: data.userId,
      date: data.date,
      plannedUnits: data.plannedUnits,
      completedUnits: [],
      aiReasoning: data.aiReasoning,
      totalPlannedMinutes: totalMinutes,
      actualStudyMinutes: 0
    }).returning({ id: dailyLearningPlans.id });
    return result[0].id;
  }
}
async function getExpressions(params) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (params.functionCategory) {
    conditions.push((0, import_drizzle_orm.eq)(expressionBank.functionCategory, params.functionCategory));
  }
  if (params.situationCategory) {
    conditions.push((0, import_drizzle_orm.eq)(expressionBank.situationCategory, params.situationCategory));
  }
  if (params.jlptLevel) {
    conditions.push((0, import_drizzle_orm.eq)(expressionBank.jlptLevel, params.jlptLevel));
  }
  const whereClause = conditions.length > 0 ? (0, import_drizzle_orm.and)(...conditions) : void 0;
  const [items, countResult] = await Promise.all([
    db.select().from(expressionBank).where(whereClause).orderBy((0, import_drizzle_orm.asc)(expressionBank.difficulty)).limit(params.limit || 50).offset(params.offset || 0),
    db.select({ count: import_drizzle_orm.sql`count(*)` }).from(expressionBank).where(whereClause)
  ]);
  return {
    items,
    total: countResult[0]?.count || 0
  };
}
async function getRecommendedUnits(userId, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const completedProgress = await db.select({ unitId: userUnitProgress.unitId }).from(userUnitProgress).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(userUnitProgress.userId, userId),
      (0, import_drizzle_orm.inArray)(userUnitProgress.status, ["completed", "mastered"])
    )
  );
  const completedIds = completedProgress.map((p) => p.unitId);
  const maxDifficultyResult = await db.select({ maxDiff: import_drizzle_orm.sql`MAX(${learningUnits.difficulty})` }).from(learningUnits).innerJoin(userUnitProgress, (0, import_drizzle_orm.eq)(learningUnits.id, userUnitProgress.unitId)).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(userUnitProgress.userId, userId),
      (0, import_drizzle_orm.inArray)(userUnitProgress.status, ["completed", "mastered"])
    )
  );
  const currentMaxDifficulty = maxDifficultyResult[0]?.maxDiff || 0;
  const recommendedUnits = await db.select().from(learningUnits).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(learningUnits.isPublished, true),
      (0, import_drizzle_orm.lte)(learningUnits.difficulty, currentMaxDifficulty + 2),
      completedIds.length > 0 ? (0, import_drizzle_orm.notInArray)(learningUnits.id, completedIds) : void 0
    )
  ).orderBy((0, import_drizzle_orm.asc)(learningUnits.difficulty), (0, import_drizzle_orm.asc)(learningUnits.orderIndex)).limit(limit);
  return recommendedUnits;
}
async function getKnowledgeExpansion(unitId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(knowledgeExpansions).where((0, import_drizzle_orm.eq)(knowledgeExpansions.unitId, unitId)).limit(1);
  return result[0]?.content || null;
}
async function saveKnowledgeExpansion(unitId, content) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(knowledgeExpansions).where((0, import_drizzle_orm.eq)(knowledgeExpansions.unitId, unitId)).limit(1);
  if (existing.length > 0) {
    await db.update(knowledgeExpansions).set({ content, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(knowledgeExpansions.unitId, unitId));
  } else {
    await db.insert(knowledgeExpansions).values({
      unitId,
      content
    });
  }
  return content;
}

// server/routers/admin.ts
var adminRouter = router({
  // 批量导入词汇
  importVocabulary: protectedProcedure.input(import_zod2.z.object({
    data: import_zod2.z.array(import_zod2.z.object({
      expression: import_zod2.z.string(),
      reading: import_zod2.z.string(),
      meaning: import_zod2.z.string(),
      level: import_zod2.z.enum(["N5", "N4", "N3", "N2", "N1"]),
      partOfSpeech: import_zod2.z.string().optional(),
      tags: import_zod2.z.string().optional()
    }))
  })).mutation(async ({ ctx, input }) => {
    let success = 0;
    let failed = 0;
    const errors = [];
    for (const item of input.data) {
      try {
        const existing = await getVocabularyByExpression(item.expression);
        if (existing) {
          errors.push(`\u8BCD\u6C47 "${item.expression}" \u5DF2\u5B58\u5728,\u8DF3\u8FC7`);
          failed++;
          continue;
        }
        await createVocabulary({
          expression: item.expression,
          reading: item.reading,
          meaning: item.meaning,
          level: item.level,
          partOfSpeech: item.partOfSpeech || null,
          tags: item.tags || null
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`\u5BFC\u5165 "${item.expression}" \u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
      }
    }
    return { success, failed, errors };
  }),
  // 批量导入语法
  importGrammar: protectedProcedure.input(import_zod2.z.object({
    data: import_zod2.z.array(import_zod2.z.object({
      pattern: import_zod2.z.string(),
      meaning: import_zod2.z.string(),
      level: import_zod2.z.enum(["N5", "N4", "N3", "N2", "N1"]),
      explanation: import_zod2.z.string().optional(),
      tags: import_zod2.z.string().optional()
    }))
  })).mutation(async ({ ctx, input }) => {
    let success = 0;
    let failed = 0;
    const errors = [];
    for (const item of input.data) {
      try {
        const existing = await getGrammarByPattern(item.pattern);
        if (existing) {
          errors.push(`\u8BED\u6CD5 "${item.pattern}" \u5DF2\u5B58\u5728,\u8DF3\u8FC7`);
          failed++;
          continue;
        }
        await createGrammar({
          pattern: item.pattern,
          meaning: item.meaning,
          level: item.level,
          explanation: item.explanation || null,
          tags: item.tags || null
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`\u5BFC\u5165 "${item.pattern}" \u5931\u8D25: ${error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"}`);
      }
    }
    return { success, failed, errors };
  })
});

// server/routers.ts
var import_zod3 = require("zod");

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/messages` : "https://api.anthropic.com/v1/messages";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const systemMessages = messages.filter((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  const systemContent = systemMessages.length > 0 ? systemMessages.map((m) => typeof m.content === "string" ? m.content : JSON.stringify(m.content)).join("\n") : void 0;
  const payload = {
    model: "claude-sonnet-4-20250514",
    messages: nonSystemMessages.map(normalizeMessage),
    max_tokens: 8192
  };
  if (systemContent) {
    payload.system = systemContent;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.forgeApiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  const anthropicResponse = await response.json();
  return {
    id: anthropicResponse.id,
    created: Date.now(),
    model: anthropicResponse.model,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: anthropicResponse.content[0]?.text || "",
        tool_calls: anthropicResponse.content.filter((c) => c.type === "tool_use").map((c) => ({
          id: c.id,
          type: "function",
          function: {
            name: c.name,
            arguments: JSON.stringify(c.input)
          }
        }))
      },
      finish_reason: anthropicResponse.stop_reason
    }],
    usage: {
      prompt_tokens: anthropicResponse.usage?.input_tokens || 0,
      completion_tokens: anthropicResponse.usage?.output_tokens || 0,
      total_tokens: (anthropicResponse.usage?.input_tokens || 0) + (anthropicResponse.usage?.output_tokens || 0)
    }
  };
}

// server/_core/voiceTranscription.ts
async function transcribeAudio(options) {
  try {
    if (!ENV.forgeApiUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set"
      };
    }
    if (!ENV.forgeApiKey) {
      return {
        error: "Voice transcription service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set"
      };
    }
    let audioBuffer;
    let mimeType;
    try {
      const response2 = await fetch(options.audioUrl);
      if (!response2.ok) {
        return {
          error: "Failed to download audio file",
          code: "INVALID_FORMAT",
          details: `HTTP ${response2.status}: ${response2.statusText}`
        };
      }
      audioBuffer = Buffer.from(await response2.arrayBuffer());
      mimeType = response2.headers.get("content-type") || "audio/mpeg";
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        return {
          error: "Audio file exceeds maximum size limit",
          code: "FILE_TOO_LARGE",
          details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is 16MB`
        };
      }
    } catch (error) {
      return {
        error: "Failed to fetch audio file",
        code: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
    const formData = new FormData();
    const filename = `audio.${getFileExtension(mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", audioBlob, filename);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    const prompt = options.prompt || (options.language ? `Transcribe the user's voice to text, the user's working language is ${getLanguageName(options.language)}` : "Transcribe the user's voice to text");
    formData.append("prompt", prompt);
    const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL(
      "v1/audio/transcriptions",
      baseUrl
    ).toString();
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "Accept-Encoding": "identity"
      },
      body: formData
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Transcription service request failed",
        code: "TRANSCRIPTION_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
      };
    }
    const whisperResponse = await response.json();
    if (!whisperResponse.text || typeof whisperResponse.text !== "string") {
      return {
        error: "Invalid transcription response",
        code: "SERVICE_ERROR",
        details: "Transcription service returned an invalid response format"
      };
    }
    return whisperResponse;
  } catch (error) {
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}
function getFileExtension(mimeType) {
  const mimeToExt = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a"
  };
  return mimeToExt[mimeType] || "audio";
}
function getLanguageName(langCode) {
  const langMap = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "nl": "Dutch",
    "pl": "Polish",
    "tr": "Turkish",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish"
  };
  return langMap[langCode] || langCode;
}

// server/slangUpdater.ts
var import_drizzle_orm2 = require("drizzle-orm");
async function extractSlangWordsFromText(searchResults) {
  const prompt = `\u4F60\u662F\u4E00\u4E2A\u65E5\u8BED\u7F51\u7EDC\u70ED\u8BCD\u4E13\u5BB6\u3002\u8BF7\u4ECE\u4EE5\u4E0B\u641C\u7D22\u7ED3\u679C\u4E2D\u63D0\u53D610-15\u4E2A2024-2025\u5E74\u6700\u65B0\u7684\u65E5\u8BED\u7F51\u7EDC\u70ED\u8BCD\u3002

\u641C\u7D22\u7ED3\u679C:
${searchResults}

\u8981\u6C42:
1. \u53EA\u63D0\u53D6\u771F\u5B9E\u5B58\u5728\u7684\u7F51\u7EDC\u70ED\u8BCD,\u4E0D\u8981\u7F16\u9020
2. \u786E\u4FDD\u8FD4\u56DE\u7684\u70ED\u8BCD\u5217\u8868\u4E2D\u6CA1\u6709\u91CD\u590D\u7684expression
3. \u6BCF\u4E2A\u70ED\u8BCD\u5FC5\u987B\u5305\u542B:
   - expression: \u65E5\u6587\u8868\u8FBE
   - reading: \u5047\u540D\u8BFB\u97F3
   - romaji: \u7F57\u9A6C\u97F3
   - meaning: \u7B80\u77ED\u7684\u4E2D\u6587\u91CA\u4E49(20\u5B57\u4EE5\u5185)
   - detailedExplanation: \u8BE6\u7EC6\u89E3\u91CA,\u5305\u62EC\u6765\u6E90\u3001\u7528\u6CD5\u3001\u4F7F\u7528\u573A\u666F(100-200\u5B57)
   - source: \u6765\u6E90(\u5982"Twitter"\u3001"\u30CB\u30B3\u30CB\u30B3\u52D5\u753B"\u3001"2ch"\u7B49)
   - partOfSpeech: \u8BCD\u6027(\u540D\u8BCD/\u52A8\u8BCD/\u5F62\u5BB9\u8BCD/\u611F\u53F9\u8BCD/\u7F51\u7EDC\u7528\u8BED)
   - examples: 2-3\u4E2A\u771F\u5B9E\u7684\u4F7F\u7528\u4F8B\u53E5,\u6BCF\u4E2A\u4F8B\u53E5\u5305\u542Bjapanese\u3001reading\u3001romaji\u3001chinese

\u8BF7\u4EE5JSON\u6570\u7EC4\u683C\u5F0F\u8FD4\u56DE,\u786E\u4FDD\u6240\u6709\u5B57\u6BB5\u90FD\u586B\u5199\u5B8C\u6574\u3002`;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u65E5\u8BED\u7F51\u7EDC\u70ED\u8BCD\u5206\u6790\u4E13\u5BB6,\u64C5\u957F\u4ECE\u7F51\u7EDC\u8D44\u6599\u4E2D\u63D0\u53D6\u548C\u6574\u7406\u6D41\u884C\u8BED\u4FE1\u606F\u3002" },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "slang_words",
          strict: true,
          schema: {
            type: "object",
            properties: {
              words: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    expression: { type: "string" },
                    reading: { type: "string" },
                    romaji: { type: "string" },
                    meaning: { type: "string" },
                    detailedExplanation: { type: "string" },
                    source: { type: "string" },
                    partOfSpeech: { type: "string" },
                    examples: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          japanese: { type: "string" },
                          reading: { type: "string" },
                          romaji: { type: "string" },
                          chinese: { type: "string" }
                        },
                        required: ["japanese", "reading", "romaji", "chinese"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["expression", "reading", "romaji", "meaning", "detailedExplanation", "source", "partOfSpeech", "examples"],
                  additionalProperties: false
                }
              }
            },
            required: ["words"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("LLM\u8FD4\u56DE\u7A7A\u5185\u5BB9\u6216\u683C\u5F0F\u9519\u8BEF");
    }
    const parsed = JSON.parse(content);
    return parsed.words || [];
  } catch (error) {
    console.error("\u63D0\u53D6\u70ED\u8BCD\u5931\u8D25:", error);
    return [];
  }
}
async function searchLatestSlang() {
  return `
2024-2025\u5E74\u65E5\u8BED\u7F51\u7EDC\u70ED\u8BCD(\u7EAF\u7F51\u7EDC\u6D41\u884C\u8BED,\u975E\u6807\u51C6\u8BCD\u6C47):

1. \u30EF\u30F3\u30C1\u30E3\u30F3 - \u201Cone chance\u201D\u7684\u7F29\u7565,\u8868\u793A\u201C\u6709\u4E00\u4E1D\u53EF\u80FD\u201D\u3001\u201C\u8BF4\u4E0D\u5B9A\u201D
2. \u30A8\u30E2\u3044 - \u201Cemotional\u201D\u7684\u7F29\u7565,\u5F62\u5BB9\u4EE4\u4EBA\u611F\u52A8\u3001\u6709\u60C5\u7EEA\u7684
3. \u30D0\u30BA\u308B - \u201Cbuzz\u201D\u7684\u52A8\u8BCD\u5F62\u5F0F,\u8868\u793A\u201C\u8D70\u7EA2\u201D\u3001\u201C\u70ED\u8BAE\u201D
4. \u3050\u3089\u3044 - \u8868\u793A\u7A0B\u5EA6\u7684\u53E3\u8BED\u8BF4\u6CD5,\u76F8\u5F53\u4E8E\u201C\u5DE6\u53F3\u201D\u3001\u201C\u5DE6\u53F3\u201D
5. \u3070\u3048\u308B - \u201Cgo viral\u201D\u7684\u65E5\u8BED\u5316,\u8868\u793A\u201C\u75AF\u4F20\u201D
6. \u30AC\u30C1 - \u8868\u793A\u201C\u771F\u7684\u201D\u3001\u201C\u8BA4\u771F\u7684\u201D\u3001\u201C\u5F7B\u5E95\u7684\u201D
7. \u3084\u3070\u3044 - \u8868\u793A\u201C\u5389\u5BB3\u201D\u3001\u201C\u592A\u68D2\u4E86\u201D
8. \u3061\u306A - \u201C\u56E0\u4E3A\u201D\u7684\u53E3\u8BED\u7F29\u7565(\u3061\u306A\u307F\u306B)
9. \u304A\u3071 - \u201C\u5927\u4F6C\u201D\u7684\u7F51\u7EDC\u7528\u8BED
10. \u30EA\u30A2\u30B3 - \u201C\u73B0\u5145\u201D(\u73B0\u5B9E\u5145\u5B9E\u7EC4)\u7684\u7F29\u7565,\u5F62\u5BB9\u73B0\u5B9E\u751F\u6D3B\u5145\u5B9E\u7684\u4EBA
11. \u30C8\u30C3\u30E2 - \u201C\u670B\u53CB\u201D(\u53CB\u9054)\u7684\u7F51\u7EDC\u7528\u8BED
12. \u30A4\u30B1\u30DC - \u201C\u5E05\u54E5\u58F0\u4F18\u201D(\u30A4\u30B1\u30E1\u30F3\u30DC\u30A4\u30B9)\u7684\u7F29\u7565
13. \u30B5\u30D6\u30AB\u30EB - \u201C\u4E9A\u6587\u5316\u201D(subculture)\u7684\u7F51\u7EDC\u7528\u8BED
14. \u63A8\u3057\u6D3B - \u201C\u8FFD\u661F\u6D3B\u52A8\u201D,\u652F\u6301\u559C\u6B22\u7684\u5076\u50CF\u6216\u827A\u4EBA
15. \u30AA\u30BF\u30AF - \u201C\u5FA1\u5B85\u65CF\u201D\u7684\u7F29\u7565
16. \u30E1\u30F3\u30D8\u30E9 - \u201C\u7CBE\u795E\u5D29\u6E83\u201D(\u30E1\u30F3\u30BF\u30EB\u30D8\u30EB\u30B9)\u7684\u7F51\u7EDC\u7528\u8BED
17. \u30A8\u30B0\u3044 - \u201Cegregious\u201D\u7684\u7F29\u7565,\u8868\u793A\u201C\u8FC7\u5206\u201D\u3001\u201C\u592A\u8FC7\u4E86\u201D
18. \u30C1\u30EB - \u201Cchill\u201D\u7684\u65E5\u8BED\u5316,\u8868\u793A\u201C\u653E\u677E\u201D\u3001\u201C\u60A0\u95F2\u201D
`;
}
async function updateSlangWords() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("\u6570\u636E\u5E93\u8FDE\u63A5\u5931\u8D25");
    }
    const searchResults = await searchLatestSlang();
    const slangWords = await extractSlangWordsFromText(searchResults);
    if (slangWords.length === 0) {
      return {
        success: false,
        addedCount: 0,
        updatedCount: 0,
        words: [],
        error: "\u672A\u80FD\u63D0\u53D6\u5230\u70ED\u8BCD\u6570\u636E"
      };
    }
    let addedCount = 0;
    let updatedCount = 0;
    const processedWords = [];
    const uniqueWords = /* @__PURE__ */ new Map();
    for (const word of slangWords) {
      if (!uniqueWords.has(word.expression)) {
        uniqueWords.set(word.expression, word);
      }
    }
    const uniqueWordsList = Array.from(uniqueWords.values());
    for (const word of uniqueWordsList) {
      try {
        const existing = await db.select().from(vocabulary).where((0, import_drizzle_orm2.eq)(vocabulary.expression, word.expression)).limit(1);
        if (existing.length > 0) {
          if (existing[0].category !== "slang") {
            console.log(`\u8DF3\u8FC7\u4E0E\u6807\u51C6\u8BCD\u6C47\u5E93\u91CD\u590D\u7684\u8BCD: ${word.expression}`);
            continue;
          }
          await db.update(vocabulary).set({
            reading: word.reading,
            romaji: word.romaji,
            meaning: word.meaning,
            detailedExplanation: word.detailedExplanation,
            source: word.source,
            partOfSpeech: word.partOfSpeech,
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm2.eq)(vocabulary.id, existing[0].id));
          updatedCount++;
        } else {
          const [inserted] = await db.insert(vocabulary).values({
            expression: word.expression,
            reading: word.reading,
            romaji: word.romaji,
            meaning: word.meaning,
            detailedExplanation: word.detailedExplanation,
            source: word.source,
            partOfSpeech: word.partOfSpeech,
            jlptLevel: "N5",
            // 网络热词默认N5
            category: "slang",
            difficulty: 3
          }).returning({ id: vocabulary.id });
          if (inserted && word.examples && word.examples.length > 0) {
            for (const example of word.examples) {
              const [sentenceInserted] = await db.insert(sentences).values({
                japanese: example.japanese,
                reading: example.reading,
                romaji: example.romaji,
                chinese: example.chinese,
                source: word.source,
                sourceType: "web",
                difficulty: 3
              }).returning({ id: sentences.id });
              if (sentenceInserted) {
                await db.insert(vocabularySentences).values({
                  vocabularyId: inserted.id,
                  sentenceId: sentenceInserted.id
                });
              }
            }
          }
          addedCount++;
        }
        processedWords.push({
          expression: word.expression,
          meaning: word.meaning,
          source: word.source
        });
      } catch (error) {
        console.error(`\u5904\u7406\u70ED\u8BCD ${word.expression} \u5931\u8D25:`, error);
      }
    }
    return {
      success: true,
      addedCount,
      updatedCount,
      words: processedWords
    };
  } catch (error) {
    console.error("\u66F4\u65B0\u70ED\u8BCD\u5931\u8D25:", error);
    return {
      success: false,
      addedCount: 0,
      updatedCount: 0,
      words: [],
      error: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
    };
  }
}
async function getSlangUpdateStatus() {
  try {
    const db = await getDb();
    if (!db) {
      return {
        lastUpdateTime: null,
        totalSlangCount: 0
      };
    }
    const latestSlang = await db.select().from(vocabulary).where((0, import_drizzle_orm2.eq)(vocabulary.category, "slang")).orderBy(vocabulary.updatedAt).limit(1);
    const allSlang = await db.select().from(vocabulary).where((0, import_drizzle_orm2.eq)(vocabulary.category, "slang"));
    return {
      lastUpdateTime: latestSlang[0]?.updatedAt || null,
      totalSlangCount: allSlang.length
    };
  } catch (error) {
    console.error("\u83B7\u53D6\u70ED\u8BCD\u72B6\u6001\u5931\u8D25:", error);
    return {
      lastUpdateTime: null,
      totalSlangCount: 0
    };
  }
}

// server/utils/password.ts
var import_crypto = require("crypto");
var import_util = require("util");
var scryptAsync = (0, import_util.promisify)(import_crypto.scrypt);
var SALT_LENGTH = 32;
var KEY_LENGTH = 64;
async function hashPassword(password) {
  const salt = (0, import_crypto.randomBytes)(SALT_LENGTH);
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}
async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(hashHex, "hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return (0, import_crypto.timingSafeEqual)(storedKey, derivedKey);
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
var import_cookie = require("cookie");
var import_jose = require("jose");
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var AuthService = class {
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = (0, import_cookie.parse)(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a user
   */
  async createSessionToken(userId, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new import_jose.SignJWT({
      userId,
      appId: ENV.appId,
      name: options.name || ""
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { userId, appId, name } = payload;
      if (typeof userId !== "number" || !isNonEmptyString2(appId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        userId,
        appId,
        name: typeof name === "string" ? name : ""
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const user = await getUserById(session.userId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await updateUserLastSignedIn(user.id);
    return user;
  }
};
var sdk = new AuthService();

// server/routers.ts
var import_server3 = require("@trpc/server");
function extractJSON(content) {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}
var appRouter = router({
  admin: adminRouter,
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure.input(import_zod3.z.object({
      username: import_zod3.z.string().min(3).max(64),
      email: import_zod3.z.string().email().optional(),
      password: import_zod3.z.string().min(6).max(100),
      name: import_zod3.z.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const existingUsername = await getUserByUsername(input.username);
      if (existingUsername) {
        throw new import_server3.TRPCError({
          code: "CONFLICT",
          message: "\u7528\u6237\u540D\u5DF2\u5B58\u5728"
        });
      }
      if (input.email) {
        const existingEmail = await getUserByEmail(input.email);
        if (existingEmail) {
          throw new import_server3.TRPCError({
            code: "CONFLICT",
            message: "\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C"
          });
        }
      }
      const passwordHash = await hashPassword(input.password);
      const userId = await createUser({
        username: input.username,
        email: input.email,
        passwordHash,
        name: input.name
      });
      const sessionToken = await sdk.createSessionToken(userId, {
        name: input.name || input.username,
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS
      });
      return { success: true, userId };
    }),
    login: publicProcedure.input(import_zod3.z.object({
      identifier: import_zod3.z.string().min(1),
      // username or email
      password: import_zod3.z.string().min(1)
    })).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmailOrUsername(input.identifier);
      if (!user) {
        throw new import_server3.TRPCError({
          code: "UNAUTHORIZED",
          message: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF"
        });
      }
      if (!user.passwordHash) {
        throw new import_server3.TRPCError({
          code: "UNAUTHORIZED",
          message: "\u8BE5\u8D26\u6237\u672A\u8BBE\u7F6E\u5BC6\u7801"
        });
      }
      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new import_server3.TRPCError({
          code: "UNAUTHORIZED",
          message: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF"
        });
      }
      await updateUserLastSignedIn(user.id);
      const sessionToken = await sdk.createSessionToken(user.id, {
        name: user.name || user.username || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS
      });
      return { success: true, userId: user.id };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  /**
   * ============================================
   * 词汇相关路由
   * ============================================
   */
  /**
   * ============================================
   * 网络热词相关路由
   * ============================================
   */
  slang: router({
    updateSlangWords: protectedProcedure.mutation(async () => {
      return await updateSlangWords();
    }),
    getUpdateStatus: publicProcedure.query(async () => {
      return await getSlangUpdateStatus();
    })
  }),
  vocabulary: router({
    list: publicProcedure.input(import_zod3.z.object({
      jlptLevel: import_zod3.z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
      search: import_zod3.z.string().optional(),
      firstLetter: import_zod3.z.enum(["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"]).optional(),
      sortBy: import_zod3.z.enum(["default", "kana"]).optional(),
      limit: import_zod3.z.number().optional(),
      offset: import_zod3.z.number().optional()
    })).query(async ({ input }) => {
      return await getVocabularyList(input);
    }),
    getById: publicProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).query(async ({ input }) => {
      return await getVocabularyWithExamples(input.id);
    }),
    // 获取词汇笔记
    getNote: protectedProcedure.input(import_zod3.z.object({ vocabularyId: import_zod3.z.number() })).query(async ({ ctx, input }) => {
      return await getUserNote(ctx.user.id, "vocabulary", input.vocabularyId);
    }),
    // 保存词汇笔记
    saveNote: protectedProcedure.input(import_zod3.z.object({
      vocabularyId: import_zod3.z.number(),
      content: import_zod3.z.string()
    })).mutation(async ({ ctx, input }) => {
      return await upsertUserNote({
        userId: ctx.user.id,
        itemType: "vocabulary",
        itemId: input.vocabularyId,
        content: input.content
      });
    }),
    // 删除词汇笔记
    deleteNote: protectedProcedure.input(import_zod3.z.object({ vocabularyId: import_zod3.z.number() })).mutation(async ({ ctx, input }) => {
      await deleteUserNote(ctx.user.id, "vocabulary", input.vocabularyId);
      return { success: true };
    })
  }),
  /**
   * ============================================
   * 语法相关路由
   * ============================================
   */
  grammar: router({
    list: publicProcedure.input(import_zod3.z.object({
      jlptLevel: import_zod3.z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
      search: import_zod3.z.string().optional(),
      firstLetter: import_zod3.z.enum(["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"]).optional(),
      sortBy: import_zod3.z.enum(["default", "kana"]).optional(),
      limit: import_zod3.z.number().optional(),
      offset: import_zod3.z.number().optional()
    })).query(async ({ input }) => {
      return await getGrammarList(input);
    }),
    getById: publicProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).query(async ({ input }) => {
      return await getGrammarWithExamples(input.id);
    }),
    // 获取语法笔记
    getNote: protectedProcedure.input(import_zod3.z.object({ grammarId: import_zod3.z.number() })).query(async ({ ctx, input }) => {
      return await getUserNote(ctx.user.id, "grammar", input.grammarId);
    }),
    // 保存语法笔记
    saveNote: protectedProcedure.input(import_zod3.z.object({
      grammarId: import_zod3.z.number(),
      content: import_zod3.z.string()
    })).mutation(async ({ ctx, input }) => {
      return await upsertUserNote({
        userId: ctx.user.id,
        itemType: "grammar",
        itemId: input.grammarId,
        content: input.content
      });
    }),
    // 删除语法笔记
    deleteNote: protectedProcedure.input(import_zod3.z.object({ grammarId: import_zod3.z.number() })).mutation(async ({ ctx, input }) => {
      await deleteUserNote(ctx.user.id, "grammar", input.grammarId);
      return { success: true };
    })
  }),
  /**
   * ============================================
   * 场景相关路由
   * ============================================
   */
  scene: router({
    list: publicProcedure.query(async () => {
      return await getSceneList();
    }),
    getById: publicProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).query(async ({ input }) => {
      return await getSceneById(input.id);
    })
  }),
  /**
   * ============================================
   * 学习进度相关路由
   * ============================================
   */
  learning: router({
    recordProgress: protectedProcedure.input(import_zod3.z.object({
      itemType: import_zod3.z.enum(["vocabulary", "grammar", "scene"]),
      itemId: import_zod3.z.number(),
      masteryLevel: import_zod3.z.enum(["learning", "familiar", "mastered"])
    })).mutation(async ({ ctx, input }) => {
      await upsertLearningProgress({
        userId: ctx.user.id,
        itemType: input.itemType,
        itemId: input.itemId,
        masteryLevel: input.masteryLevel
      });
      return { success: true };
    }),
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getUserProgress(ctx.user.id);
      const vocabularyCount = progress.filter((p) => p.itemType === "vocabulary").length;
      const grammarCount = progress.filter((p) => p.itemType === "grammar").length;
      const sceneCount = progress.filter((p) => p.itemType === "scene").length;
      const masteredCount = progress.filter((p) => p.masteryLevel === "mastered").length;
      const familiarCount = progress.filter((p) => p.masteryLevel === "familiar").length;
      const learningCount = progress.filter((p) => p.masteryLevel === "learning").length;
      return {
        totalLearned: progress.length,
        vocabularyCount,
        grammarCount,
        sceneCount,
        masteredCount,
        familiarCount,
        learningCount,
        progress
      };
    }),
    getReviewSchedule: protectedProcedure.input(import_zod3.z.object({
      limit: import_zod3.z.number().optional()
    })).query(async ({ ctx, input }) => {
      return await getReviewSchedule(ctx.user.id, input.limit);
    })
  }),
  /**
   * ============================================
   * AI助手相关路由
   * ============================================
   */
  ai: router({
    // 生成个性化例句
    generateExamples: protectedProcedure.input(import_zod3.z.object({
      vocabularyId: import_zod3.z.number().optional(),
      grammarId: import_zod3.z.number().optional(),
      count: import_zod3.z.number().default(3)
    })).mutation(async ({ ctx, input }) => {
      let context = "";
      if (input.vocabularyId) {
        const vocab = await getVocabularyById(input.vocabularyId);
        if (vocab) {
          context = `\u8BCD\u6C47: ${vocab.expression} (${vocab.reading}) - ${vocab.meaning}`;
        }
      } else if (input.grammarId) {
        const grammar2 = await getGrammarById(input.grammarId);
        if (grammar2) {
          context = `\u8BED\u6CD5: ${grammar2.pattern} - ${grammar2.meaning}`;
        }
      }
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u6559\u5E08\u3002\u8BF7\u751F\u6210\u771F\u5B9E\u3001\u5B9E\u7528\u7684\u65E5\u8BED\u4F8B\u53E5,\u6BCF\u4E2A\u4F8B\u53E5\u90FD\u8981\u5305\u542B\u5E26\u6CE8\u97F3\u7684\u65E5\u6587\u3001\u5047\u540D\u6807\u6CE8\u548C\u4E2D\u6587\u7FFB\u8BD1\u3002"
          },
          {
            role: "user",
            content: `\u8BF7\u4E3A\u4EE5\u4E0B\u5185\u5BB9\u751F\u6210${input.count}\u4E2A\u5B9E\u7528\u4F8B\u53E5:
${context}

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE,\u683C\u5F0F\u4E3A: [{"japanese": "\u6C49\u5B57(\u5047\u540D)\u5E73\u5047\u540D\u6C49\u5B57(\u5047\u540D)", "reading": "\u5047\u540D\u6807\u6CE8", "chinese": "\u4E2D\u6587\u7FFB\u8BD1"}]

\u6CE8\u610F: japanese\u5B57\u6BB5\u4E2D\u7684\u6C49\u5B57\u5FC5\u987B\u7528\u62EC\u53F7\u6807\u6CE8\u5047\u540D,\u4F8B\u5982: \u201C\u79C1(\u308F\u305F\u3057)\u306F\u65E5\u672C\u8A9E(\u306B\u307B\u3093\u3054)\u3092\u52C9\u5F37(\u3079\u3093\u304D\u3087\u3046)\u3057\u3066\u3044\u307E\u3059\u3002\u201D`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "examples",
            strict: true,
            schema: {
              type: "object",
              properties: {
                examples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      japanese: { type: "string", description: "\u5E26\u6CE8\u97F3\u7684\u65E5\u6587,\u6C49\u5B57\u540E\u7528\u62EC\u53F7\u6807\u6CE8\u5047\u540D" },
                      reading: { type: "string", description: "\u5047\u540D\u6807\u6CE8" },
                      chinese: { type: "string", description: "\u4E2D\u6587\u7FFB\u8BD1" }
                    },
                    required: ["japanese", "reading", "chinese"],
                    additionalProperties: false
                  }
                }
              },
              required: ["examples"],
              additionalProperties: false
            }
          }
        }
      });
      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") return { examples: [] };
      const parsed = JSON.parse(extractJSON(content));
      const examples = Array.isArray(parsed) ? parsed : parsed.examples || [];
      await saveAIGeneratedContent({
        userId: ctx.user.id,
        contentType: "dialogue",
        prompt: `\u751F\u6210\u4F8B\u53E5: ${context}`,
        generatedContent: examples
      });
      return { examples };
    }),
    // 生成对话场景
    generateDialogue: protectedProcedure.input(import_zod3.z.object({
      vocabularyId: import_zod3.z.number().optional(),
      grammarId: import_zod3.z.number().optional(),
      scenario: import_zod3.z.string().optional()
    })).mutation(async ({ ctx, input }) => {
      let context = "";
      if (input.vocabularyId) {
        const vocab = await getVocabularyById(input.vocabularyId);
        if (vocab) {
          context = `\u8BCD\u6C47: ${vocab.expression} (${vocab.reading}) - ${vocab.meaning}`;
        }
      } else if (input.grammarId) {
        const grammar2 = await getGrammarById(input.grammarId);
        if (grammar2) {
          context = `\u8BED\u6CD5: ${grammar2.pattern} - ${grammar2.meaning}`;
        }
      }
      const scenarioText = input.scenario || "\u65E5\u5E38\u5BF9\u8BDD";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u6559\u5E08\u3002\u8BF7\u751F\u6210\u771F\u5B9E\u3001\u81EA\u7136\u7684\u65E5\u8BED\u5BF9\u8BDD\u573A\u666F,\u5BF9\u8BDD\u8981\u5B9E\u7528\u4E14\u7B26\u5408\u65E5\u672C\u6587\u5316\u4E60\u60EF\u3002"
          },
          {
            role: "user",
            content: `\u8BF7\u521B\u5EFA\u4E00\u4E2A${scenarioText}\u573A\u666F\u7684\u65E5\u8BED\u5BF9\u8BDD,\u5BF9\u8BDD\u4E2D\u8981\u81EA\u7136\u5730\u4F7F\u7528\u4EE5\u4E0B\u5185\u5BB9:
${context}

\u8981\u6C42:
1. \u5BF9\u8BDD\u8981\u67092-3\u4E2A\u56DE\u5408
2. \u6BCF\u53E5\u5BF9\u8BDD\u90FD\u8981\u5305\u542B\u5E26\u6CE8\u97F3\u7684\u65E5\u6587\u3001\u5047\u540D\u6807\u6CE8\u548C\u4E2D\u6587\u7FFB\u8BD1
3. \u5BF9\u8BDD\u8981\u771F\u5B9E\u3001\u81EA\u7136\u3001\u5B9E\u7528

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE,\u683C\u5F0F\u4E3A: {"title": "\u5BF9\u8BDD\u6807\u9898", "scenario": "\u573A\u666F\u63CF\u8FF0", "dialogue": [{"speaker": "\u8BF4\u8BDD\u4EBA", "japanese": "\u6C49\u5B57(\u5047\u540D)\u5E73\u5047\u540D\u6C49\u5B57(\u5047\u540D)", "reading": "\u5047\u540D", "chinese": "\u4E2D\u6587"}]}

\u6CE8\u610F: japanese\u5B57\u6BB5\u4E2D\u7684\u6C49\u5B57\u5FC5\u987B\u7528\u62EC\u53F7\u6807\u6CE8\u5047\u540D,\u4F8B\u5982: \u201C\u79C1(\u308F\u305F\u3057)\u306F\u65E5\u672C\u8A9E(\u306B\u307B\u3093\u3054)\u3092\u52C9\u5F37(\u3079\u3093\u304D\u3087\u3046)\u3057\u3066\u3044\u307E\u3059\u3002\u201D`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "dialogue",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                scenario: { type: "string" },
                dialogue: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      speaker: { type: "string", description: "\u8BF4\u8BDD\u4EBA" },
                      japanese: { type: "string", description: "\u5E26\u6CE8\u97F3\u7684\u65E5\u6587,\u6C49\u5B57\u540E\u7528\u62EC\u53F7\u6807\u6CE8\u5047\u540D" },
                      reading: { type: "string", description: "\u5047\u540D\u6807\u6CE8" },
                      chinese: { type: "string", description: "\u4E2D\u6587\u7FFB\u8BD1" }
                    },
                    required: ["speaker", "japanese", "reading", "chinese"],
                    additionalProperties: false
                  }
                }
              },
              required: ["title", "scenario", "dialogue"],
              additionalProperties: false
            }
          }
        }
      });
      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : "{}";
      const result = JSON.parse(extractJSON(contentStr));
      await saveAIGeneratedContent({
        userId: ctx.user.id,
        contentType: "dialogue",
        prompt: `\u751F\u6210\u5BF9\u8BDD\u573A\u666F: ${context}`,
        generatedContent: result
      });
      return result;
    }),
    // 解释语法点
    explainGrammar: protectedProcedure.input(import_zod3.z.object({
      grammarPoint: import_zod3.z.string(),
      question: import_zod3.z.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u6559\u5E08\u3002\u8BF7\u7528\u7B80\u5355\u6613\u61C2\u7684\u65B9\u5F0F\u89E3\u91CA\u65E5\u8BED\u8BED\u6CD5\u70B9,\u5E76\u63D0\u4F9B\u5B9E\u7528\u7684\u4F8B\u53E5\u3002"
          },
          {
            role: "user",
            content: input.question ? `\u5173\u4E8E\u65E5\u8BED\u8BED\u6CD5"${input.grammarPoint}",\u6211\u7684\u95EE\u9898\u662F:${input.question}` : `\u8BF7\u8BE6\u7EC6\u89E3\u91CA\u65E5\u8BED\u8BED\u6CD5"${input.grammarPoint}"\u7684\u7528\u6CD5\u3002`
          }
        ]
      });
      const content = response.choices[0]?.message?.content || "";
      await saveAIGeneratedContent({
        userId: ctx.user.id,
        contentType: "explanation",
        prompt: `\u89E3\u91CA\u8BED\u6CD5: ${input.grammarPoint}`,
        generatedContent: { explanation: content }
      });
      return { explanation: content };
    }),
    // 获取学习建议
    getStudyAdvice: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getUserProgress(ctx.user.id);
      const dueReviews = await getReviewSchedule(ctx.user.id);
      const userPath = await getUserLearningPath(ctx.user.id);
      const vocabularyCount = progress.filter((p) => p.itemType === "vocabulary").length;
      const grammarCount = progress.filter((p) => p.itemType === "grammar").length;
      const sceneCount = progress.filter((p) => p.itemType === "scene").length;
      const masteredCount = progress.filter((p) => p.masteryLevel === "mastered").length;
      const totalLearned = progress.length;
      let currentStageInfo = "";
      if (userPath?.currentCurriculumStageId) {
        const stage = await getCurriculumStageById(userPath.currentCurriculumStageId);
        if (stage) {
          currentStageInfo = `
\u5F53\u524D\u5B66\u4E60\u9636\u6BB5: ${stage.level} - ${stage.title}`;
        }
      }
      const resources = await getActiveResources();
      const resourceInfo = resources.length > 0 ? `

\u53EF\u7528\u5B66\u4E60\u8D44\u6E90:
${resources.slice(0, 5).map((r) => `- ${r.title} (${r.category})`).join("\n")}` : "";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u5B66\u4E60\u987E\u95EE\u3002\u6839\u636E\u5B66\u751F\u7684\u5B66\u4E60\u8FDB\u5EA6,\u63D0\u4F9B\u4E2A\u6027\u5316\u7684\u5B66\u4E60\u5EFA\u8BAE\u3002

\u4F60\u53EF\u4EE5\u53C2\u8003\u4EE5\u4E0B\u5B66\u4E60\u8D44\u6E90\u6765\u6E90:
${resources.map((r) => `- ${r.title}: ${r.url} (${r.description || ""})`).join("\n")}

\u8BF7\u57FA\u4E8E\u8FD9\u4E9B\u53EF\u9760\u7684\u8D44\u6E90\u7ED9\u51FA\u5EFA\u8BAE,\u907F\u514D\u63A8\u8350\u4E0D\u5B58\u5728\u7684\u8D44\u6E90\u3002`
          },
          {
            role: "user",
            content: `\u6211\u7684\u5B66\u4E60\u8FDB\u5EA6:
- \u5DF2\u5B66\u4E60${totalLearned}\u9879\u5185\u5BB9(\u8BCD\u6C47${vocabularyCount}\u4E2A,\u8BED\u6CD5${grammarCount}\u4E2A,\u573A\u666F${sceneCount}\u4E2A)
- \u5DF2\u638C\u63E1${masteredCount}\u9879
- \u5F53\u524D\u6709${dueReviews.length}\u9879\u5F85\u590D\u4E60${currentStageInfo}

\u8BF7\u7ED9\u6211\u4E00\u4E9B\u5177\u4F53\u7684\u5B66\u4E60\u5EFA\u8BAE,\u5305\u62EC:
1. \u4E0B\u4E00\u6B65\u5E94\u8BE5\u5B66\u4E60\u4EC0\u4E48\u5185\u5BB9
2. \u5982\u4F55\u5B89\u6392\u590D\u4E60\u8BA1\u5212
3. \u63A8\u8350\u7684\u5B66\u4E60\u8D44\u6E90(\u57FA\u4E8E\u4E0A\u8FF0\u53EF\u7528\u8D44\u6E90\u5217\u8868)`
          }
        ]
      });
      const advice = response.choices[0]?.message?.content || "";
      await saveAIGeneratedContent({
        userId: ctx.user.id,
        contentType: "explanation",
        prompt: "\u83B7\u53D6\u5B66\u4E60\u5EFA\u8BAE",
        generatedContent: { advice },
        curriculumStageId: userPath?.currentCurriculumStageId || void 0
      });
      return { advice };
    }),
    // 生成下一阶段学习内容
    generateNextStageContent: protectedProcedure.input(import_zod3.z.object({
      contentType: import_zod3.z.enum(["vocabulary", "grammar", "exercise"]),
      count: import_zod3.z.number().default(5)
    })).mutation(async ({ ctx, input }) => {
      const userPath = await getUserLearningPath(ctx.user.id);
      if (!userPath) {
        await initUserLearningPath(ctx.user.id);
      }
      const updatedPath = await getUserLearningPath(ctx.user.id);
      if (!updatedPath?.currentCurriculumStageId) {
        throw new Error("\u65E0\u6CD5\u83B7\u53D6\u5F53\u524D\u5B66\u4E60\u9636\u6BB5");
      }
      const currentStage = await getCurriculumStageById(updatedPath.currentCurriculumStageId);
      if (!currentStage) {
        throw new Error("\u5F53\u524D\u5B66\u4E60\u9636\u6BB5\u4E0D\u5B58\u5728");
      }
      const existingContent = await getAIGeneratedContent({
        userId: ctx.user.id,
        contentType: input.contentType,
        curriculumStageId: currentStage.id,
        limit: 50
      });
      const existingItems = existingContent.map((c) => JSON.stringify(c.generatedContent)).join("\n");
      let systemPrompt = "";
      let userPrompt = "";
      if (input.contentType === "vocabulary") {
        systemPrompt = "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u6559\u5E08\u3002\u8BF7\u751F\u6210\u9002\u5408\u5F53\u524D\u5B66\u4E60\u9636\u6BB5\u7684\u65E5\u8BED\u8BCD\u6C47,\u786E\u4FDD\u8BCD\u6C47\u5B9E\u7528\u4E14\u7B26\u5408JLPT\u7B49\u7EA7\u8981\u6C42\u3002";
        userPrompt = `\u5F53\u524D\u5B66\u4E60\u9636\u6BB5: ${currentStage.level} - ${currentStage.title}
\u5B66\u4E60\u76EE\u6807: ${currentStage.objectives?.join(", ") || "\u65E0"}

\u8BF7\u751F\u6210${input.count}\u4E2A\u9002\u5408\u8FD9\u4E2A\u9636\u6BB5\u7684\u65E5\u8BED\u8BCD\u6C47,\u8981\u6C42:
1. \u7B26\u5408${currentStage.level}\u7B49\u7EA7
2. \u4E0E\u5B66\u4E60\u76EE\u6807\u76F8\u5173
3. \u907F\u514D\u4E0E\u4EE5\u4E0B\u5DF2\u751F\u6210\u7684\u8BCD\u6C47\u91CD\u590D:
${existingItems || "(\u6682\u65E0)"}

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE: {"vocabulary": [{"expression": "\u65E5\u6587", "reading": "\u5047\u540D", "romaji": "\u7F57\u9A6C\u97F3", "meaning": "\u4E2D\u6587\u91CA\u4E49", "partOfSpeech": "\u8BCD\u6027"}]}`;
      } else if (input.contentType === "grammar") {
        systemPrompt = "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u6559\u5E08\u3002\u8BF7\u751F\u6210\u9002\u5408\u5F53\u524D\u5B66\u4E60\u9636\u6BB5\u7684\u65E5\u8BED\u8BED\u6CD5\u70B9,\u786E\u4FDD\u8BED\u6CD5\u5B9E\u7528\u4E14\u7B26\u5408JLPT\u7B49\u7EA7\u8981\u6C42\u3002";
        userPrompt = `\u5F53\u524D\u5B66\u4E60\u9636\u6BB5: ${currentStage.level} - ${currentStage.title}
\u5B66\u4E60\u76EE\u6807: ${currentStage.objectives?.join(", ") || "\u65E0"}

\u8BF7\u751F\u6210${input.count}\u4E2A\u9002\u5408\u8FD9\u4E2A\u9636\u6BB5\u7684\u65E5\u8BED\u8BED\u6CD5\u70B9,\u8981\u6C42:
1. \u7B26\u5408${currentStage.level}\u7B49\u7EA7
2. \u4E0E\u5B66\u4E60\u76EE\u6807\u76F8\u5173
3. \u907F\u514D\u4E0E\u4EE5\u4E0B\u5DF2\u751F\u6210\u7684\u8BED\u6CD5\u91CD\u590D:
${existingItems || "(\u6682\u65E0)"}

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE: {"grammar": [{"pattern": "\u8BED\u6CD5\u53E5\u578B", "meaning": "\u4E2D\u6587\u89E3\u91CA", "usage": "\u4F7F\u7528\u8BF4\u660E"}]}`;
      } else {
        systemPrompt = "\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u6559\u5E08\u3002\u8BF7\u751F\u6210\u9002\u5408\u5F53\u524D\u5B66\u4E60\u9636\u6BB5\u7684\u7EC3\u4E60\u9898\u3002";
        userPrompt = `\u5F53\u524D\u5B66\u4E60\u9636\u6BB5: ${currentStage.level} - ${currentStage.title}

\u8BF7\u751F\u6210${input.count}\u4E2A\u7EC3\u4E60\u9898,\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE: {"exercises": [{"question": "\u9898\u76EE", "options": ["\u9009\u98791", "\u9009\u98792", "\u9009\u98793", "\u9009\u98794"], "answer": 0, "explanation": "\u89E3\u91CA"}]}`;
      }
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("\u65E0\u6CD5\u751F\u6210\u5185\u5BB9");
      }
      const parsed = JSON.parse(extractJSON(content));
      await saveAIGeneratedContent({
        userId: ctx.user.id,
        contentType: input.contentType,
        prompt: userPrompt,
        generatedContent: parsed,
        curriculumStageId: currentStage.id
      });
      return parsed;
    }),
    // 对话练习
    chat: protectedProcedure.input(import_zod3.z.object({
      message: import_zod3.z.string(),
      context: import_zod3.z.string().optional(),
      conversationId: import_zod3.z.number().optional()
    })).mutation(async ({ ctx, input }) => {
      let convId = input.conversationId;
      if (!convId) {
        const title = input.message.substring(0, 20) + (input.message.length > 20 ? "..." : "");
        convId = await createConversation(ctx.user.id, title);
      }
      await addMessageToConversation(convId, "user", input.message);
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "\u4F60\u662F\u4E00\u4F4D\u53CB\u597D\u7684\u65E5\u8BED\u5B66\u4E60\u52A9\u624B\u3002\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\u5B66\u751F\u7684\u95EE\u9898,\u5FC5\u8981\u65F6\u63D0\u4F9B\u65E5\u8BED\u4F8B\u53E5\u3002"
          },
          {
            role: "user",
            content: input.context ? `${input.context}

\u6211\u7684\u95EE\u9898: ${input.message}` : input.message
          }
        ]
      });
      const replyContent = response.choices[0]?.message?.content;
      const reply = typeof replyContent === "string" ? replyContent : "\u62B1\u6B49,\u6211\u73B0\u5728\u65E0\u6CD5\u56DE\u7B54\u3002";
      await addMessageToConversation(convId, "assistant", reply);
      return {
        reply,
        conversationId: convId
      };
    }),
    // 获取对话列表
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return await getUserConversations(ctx.user.id);
    }),
    // 获取对话消息
    getConversationMessages: protectedProcedure.input(import_zod3.z.object({ conversationId: import_zod3.z.number() })).query(async ({ input }) => {
      return await getConversationMessages(input.conversationId);
    }),
    // 删除对话
    deleteConversation: protectedProcedure.input(import_zod3.z.object({ conversationId: import_zod3.z.number() })).mutation(async ({ ctx, input }) => {
      await deleteConversation(input.conversationId, ctx.user.id);
      return { success: true };
    }),
    // 更新对话标题
    updateConversationTitle: protectedProcedure.input(import_zod3.z.object({
      conversationId: import_zod3.z.number(),
      title: import_zod3.z.string()
    })).mutation(async ({ ctx, input }) => {
      await updateConversationTitle(input.conversationId, ctx.user.id, input.title);
      return { success: true };
    }),
    // 分析词汇/语法点
    analyzeWord: publicProcedure.input(import_zod3.z.object({
      text: import_zod3.z.string().min(1).max(50)
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u6559\u5E08\u3002\u8BF7\u5206\u6790\u7ED9\u5B9A\u7684\u65E5\u8BED\u8BCD\u6C47\u6216\u8BED\u6CD5\u70B9\uFF0C\u63D0\u4F9B\u8BE6\u7EC6\u7684\u89E3\u91CA\u3002

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE\uFF0C\u5305\u542B\u4EE5\u4E0B\u5B57\u6BB5:
- word: \u539F\u8BCD
- reading: \u5047\u540D\u8BFB\u97F3
- meaning: \u4E2D\u6587\u91CA\u4E49
- partOfSpeech: \u8BCD\u6027(\u5982"\u540D\u8BCD", "\u52A8\u8BCD", "\u5F62\u5BB9\u8BCD", "\u526F\u8BCD", "\u8BED\u6CD5\u70B9"\u7B49)
- usage: \u7528\u6CD5\u8BF4\u660E
- isGrammar: \u662F\u5426\u4E3A\u8BED\u6CD5\u70B9(boolean)
- grammarLevel: \u5982\u679C\u662F\u8BED\u6CD5\u70B9\uFF0C\u6807\u6CE8JLPT\u7EA7\u522B(N5-N1)
- grammarPattern: \u5982\u679C\u662F\u8BED\u6CD5\u70B9\uFF0C\u63D0\u4F9B\u8BED\u6CD5\u6A21\u5F0F
- examples: \u4F8B\u53E5\u6570\u7EC4\uFF0C\u6BCF\u4E2A\u5305\u542B{japanese: "\u5E26\u6CE8\u97F3\u7684\u65E5\u6587", meaning: "\u4E2D\u6587\u7FFB\u8BD1"}

\u6CE8\u610F: japanese\u5B57\u6BB5\u4E2D\u7684\u6C49\u5B57\u5FC5\u987B\u7528\u62EC\u53F7\u6807\u6CE8\u5047\u540D\uFF0C\u4F8B\u5982: "\u79C1(\u308F\u305F\u3057)\u306F\u65E5\u672C\u8A9E(\u306B\u307B\u3093\u3054)\u3092\u52C9\u5F37(\u3079\u3093\u304D\u3087\u3046)\u3057\u3066\u3044\u307E\u3059\u3002"`
          },
          {
            role: "user",
            content: `\u8BF7\u5206\u6790\u8FD9\u4E2A\u65E5\u8BED\u8BCD\u6C47/\u8BED\u6CD5: "${input.text}"`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "word_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                word: { type: "string" },
                reading: { type: "string" },
                meaning: { type: "string" },
                partOfSpeech: { type: "string" },
                usage: { type: "string" },
                isGrammar: { type: "boolean" },
                grammarLevel: { type: "string" },
                grammarPattern: { type: "string" },
                examples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      japanese: { type: "string" },
                      meaning: { type: "string" }
                    },
                    required: ["japanese", "meaning"],
                    additionalProperties: false
                  }
                }
              },
              required: ["word", "reading", "meaning", "partOfSpeech", "usage", "isGrammar", "grammarLevel", "grammarPattern", "examples"],
              additionalProperties: false
            }
          }
        }
      });
      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== "string") return null;
      try {
        return JSON.parse(extractJSON(content));
      } catch {
        return null;
      }
    }),
    // 翻译日语文本
    translate: publicProcedure.input(import_zod3.z.object({
      text: import_zod3.z.string(),
      targetLang: import_zod3.z.enum(["zh", "en"]).default("zh")
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: input.targetLang === "zh" ? "\u4F60\u662F\u4E00\u4E2A\u65E5\u8BED\u7FFB\u8BD1\u5668\u3002\u8BF7\u5C06\u8F93\u5165\u7684\u65E5\u8BED\u6587\u672C\u7FFB\u8BD1\u6210\u81EA\u7136\u6D41\u7545\u7684\u4E2D\u6587\u3002\u53EA\u8FD4\u56DE\u7FFB\u8BD1\u7ED3\u679C\uFF0C\u4E0D\u8981\u5305\u542B\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9\u3002" : "You are a Japanese translator. Please translate the input Japanese text into natural English. Only return the translation, nothing else."
          },
          {
            role: "user",
            content: input.text
          }
        ]
      });
      const content = response.choices[0]?.message?.content;
      const translation = typeof content === "string" ? content.trim() : "";
      return { translation };
    }),
    // 获取日语文本的假名读音
    getReading: publicProcedure.input(import_zod3.z.object({
      text: import_zod3.z.string()
    })).mutation(async ({ input }) => {
      const hasKanji = /[\u4e00-\u9faf\u3400-\u4dbf]/.test(input.text);
      if (!hasKanji) {
        return { reading: input.text };
      }
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "\u4F60\u662F\u4E00\u4E2A\u65E5\u8BED\u8BFB\u97F3\u8F6C\u6362\u5668\u3002\u8BF7\u5C06\u8F93\u5165\u7684\u65E5\u8BED\u6587\u672C\u8F6C\u6362\u4E3A\u7EAF\u5047\u540D\u8BFB\u97F3\u3002\u91CD\u8981\uFF1A\u5FC5\u987B\u4FDD\u7559\u539F\u6587\u4E2D\u7684\u6240\u6709\u6807\u70B9\u7B26\u53F7\uFF08\u5982\u3001\u3002\uFF1F\uFF01\u300C\u300D\u7B49\uFF09\uFF0C\u53EA\u8F6C\u6362\u6C49\u5B57\u548C\u7247\u5047\u540D\u4E3A\u5E73\u5047\u540D\u3002\u4F8B\u5982\uFF1A\u8F93\u5165\u300C\u4ECA\u9031\u306E\u571F\u66DC\u65E5\u3001\u6687\uFF1F\u300D\u5E94\u8FD4\u56DE\u300C\u3053\u3093\u3057\u3085\u3046\u306E\u3069\u3088\u3046\u3073\u3001\u3072\u307E\uFF1F\u300D\u3002"
          },
          {
            role: "user",
            content: input.text
          }
        ]
      });
      const content = response.choices[0]?.message?.content;
      const reading = typeof content === "string" ? content.trim() : input.text;
      return { reading };
    }),
    // 分析句子 - 返回翻译、重要词汇和语法知识点
    analyzeSentence: publicProcedure.input(import_zod3.z.object({
      sentence: import_zod3.z.string().min(1).max(500)
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\u4F60\u662F\u4E00\u4E2A\u65E5\u8BED\u6559\u5B66\u52A9\u624B\u3002\u8BF7\u5206\u6790\u8F93\u5165\u7684\u65E5\u8BED\u53E5\u5B50\uFF0C\u8FD4\u56DE\u4EE5\u4E0B\u4FE1\u606F\uFF1A
1. \u4E2D\u6587\u7FFB\u8BD1
2. \u91CD\u8981\u8BCD\u6C47\uFF08\u6700\u591A5\u4E2A\uFF09
3. \u8BED\u6CD5\u77E5\u8BC6\u70B9\uFF08\u6700\u591A3\u4E2A\uFF09

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
{
  "translation": "\u4E2D\u6587\u7FFB\u8BD1",
  "vocabulary": [
    {
      "word": "\u65E5\u8BED\u5355\u8BCD",
      "reading": "\u5047\u540D\u8BFB\u97F3",
      "meaning": "\u4E2D\u6587\u610F\u601D",
      "partOfSpeech": "\u8BCD\u6027"
    }
  ],
  "grammar": [
    {
      "pattern": "\u8BED\u6CD5\u6A21\u5F0F",
      "meaning": "\u8BED\u6CD5\u542B\u4E49",
      "level": "JLPT\u7EA7\u522B",
      "usage": "\u7528\u6CD5\u8BF4\u660E"
    }
  ]
}

\u53EA\u8FD4\u56DEJSON\uFF0C\u4E0D\u8981\u5305\u542B\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9\u3002`
          },
          {
            role: "user",
            content: input.sentence
          }
        ]
      });
      const content = response.choices[0]?.message?.content;
      if (typeof content !== "string") {
        return {
          translation: "\u65E0\u6CD5\u5206\u6790",
          vocabulary: [],
          grammar: []
        };
      }
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            translation: parsed.translation || "\u65E0\u6CD5\u7FFB\u8BD1",
            vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
            grammar: Array.isArray(parsed.grammar) ? parsed.grammar : []
          };
        }
      } catch (e) {
        console.error("Failed to parse sentence analysis:", e);
      }
      return {
        translation: content.trim(),
        vocabulary: [],
        grammar: []
      };
    })
  }),
  /**
   * ============================================
   * 语音识别相关路由
   * ============================================
   */
  voice: router({
    transcribe: protectedProcedure.input(import_zod3.z.object({
      audioUrl: import_zod3.z.string(),
      language: import_zod3.z.string().optional()
    })).mutation(async ({ input }) => {
      const result = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: input.language || "ja"
      });
      return result;
    })
  }),
  /**
   * ============================================
   * 学习资源管理路由
   * ============================================
   */
  resources: router({
    list: publicProcedure.input(import_zod3.z.object({
      category: import_zod3.z.string().optional()
    })).query(async ({ input }) => {
      return await getActiveResources(input.category);
    })
  }),
  /**
   * ============================================
   * 学习大纲路由
   * ============================================
   */
  curriculum: router({
    getByLevel: publicProcedure.input(import_zod3.z.object({
      level: import_zod3.z.enum(["N5", "N4", "N3", "N2", "N1"])
    })).query(async ({ input }) => {
      return await getCurriculumByLevel(input.level);
    }),
    getUserPath: protectedProcedure.query(async ({ ctx }) => {
      let path = await getUserLearningPath(ctx.user.id);
      if (!path) {
        await initUserLearningPath(ctx.user.id);
        path = await getUserLearningPath(ctx.user.id);
      }
      return path;
    })
  }),
  /**
   * ============================================
   * 艾宾浩斯复习系统路由
   * ============================================
   */
  /**
   * ============================================
   * 沉浸式场景学习系统路由
   * ============================================
   */
  immersive: router({
    // 获取场景分类列表
    getCategories: publicProcedure.input(import_zod3.z.object({
      parentId: import_zod3.z.number().optional()
    })).query(async ({ input }) => {
      return await getSceneCategories(input.parentId);
    }),
    // 获取学习单元列表
    getUnits: publicProcedure.input(import_zod3.z.object({
      category: import_zod3.z.string().optional(),
      subCategory: import_zod3.z.string().optional(),
      unitType: import_zod3.z.enum(["daily_conversation", "anime_scene", "jpop_lyrics", "movie_clip", "news_article", "business_japanese"]).optional(),
      jlptLevel: import_zod3.z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
      difficulty: import_zod3.z.number().min(1).max(10).optional(),
      limit: import_zod3.z.number().optional(),
      offset: import_zod3.z.number().optional()
    })).query(async ({ input }) => {
      return await getLearningUnits(input);
    }),
    // 获取学习单元详情
    getUnitById: publicProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).query(async ({ input }) => {
      return await getLearningUnitById(input.id);
    }),
    // 获取媒体素材列表
    getMediaMaterials: publicProcedure.input(import_zod3.z.object({
      mediaType: import_zod3.z.enum(["anime", "jpop", "movie", "drama", "variety", "news"]).optional(),
      jlptLevel: import_zod3.z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
      limit: import_zod3.z.number().optional(),
      offset: import_zod3.z.number().optional()
    })).query(async ({ input }) => {
      return await getMediaMaterials(input);
    }),
    // 获取媒体素材详情
    getMediaById: publicProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).query(async ({ input }) => {
      return await getMediaMaterialById(input.id);
    }),
    // 获取用户单元学习进度
    getUserProgress: protectedProcedure.input(import_zod3.z.object({
      unitId: import_zod3.z.number().optional()
    })).query(async ({ ctx, input }) => {
      return await getUserUnitProgress(ctx.user.id, input.unitId);
    }),
    // 更新用户单元学习进度
    updateProgress: protectedProcedure.input(import_zod3.z.object({
      unitId: import_zod3.z.number(),
      status: import_zod3.z.enum(["not_started", "in_progress", "completed", "mastered"]).optional(),
      completionRate: import_zod3.z.number().min(0).max(100).optional()
    })).mutation(async ({ ctx, input }) => {
      await updateUserUnitProgress({
        userId: ctx.user.id,
        unitId: input.unitId,
        status: input.status,
        completionRate: input.completionRate
      });
      return { success: true };
    }),
    // 获取每日学习计划
    getDailyPlan: protectedProcedure.input(import_zod3.z.object({
      date: import_zod3.z.string().optional()
      // YYYY-MM-DD format
    })).query(async ({ ctx, input }) => {
      const date = input.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      return await getDailyLearningPlan(ctx.user.id, date);
    }),
    // 生成每日学习计划 (AI驱动)
    generateDailyPlan: protectedProcedure.input(import_zod3.z.object({
      targetMinutes: import_zod3.z.number().min(10).max(120).default(30),
      focusAreas: import_zod3.z.array(import_zod3.z.string()).optional()
    })).mutation(async ({ ctx, input }) => {
      const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const userProgress = await getUserUnitProgress(ctx.user.id);
      const completedUnitIds = Array.isArray(userProgress) ? userProgress.filter((p) => p.status === "completed" || p.status === "mastered").map((p) => p.unitId) : [];
      const recommendedUnits = await getRecommendedUnits(ctx.user.id, 20);
      const dueReviews = await getDueReviews(ctx.user.id, void 0, 10);
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u5B66\u4E60\u89C4\u5212\u5E08\u3002\u8BF7\u6839\u636E\u7528\u6237\u7684\u5B66\u4E60\u8FDB\u5EA6\u548C\u76EE\u6807\uFF0C\u751F\u6210\u4ECA\u65E5\u5B66\u4E60\u8BA1\u5212\u3002

\u89C4\u5219\uFF1A
1. \u4F18\u5148\u5B89\u6392\u5F85\u590D\u4E60\u7684\u5185\u5BB9\uFF08\u827E\u5BBE\u6D69\u65AF\u590D\u4E60\uFF09
2. \u65B0\u5185\u5BB9\u5E94\u8BE5\u5FAA\u5E8F\u6E10\u8FDB\uFF0C\u96BE\u5EA6\u9002\u4E2D
3. \u6BCF\u4E2A\u5B66\u4E60\u5355\u5143\u9884\u4F305-15\u5206\u949F
4. \u603B\u65F6\u957F\u63A7\u5236\u5728\u7528\u6237\u76EE\u6807\u65F6\u95F4\u5185
5. \u8FD4\u56DEJSON\u683C\u5F0F\u7684\u8BA1\u5212`
          },
          {
            role: "user",
            content: `\u7528\u6237\u4FE1\u606F\uFF1A
- \u76EE\u6807\u5B66\u4E60\u65F6\u95F4\uFF1A${input.targetMinutes}\u5206\u949F
- \u5DF2\u5B8C\u6210\u5355\u5143\u6570\uFF1A${completedUnitIds.length}
- \u5F85\u590D\u4E60\u9879\u76EE\uFF1A${dueReviews.length}\u4E2A
- \u5173\u6CE8\u9886\u57DF\uFF1A${input.focusAreas?.join(", ") || "\u7EFC\u5408\u5B66\u4E60"}

\u53EF\u9009\u5B66\u4E60\u5355\u5143\uFF1A
${recommendedUnits.slice(0, 10).map((u) => `- ID:${u.id} \u300C${u.titleJa}\u300D \u96BE\u5EA6:${u.difficulty} \u7C7B\u578B:${u.unitType}`).join("\n")}

\u8BF7\u751F\u6210\u4ECA\u65E5\u5B66\u4E60\u8BA1\u5212\uFF0C\u8FD4\u56DEJSON\u683C\u5F0F\uFF1A
{
  "reasoning": "\u89C4\u5212\u7406\u7531",
  "units": [
    {"unitId": 1, "type": "new", "estimatedMinutes": 10, "priority": 1},
    {"unitId": 2, "type": "review", "estimatedMinutes": 5, "priority": 2}
  ]
}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "daily_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                reasoning: { type: "string" },
                units: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      unitId: { type: "integer" },
                      type: { type: "string", enum: ["new", "review"] },
                      estimatedMinutes: { type: "integer" },
                      priority: { type: "integer" }
                    },
                    required: ["unitId", "type", "estimatedMinutes", "priority"],
                    additionalProperties: false
                  }
                }
              },
              required: ["reasoning", "units"],
              additionalProperties: false
            }
          }
        }
      });
      const content = response.choices[0]?.message?.content;
      let plan = { reasoning: "", units: [] };
      try {
        plan = JSON.parse(extractJSON(typeof content === "string" ? content : "{}"));
      } catch (e) {
        console.error("Failed to parse AI response:", e);
      }
      await upsertDailyLearningPlan({
        userId: ctx.user.id,
        date,
        plannedUnits: plan.units,
        aiReasoning: plan.reasoning
      });
      return await getDailyLearningPlan(ctx.user.id, date);
    }),
    // 获取表达库
    getExpressions: publicProcedure.input(import_zod3.z.object({
      functionCategory: import_zod3.z.string().optional(),
      situationCategory: import_zod3.z.string().optional(),
      jlptLevel: import_zod3.z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
      limit: import_zod3.z.number().optional(),
      offset: import_zod3.z.number().optional()
    })).query(async ({ input }) => {
      return await getExpressions(input);
    }),
    // AI生成对话变体
    generateDialogueVariant: protectedProcedure.input(import_zod3.z.object({
      unitId: import_zod3.z.number(),
      style: import_zod3.z.enum(["casual", "polite", "formal", "slang"]).default("casual")
    })).mutation(async ({ ctx, input }) => {
      const unit = await getLearningUnitById(input.unitId);
      if (!unit) {
        throw new Error("\u5B66\u4E60\u5355\u5143\u4E0D\u5B58\u5728");
      }
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u65E5\u8BED\u5BF9\u8BDD\u751F\u6210\u5668\u3002\u8BF7\u6839\u636E\u7ED9\u5B9A\u7684\u573A\u666F\u548C\u98CE\u683C\uFF0C\u751F\u6210\u81EA\u7136\u7684\u65E5\u8BED\u5BF9\u8BDD\u53D8\u4F53\u3002

\u8981\u6C42\uFF1A
1. \u5BF9\u8BDD\u8981\u7B26\u5408\u65E5\u672C\u4EBA\u7684\u771F\u5B9E\u8868\u8FBE\u4E60\u60EF
2. \u5305\u542B\u9002\u5F53\u7684\u8BED\u6C14\u8BCD\u548C\u53E3\u8BED\u8868\u8FBE
3. \u4E3A\u6BCF\u53E5\u8BDD\u6DFB\u52A0\u5047\u540D\u6CE8\u97F3\uFF08\u6C49\u5B57\u540E\u7528\u62EC\u53F7\u6807\u6CE8\uFF09
4. \u63D0\u4F9B\u81EA\u7136\u7684\u4E2D\u6587\u7FFB\u8BD1
5. \u6807\u6CE8\u5173\u952E\u8868\u8FBE\u548C\u8BED\u6CD5\u70B9`
          },
          {
            role: "user",
            content: `\u573A\u666F\uFF1A${unit.titleJa}
\u63CF\u8FF0\uFF1A${unit.descriptionJa || ""}
\u76EE\u6807\u8868\u8FBE\uFF1A${JSON.stringify(unit.targetExpressions || [])}
\u98CE\u683C\uFF1A${input.style}

\u8BF7\u751F\u6210\u4E00\u6BB5\u65B0\u7684\u5BF9\u8BDD\u53D8\u4F53\u3002`
          }
        ]
      });
      const content = response.choices[0]?.message?.content || "";
      await saveAIGeneratedContent({
        userId: ctx.user.id,
        contentType: "dialogue",
        prompt: `\u751F\u6210\u5BF9\u8BDD\u53D8\u4F53: ${unit.titleJa} (${input.style})`,
        generatedContent: { dialogue: content }
      });
      return { dialogue: content };
    }),
    // 完成学习单元
    completeUnit: protectedProcedure.input(import_zod3.z.object({
      unitId: import_zod3.z.number(),
      score: import_zod3.z.number().min(0).max(100).optional(),
      timeSpent: import_zod3.z.number().optional()
      // 实际花费时间(分钟)
    })).mutation(async ({ ctx, input }) => {
      await updateUserUnitProgress({
        userId: ctx.user.id,
        unitId: input.unitId,
        status: "completed",
        completionRate: 100
      });
      return { success: true };
    }),
    // 获取单元知识扩展内容
    getKnowledgeExpansion: publicProcedure.input(import_zod3.z.object({
      unitId: import_zod3.z.number()
    })).query(async ({ input }) => {
      const unit = await getLearningUnitById(input.unitId);
      if (!unit) {
        throw new Error("\u5B66\u4E60\u5355\u5143\u4E0D\u5B58\u5728");
      }
      const cached = await getKnowledgeExpansion(input.unitId);
      if (cached) {
        return cached;
      }
      return null;
    }),
    // AI生成知识扩展内容
    generateKnowledgeExpansion: publicProcedure.input(import_zod3.z.object({
      unitId: import_zod3.z.number()
    })).mutation(async ({ input }) => {
      const unit = await getLearningUnitById(input.unitId);
      if (!unit) {
        throw new Error("\u5B66\u4E60\u5355\u5143\u4E0D\u5B58\u5728");
      }
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `\u4F60\u662F\u4E00\u4F4D\u7CBE\u901A\u65E5\u8BED\u8BED\u8A00\u548C\u6587\u5316\u7684\u4E13\u5BB6\u3002\u8BF7\u6839\u636E\u7ED9\u5B9A\u7684\u5B66\u4E60\u5355\u5143\u5185\u5BB9\uFF0C\u751F\u6210\u8BE6\u7EC6\u7684\u77E5\u8BC6\u6269\u5C55\u5185\u5BB9\u3002

\u8981\u6C42\uFF1A
1. \u573A\u666F\u5E94\u7528\uFF1A\u8BE6\u7EC6\u8BF4\u660E\u8FD9\u4E9B\u8868\u8FBE\u5728\u4EC0\u4E48\u573A\u666F\u4E0B\u4F7F\u7528\uFF0C\u4EE5\u53CA\u5728\u5176\u4ED6\u573A\u666F\u4E0B\u4F1A\u6709\u4EC0\u4E48\u53D8\u4F53
2. \u8BED\u8A00\u8D77\u6E90\uFF1A\u8FD9\u4E9B\u8868\u8FBE\u7684\u5386\u53F2\u6E0A\u6E90\u548C\u6F14\u53D8\u8FC7\u7A0B
3. \u53E4\u4ECA\u5BF9\u6BD4\uFF1A\u53E4\u4EE3\u65E5\u8BED\u548C\u73B0\u4EE3\u65E5\u8BED\u7684\u5DEE\u5F02\uFF0C\u8BED\u8A00\u662F\u5982\u4F55\u6F14\u53D8\u7684
4. \u6587\u5316\u80CC\u666F\uFF1A\u76F8\u5173\u7684\u65E5\u672C\u6587\u5316\u77E5\u8BC6\u548C\u793E\u4F1A\u4E60\u4FD7
5. \u5B66\u4E60\u5EFA\u8BAE\uFF1A\u5982\u4F55\u66F4\u597D\u5730\u638C\u63E1\u548C\u4F7F\u7528\u8FD9\u4E9B\u8868\u8FBE

\u91CD\u8981\u683C\u5F0F\u8981\u6C42\uFF1A
- \u6240\u6709\u65E5\u8BED\u4F8B\u53E5\u90FD\u5FC5\u987B\u63D0\u4F9B\u5BF9\u5E94\u7684\u4E2D\u6587\u7FFB\u8BD1
- \u5728\u6587\u672C\u5B57\u6BB5\u4E2D\uFF08\u5982etymology\u3001historicalDevelopment\u3001introduction\u3001content\u3001explanation\u7B49\uFF09\uFF0C\u5982\u679C\u5305\u542B\u65E5\u8BED\u5185\u5BB9\uFF0C\u8BF7\u7528 {{JP}}\u65E5\u8BED\u5185\u5BB9{{/JP}} \u6807\u8BB0\u5305\u88F9\uFF0C\u4F8B\u5982\uFF1A\u300C{{JP}}\u306F\u3058\u3081\u307E\u3057\u3066{{/JP}}\u300D\u8868\u793A\u201C\u521D\u6B21\u89C1\u9762\u201D
- \u8FD9\u6837\u53EF\u4EE5\u8BA9\u524D\u7AEF\u8BC6\u522B\u65E5\u8BED\u90E8\u5206\u5E76\u6DFB\u52A0\u4EA4\u4E92\u529F\u80FD

\u8BF7\u7528\u4E2D\u6587\u56DE\u7B54\uFF0C\u8FD4\u56DEJSON\u683C\u5F0F\u3002`
          },
          {
            role: "user",
            content: `\u5B66\u4E60\u5355\u5143\uFF1A${unit.titleJa} (${unit.titleZh})
JLPT\u7B49\u7EA7\uFF1A${unit.jlptLevel}
\u63CF\u8FF0\uFF1A${unit.descriptionJa || ""}
\u76EE\u6807\u8868\u8FBE\uFF1A${JSON.stringify(unit.targetExpressions || [])}
\u5BF9\u8BDD\u5185\u5BB9\uFF1A${JSON.stringify(unit.content?.dialogues || [])}

\u8BF7\u751F\u6210\u8BE6\u7EC6\u7684\u77E5\u8BC6\u6269\u5C55\u5185\u5BB9\u3002`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "knowledge_expansion",
            strict: true,
            schema: {
              type: "object",
              properties: {
                sceneApplications: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    mainScenes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          scene: { type: "string" },
                          description: { type: "string" },
                          example: { type: "string" },
                          exampleReading: { type: "string" },
                          exampleTranslation: { type: "string" }
                        },
                        required: ["scene", "description", "example", "exampleReading", "exampleTranslation"],
                        additionalProperties: false
                      }
                    },
                    variations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          context: { type: "string" },
                          expression: { type: "string" },
                          expressionReading: { type: "string" },
                          expressionTranslation: { type: "string" },
                          explanation: { type: "string" }
                        },
                        required: ["context", "expression", "expressionReading", "expressionTranslation", "explanation"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["title", "mainScenes", "variations"],
                  additionalProperties: false
                },
                languageOrigin: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    etymology: { type: "string" },
                    historicalDevelopment: { type: "string" },
                    keyMilestones: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          period: { type: "string" },
                          event: { type: "string" }
                        },
                        required: ["period", "event"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["title", "etymology", "historicalDevelopment", "keyMilestones"],
                  additionalProperties: false
                },
                ancientVsModern: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    introduction: { type: "string" },
                    comparisons: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          aspect: { type: "string" },
                          ancient: { type: "string" },
                          modern: { type: "string" },
                          explanation: { type: "string" }
                        },
                        required: ["aspect", "ancient", "modern", "explanation"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["title", "introduction", "comparisons"],
                  additionalProperties: false
                },
                culturalBackground: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    customs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          description: { type: "string" }
                        },
                        required: ["name", "description"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["title", "content", "customs"],
                  additionalProperties: false
                },
                learningTips: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    tips: {
                      type: "array",
                      items: { type: "string" }
                    },
                    commonMistakes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          mistake: { type: "string" },
                          correction: { type: "string" }
                        },
                        required: ["mistake", "correction"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["title", "tips", "commonMistakes"],
                  additionalProperties: false
                }
              },
              required: ["sceneApplications", "languageOrigin", "ancientVsModern", "culturalBackground", "learningTips"],
              additionalProperties: false
            }
          }
        }
      });
      const content = response.choices[0]?.message?.content;
      let expansion = null;
      try {
        expansion = JSON.parse(extractJSON(typeof content === "string" ? content : "{}"));
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        throw new Error("\u751F\u6210\u77E5\u8BC6\u6269\u5C55\u5185\u5BB9\u5931\u8D25");
      }
      const references = [
        {
          title: "Reddit r/LearnJapanese - Japanese Greetings Etymology",
          url: "https://www.reddit.com/r/LearnJapanese/comments/ulcd0m/breakdown_of_japanese_greetingsset_phrases/",
          description: "\u65E5\u8BED\u95EE\u5019\u8BED\u8BCD\u6E90\u8BE6\u7EC6\u5206\u6790"
        },
        {
          title: "Coto Academy - Japanese Study",
          url: "https://cotoacademy.com/cn/category/japanese-study/",
          description: "\u65E5\u8BED\u5B66\u4E60\u8D44\u6E90"
        },
        {
          title: "\u65E5\u8BED\u656C\u8BED\u53F2\u7814\u7A76",
          url: "https://web.dhu.edu.cn/2015/1208/c5973a138424/page.htm",
          description: "\u656C\u8BED\u53F2\u7684\u53F2\u7684\u53D8\u5316\u7684\u65B9\u5411\u6027"
        }
      ];
      const result = {
        ...expansion,
        references,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await saveKnowledgeExpansion(input.unitId, result);
      return result;
    })
  }),
  review: router({
    // 获取学习统计
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await getStudyStats(ctx.user.id);
    }),
    // 获取待复习内容
    getDueReviews: protectedProcedure.input(import_zod3.z.object({
      itemType: import_zod3.z.enum(["vocabulary", "grammar"]).optional(),
      limit: import_zod3.z.number().optional().default(50)
    })).query(async ({ ctx, input }) => {
      const records = await getDueReviews(ctx.user.id, input.itemType, input.limit);
      const enrichedRecords = await Promise.all(
        records.map(async (record) => {
          let item = null;
          if (record.itemType === "vocabulary") {
            item = await getVocabularyById(record.itemId);
          } else {
            item = await getGrammarById(record.itemId);
          }
          return { ...record, item };
        })
      );
      return enrichedRecords;
    }),
    // 添加到学习计划
    addToStudyPlan: protectedProcedure.input(import_zod3.z.object({
      itemType: import_zod3.z.enum(["vocabulary", "grammar"]),
      itemId: import_zod3.z.number()
    })).mutation(async ({ ctx, input }) => {
      return await addStudyRecord(ctx.user.id, input.itemType, input.itemId);
    }),
    // 检查是否已在学习计划中
    isInStudyPlan: protectedProcedure.input(import_zod3.z.object({
      itemType: import_zod3.z.enum(["vocabulary", "grammar"]),
      itemId: import_zod3.z.number()
    })).query(async ({ ctx, input }) => {
      return await isItemInStudyPlan(ctx.user.id, input.itemType, input.itemId);
    }),
    // 从学习计划中移除
    removeFromStudyPlan: protectedProcedure.input(import_zod3.z.object({
      itemType: import_zod3.z.enum(["vocabulary", "grammar"]),
      itemId: import_zod3.z.number()
    })).mutation(async ({ ctx, input }) => {
      return await removeFromStudyPlan(ctx.user.id, input.itemType, input.itemId);
    }),
    // 更新复习结果
    updateReviewResult: protectedProcedure.input(import_zod3.z.object({
      recordId: import_zod3.z.number(),
      quality: import_zod3.z.number().min(1).max(5)
    })).mutation(async ({ ctx, input }) => {
      return await updateReviewResult(ctx.user.id, input.recordId, input.quality);
    }),
    // 获取每日学习统计
    getDailyStats: protectedProcedure.input(import_zod3.z.object({
      days: import_zod3.z.number().optional().default(7)
    })).query(async ({ ctx, input }) => {
      return await getDailyStats(ctx.user.id, input.days);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// api/index.ts
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  (0, import_express2.createExpressMiddleware)({
    router: appRouter,
    createContext
  })
);
function handler(req, res) {
  return app(req, res);
}
