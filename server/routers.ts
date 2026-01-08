import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Vocabulary router
  vocabulary: router({
    list: publicProcedure
      .input(z.object({
        jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
        search: z.string().optional()
      }))
      .query(async ({ input }) => {
        if (input.search) {
          return await db.searchVocabulary(input.search);
        }
        if (input.jlptLevel) {
          return await db.getVocabularyByLevel(input.jlptLevel);
        }
        return [];
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const vocab = await db.getVocabularyById(input.id);
        if (!vocab) return null;
        
        const examples = await db.getVocabularyExamples(input.id);
        return { ...vocab, examples };
      }),
  }),

  // Grammar router
  grammar: router({
    list: publicProcedure
      .input(z.object({
        jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
        search: z.string().optional()
      }))
      .query(async ({ input }) => {
        if (input.search) {
          return await db.searchGrammar(input.search);
        }
        if (input.jlptLevel) {
          return await db.getGrammarByLevel(input.jlptLevel);
        }
        return [];
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const grammarPoint = await db.getGrammarById(input.id);
        if (!grammarPoint) return null;
        
        const examples = await db.getGrammarExamples(input.id);
        return { ...grammarPoint, examples };
      }),
  }),

  // Scene router
  scene: router({
    list: publicProcedure.query(async () => {
      return await db.getAllScenes();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const scene = await db.getSceneById(input.id);
        if (!scene) return null;
        
        const vocabulary = await db.getSceneVocabulary(input.id);
        const grammar = await db.getSceneGrammar(input.id);
        const examples = await db.getSceneExamples(input.id);
        
        return {
          ...scene,
          vocabulary,
          grammar,
          examples
        };
      }),
  }),

  // Learning record router
  learning: router({
    recordProgress: protectedProcedure
      .input(z.object({
        itemType: z.enum(["vocabulary", "grammar", "scene"]),
        itemId: z.number(),
        masteryLevel: z.enum(["learning", "familiar", "mastered"])
      }))
      .mutation(async ({ ctx, input }) => {
        // Calculate next review time based on Ebbinghaus forgetting curve
        const intervals = [
          20 * 60 * 1000, // 20 minutes
          60 * 60 * 1000, // 1 hour
          24 * 60 * 60 * 1000, // 1 day
          2 * 24 * 60 * 60 * 1000, // 2 days
          4 * 24 * 60 * 60 * 1000, // 4 days
          7 * 24 * 60 * 60 * 1000, // 7 days
          15 * 24 * 60 * 60 * 1000, // 15 days
          30 * 24 * 60 * 60 * 1000, // 30 days
        ];
        
        const record = await db.getUserLearningRecord(ctx.user.id, input.itemType, input.itemId);
        const reviewCount = record ? (record.reviewCount || 0) : 0;
        const intervalIndex = Math.min(reviewCount, intervals.length - 1);
        const nextReviewAt = new Date(Date.now() + intervals[intervalIndex]);
        
        await db.createOrUpdateLearningRecord(
          ctx.user.id,
          input.itemType,
          input.itemId,
          input.masteryLevel,
          nextReviewAt
        );
        
        await db.updateStudySession(ctx.user.id, {
          itemsLearned: reviewCount === 0 ? 1 : 0,
          itemsReviewed: reviewCount > 0 ? 1 : 0
        });
        
        return { success: true };
      }),
    
    getDueReviews: protectedProcedure.query(async ({ ctx }) => {
      const dueReviews = await db.getDueReviews(ctx.user.id);
      
      // Fetch full details for each review item
      const reviewsWithDetails = await Promise.all(
        dueReviews.map(async (review) => {
          let item = null;
          if (review.itemType === 'vocabulary') {
            item = await db.getVocabularyById(review.itemId);
          } else if (review.itemType === 'grammar') {
            item = await db.getGrammarById(review.itemId);
          } else if (review.itemType === 'scene') {
            item = await db.getSceneById(review.itemId);
          }
          return { ...review, item };
        })
      );
      
      return reviewsWithDetails;
    }),
    
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserProgress(ctx.user.id);
    }),
    
    getStudyHistory: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserStudyHistory(ctx.user.id, input.days);
      }),
  }),

  // AI assistant router
  ai: router({
    generateExamples: protectedProcedure
      .input(z.object({
        word: z.string(),
        level: z.enum(["N5", "N4", "N3", "N2", "N1"])
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是一位专业的日语教师。请为给定的日语词汇生成3个实用的例句,每个例句包含日文、假名标注、罗马音和中文翻译。"
            },
            {
              role: "user",
              content: `请为日语词汇"${input.word}"(JLPT ${input.level}级别)生成3个例句。`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "example_sentences",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  examples: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        japanese: { type: "string", description: "日文例句" },
                        reading: { type: "string", description: "假名标注" },
                        romaji: { type: "string", description: "罗马音" },
                        chinese: { type: "string", description: "中文翻译" }
                      },
                      required: ["japanese", "reading", "romaji", "chinese"],
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
        if (!content || typeof content !== 'string') throw new Error("Failed to generate examples");
        
        return JSON.parse(content);
      }),
    
    explainGrammar: protectedProcedure
      .input(z.object({
        grammarPoint: z.string(),
        question: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是一位专业的日语教师。请用简单易懂的方式解释日语语法点,并提供实用的例句。"
            },
            {
              role: "user",
              content: input.question 
                ? `关于日语语法"${input.grammarPoint}",我的问题是:${input.question}` 
                : `请详细解释日语语法"${input.grammarPoint}"的用法。`
            }
          ]
        });
        
        return response.choices[0]?.message?.content || "";
      }),
    
    getStudyAdvice: protectedProcedure.query(async ({ ctx }) => {
      const progress = await db.getUserProgress(ctx.user.id);
      const dueReviews = await db.getDueReviews(ctx.user.id);
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "你是一位专业的日语学习顾问。根据学生的学习进度,提供个性化的学习建议。"
          },
          {
            role: "user",
            content: `我的学习进度:已学习${progress.totalLearned}项内容(词汇${progress.vocabularyCount}个,语法${progress.grammarCount}个,场景${progress.sceneCount}个),已掌握${progress.masteredCount}项。当前有${dueReviews.length}项待复习。请给我一些学习建议。`
          }
        ]
      });
      
      return response.choices[0]?.message?.content || "";
    }),
  }),

  // Voice transcription router
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        expectedText: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: "ja"
        });
        
        if ('error' in result) {
          throw new Error(result.error);
        }
        
        // Compare with expected text if provided
        let accuracy = null;
        if (input.expectedText && result.text) {
          const expected = input.expectedText.replace(/\s/g, '');
          const actual = result.text.replace(/\s/g, '');
          const matches = expected.split('').filter((char, i) => char === actual[i]).length;
          accuracy = Math.round((matches / expected.length) * 100);
        }
        
        return {
          text: result.text,
          language: result.language,
          accuracy
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
