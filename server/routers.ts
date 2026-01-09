import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { updateSlangWords, getSlangUpdateStatus } from "./slangUpdater";

export const appRouter = router({
  admin: adminRouter,
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
    updateSlangWords: protectedProcedure
      .mutation(async () => {
        return await updateSlangWords();
      }),

    getUpdateStatus: publicProcedure
      .query(async () => {
        return await getSlangUpdateStatus();
      }),
  }),

  vocabulary: router({
    list: publicProcedure
      .input(z.object({
        jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
        search: z.string().optional(),
        firstLetter: z.enum(["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"]).optional(),
        sortBy: z.enum(["default", "kana"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getVocabularyList(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVocabularyWithExamples(input.id);
      }),

    // 获取词汇笔记
    getNote: protectedProcedure
      .input(z.object({ vocabularyId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserNote(ctx.user.id, "vocabulary", input.vocabularyId);
      }),

    // 保存词汇笔记
    saveNote: protectedProcedure
      .input(z.object({
        vocabularyId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertUserNote({
          userId: ctx.user.id,
          itemType: "vocabulary",
          itemId: input.vocabularyId,
          content: input.content,
        });
      }),

    // 删除词汇笔记
    deleteNote: protectedProcedure
      .input(z.object({ vocabularyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserNote(ctx.user.id, "vocabulary", input.vocabularyId);
        return { success: true };
      }),
  }),

  /**
   * ============================================
   * 语法相关路由
   * ============================================
   */
  grammar: router({
    list: publicProcedure
      .input(z.object({
        jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
        search: z.string().optional(),
        firstLetter: z.enum(["a", "ka", "sa", "ta", "na", "ha", "ma", "ya", "ra", "wa"]).optional(),
        sortBy: z.enum(["default", "kana"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getGrammarList(input);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getGrammarWithExamples(input.id);
      }),

    // 获取语法笔记
    getNote: protectedProcedure
      .input(z.object({ grammarId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserNote(ctx.user.id, "grammar", input.grammarId);
      }),

    // 保存语法笔记
    saveNote: protectedProcedure
      .input(z.object({
        grammarId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertUserNote({
          userId: ctx.user.id,
          itemType: "grammar",
          itemId: input.grammarId,
          content: input.content,
        });
      }),

    // 删除语法笔记
    deleteNote: protectedProcedure
      .input(z.object({ grammarId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteUserNote(ctx.user.id, "grammar", input.grammarId);
        return { success: true };
      }),
  }),

  /**
   * ============================================
   * 场景相关路由
   * ============================================
   */
  scene: router({
    list: publicProcedure.query(async () => {
      return await db.getSceneList();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSceneById(input.id);
      }),
  }),

  /**
   * ============================================
   * 学习进度相关路由
   * ============================================
   */
  learning: router({
    recordProgress: protectedProcedure
      .input(z.object({
        itemType: z.enum(["vocabulary", "grammar", "scene"]),
        itemId: z.number(),
        masteryLevel: z.enum(["learning", "familiar", "mastered"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertLearningProgress({
          userId: ctx.user.id,
          itemType: input.itemType,
          itemId: input.itemId,
          masteryLevel: input.masteryLevel,
        });
        return { success: true };
      }),

    getProgress: protectedProcedure.query(async ({ ctx }) => {
      const progress = await db.getUserProgress(ctx.user.id);
      
      // 统计各类型学习项
      const vocabularyCount = progress.filter(p => p.itemType === 'vocabulary').length;
      const grammarCount = progress.filter(p => p.itemType === 'grammar').length;
      const sceneCount = progress.filter(p => p.itemType === 'scene').length;
      const masteredCount = progress.filter(p => p.masteryLevel === 'mastered').length;
      const familiarCount = progress.filter(p => p.masteryLevel === 'familiar').length;
      const learningCount = progress.filter(p => p.masteryLevel === 'learning').length;
      
      return {
        totalLearned: progress.length,
        vocabularyCount,
        grammarCount,
        sceneCount,
        masteredCount,
        familiarCount,
        learningCount,
        progress,
      };
    }),

    getReviewSchedule: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getReviewSchedule(ctx.user.id, input.limit);
      }),
  }),

  /**
   * ============================================
   * AI助手相关路由
   * ============================================
   */
  ai: router({
    // 生成个性化例句
    generateExamples: protectedProcedure
      .input(z.object({
        vocabularyId: z.number().optional(),
        grammarId: z.number().optional(),
        count: z.number().default(3),
      }))
      .mutation(async ({ ctx, input }) => {
        let context = "";
        
        if (input.vocabularyId) {
          const vocab = await db.getVocabularyById(input.vocabularyId);
          if (vocab) {
            context = `词汇: ${vocab.expression} (${vocab.reading}) - ${vocab.meaning}`;
          }
        } else if (input.grammarId) {
          const grammar = await db.getGrammarById(input.grammarId);
          if (grammar) {
            context = `语法: ${grammar.pattern} - ${grammar.meaning}`;
          }
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是一位专业的日语教师。请生成真实、实用的日语例句,每个例句都要包含带注音的日文、假名标注和中文翻译。"
            },
            {
              role: "user",
              content: `请为以下内容生成${input.count}个实用例句:\n${context}\n\n请以JSON格式返回,格式为: [{"japanese": "汉字(假名)平假名汉字(假名)", "reading": "假名标注", "chinese": "中文翻译"}]\n\n注意: japanese字段中的汉字必须用括号标注假名,例如: “私(わたし)は日本語(にほんご)を勉強(べんきょう)しています。”`
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
                         japanese: { type: "string", description: "带注音的日文,汉字后用括号标注假名" },
                         reading: { type: "string", description: "假名标注" },
                         chinese: { type: "string", description: "中文翻译" }
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
        if (!content || typeof content !== 'string') return { examples: [] };
        
        const parsed = JSON.parse(content);
        
        // 保存AI生成的内容
        await db.saveAIGeneratedContent({
          userId: ctx.user.id,
          contentType: "dialogue",
          prompt: `生成例句: ${context}`,
          generatedContent: parsed.examples,
        });
        
        return parsed;
      }),

    // 生成对话场景
    generateDialogue: protectedProcedure
      .input(z.object({
        vocabularyId: z.number().optional(),
        grammarId: z.number().optional(),
        scenario: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let context = "";
        
        if (input.vocabularyId) {
          const vocab = await db.getVocabularyById(input.vocabularyId);
          if (vocab) {
            context = `词汇: ${vocab.expression} (${vocab.reading}) - ${vocab.meaning}`;
          }
        } else if (input.grammarId) {
          const grammar = await db.getGrammarById(input.grammarId);
          if (grammar) {
            context = `语法: ${grammar.pattern} - ${grammar.meaning}`;
          }
        }
        
        const scenarioText = input.scenario || "日常对话";
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是一位专业的日语教师。请生成真实、自然的日语对话场景,对话要实用且符合日本文化习惯。"
            },
            {
              role: "user",
              content: `请创建一个${scenarioText}场景的日语对话,对话中要自然地使用以下内容:\n${context}\n\n要求:\n1. 对话要有2-3个回合\n2. 每句对话都要包含带注音的日文、假名标注和中文翻译\n3. 对话要真实、自然、实用\n\n请以JSON格式返回,格式为: {"title": "对话标题", "scenario": "场景描述", "dialogue": [{"speaker": "说话人", "japanese": "汉字(假名)平假名汉字(假名)", "reading": "假名", "chinese": "中文"}]}\n\n注意: japanese字段中的汉字必须用括号标注假名,例如: “私(わたし)は日本語(にほんご)を勉強(べんきょう)しています。”`
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
                         speaker: { type: "string", description: "说话人" },
                         japanese: { type: "string", description: "带注音的日文,汉字后用括号标注假名" },
                         reading: { type: "string", description: "假名标注" },
                         chinese: { type: "string", description: "中文翻译" }
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
        const contentStr = typeof content === 'string' ? content : '{}';
        const result = JSON.parse(contentStr);
        
        // 保存AI生成的内容
        await db.saveAIGeneratedContent({
          userId: ctx.user.id,
          contentType: "dialogue",
          prompt: `生成对话场景: ${context}`,
          generatedContent: result,
        });
        
        return result;
      }),

    // 解释语法点
    explainGrammar: protectedProcedure
      .input(z.object({
        grammarPoint: z.string(),
        question: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
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
        
        const content = response.choices[0]?.message?.content || "";
        
        // 保存AI生成的内容
        await db.saveAIGeneratedContent({
          userId: ctx.user.id,
          contentType: "explanation",
          prompt: `解释语法: ${input.grammarPoint}`,
          generatedContent: { explanation: content },
        });
        
        return { explanation: content };
      }),
    
    // 获取学习建议
    getStudyAdvice: protectedProcedure.query(async ({ ctx }) => {
      const progress = await db.getUserProgress(ctx.user.id);
      const dueReviews = await db.getReviewSchedule(ctx.user.id);
      const userPath = await db.getUserLearningPath(ctx.user.id);
      
      // 统计各类型学习项
      const vocabularyCount = progress.filter(p => p.itemType === 'vocabulary').length;
      const grammarCount = progress.filter(p => p.itemType === 'grammar').length;
      const sceneCount = progress.filter(p => p.itemType === 'scene').length;
      const masteredCount = progress.filter(p => p.masteryLevel === 'mastered').length;
      const totalLearned = progress.length;
      
      // 获取当前学习阶段信息
      let currentStageInfo = "";
      if (userPath?.currentCurriculumStageId) {
        const stage = await db.getCurriculumStageById(userPath.currentCurriculumStageId);
        if (stage) {
          currentStageInfo = `\n当前学习阶段: ${stage.level} - ${stage.title}`;
        }
      }
      
      // 获取可用的学习资源
      const resources = await db.getActiveResources();
      const resourceInfo = resources.length > 0 
        ? `\n\n可用学习资源:\n${resources.slice(0, 5).map(r => `- ${r.title} (${r.category})`).join('\n')}`
        : "";
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `你是一位专业的日语学习顾问。根据学生的学习进度,提供个性化的学习建议。

你可以参考以下学习资源来源:
${resources.map(r => `- ${r.title}: ${r.url} (${r.description || ''})`).join('\n')}

请基于这些可靠的资源给出建议,避免推荐不存在的资源。`
          },
          {
            role: "user",
            content: `我的学习进度:
- 已学习${totalLearned}项内容(词汇${vocabularyCount}个,语法${grammarCount}个,场景${sceneCount}个)
- 已掌握${masteredCount}项
- 当前有${dueReviews.length}项待复习${currentStageInfo}

请给我一些具体的学习建议,包括:
1. 下一步应该学习什么内容
2. 如何安排复习计划
3. 推荐的学习资源(基于上述可用资源列表)`
          }
        ]
      });
      
      const advice = response.choices[0]?.message?.content || "";
      
      // 保存AI生成的建议
      await db.saveAIGeneratedContent({
        userId: ctx.user.id,
        contentType: "explanation",
        prompt: "获取学习建议",
        generatedContent: { advice },
        curriculumStageId: userPath?.currentCurriculumStageId || undefined,
      });
      
      return { advice };
    }),

    // 生成下一阶段学习内容
    generateNextStageContent: protectedProcedure
      .input(z.object({
        contentType: z.enum(["vocabulary", "grammar", "exercise"]),
        count: z.number().default(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const userPath = await db.getUserLearningPath(ctx.user.id);
        if (!userPath) {
          // 初始化用户学习路径
          await db.initUserLearningPath(ctx.user.id);
        }
        
        const updatedPath = await db.getUserLearningPath(ctx.user.id);
        if (!updatedPath?.currentCurriculumStageId) {
          throw new Error("无法获取当前学习阶段");
        }
        
        const currentStage = await db.getCurriculumStageById(updatedPath.currentCurriculumStageId);
        if (!currentStage) {
          throw new Error("当前学习阶段不存在");
        }
        
        // 获取已生成的内容,避免重复
        const existingContent = await db.getAIGeneratedContent({
          userId: ctx.user.id,
          contentType: input.contentType,
          curriculumStageId: currentStage.id,
          limit: 50,
        });
        
        const existingItems = existingContent
          .map(c => JSON.stringify(c.generatedContent))
          .join('\n');
        
        let systemPrompt = "";
        let userPrompt = "";
        
        if (input.contentType === "vocabulary") {
          systemPrompt = "你是一位专业的日语教师。请生成适合当前学习阶段的日语词汇,确保词汇实用且符合JLPT等级要求。";
          userPrompt = `当前学习阶段: ${currentStage.level} - ${currentStage.title}
学习目标: ${currentStage.objectives?.join(', ') || '无'}

请生成${input.count}个适合这个阶段的日语词汇,要求:
1. 符合${currentStage.level}等级
2. 与学习目标相关
3. 避免与以下已生成的词汇重复:
${existingItems || '(暂无)'}

请以JSON格式返回: {"vocabulary": [{"expression": "日文", "reading": "假名", "romaji": "罗马音", "meaning": "中文释义", "partOfSpeech": "词性"}]}`;
        } else if (input.contentType === "grammar") {
          systemPrompt = "你是一位专业的日语教师。请生成适合当前学习阶段的日语语法点,确保语法实用且符合JLPT等级要求。";
          userPrompt = `当前学习阶段: ${currentStage.level} - ${currentStage.title}
学习目标: ${currentStage.objectives?.join(', ') || '无'}

请生成${input.count}个适合这个阶段的日语语法点,要求:
1. 符合${currentStage.level}等级
2. 与学习目标相关
3. 避免与以下已生成的语法重复:
${existingItems || '(暂无)'}

请以JSON格式返回: {"grammar": [{"pattern": "语法句型", "meaning": "中文解释", "usage": "使用说明"}]}`;
        } else {
          systemPrompt = "你是一位专业的日语教师。请生成适合当前学习阶段的练习题。";
          userPrompt = `当前学习阶段: ${currentStage.level} - ${currentStage.title}

请生成${input.count}个练习题,以JSON格式返回: {"exercises": [{"question": "题目", "options": ["选项1", "选项2", "选项3", "选项4"], "answer": 0, "explanation": "解释"}]}`;
        }
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        });
        
        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error("无法生成内容");
        }
        const parsed = JSON.parse(content);
        
        // 保存生成的内容
        await db.saveAIGeneratedContent({
          userId: ctx.user.id,
          contentType: input.contentType,
          prompt: userPrompt,
          generatedContent: parsed,
          curriculumStageId: currentStage.id,
        });
        
        return parsed;
      }),

    // 对话练习
    chat: protectedProcedure
      .input(z.object({
        message: z.string(),
        context: z.string().optional(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 如果没有conversationId,创建新对话
        let convId = input.conversationId;
        if (!convId) {
          // 从消息中提取标题(取前20个字符)
          const title = input.message.substring(0, 20) + (input.message.length > 20 ? '...' : '');
          convId = await db.createConversation(ctx.user.id, title);
        }
        
        // 保存用户消息
        await db.addMessageToConversation(convId, "user", input.message);
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是一位友好的日语学习助手。请用中文回答学生的问题,必要时提供日语例句。"
            },
            {
              role: "user",
              content: input.context 
                ? `${input.context}\n\n我的问题: ${input.message}`
                : input.message
            }
          ]
        });
        
        const replyContent = response.choices[0]?.message?.content;
        const reply = typeof replyContent === 'string' ? replyContent : "抱歉,我现在无法回答。";
        
        // 保存AI回复
        await db.addMessageToConversation(convId, "assistant", reply);
        
        return {
          reply,
          conversationId: convId
        };
      }),
    
    // 获取对话列表
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserConversations(ctx.user.id);
    }),
    
    // 获取对话消息
    getConversationMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getConversationMessages(input.conversationId);
      }),
    
    // 删除对话
    deleteConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteConversation(input.conversationId, ctx.user.id);
        return { success: true };
      }),
    
    // 更新对话标题
    updateConversationTitle: protectedProcedure
      .input(z.object({ 
        conversationId: z.number(),
        title: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateConversationTitle(input.conversationId, ctx.user.id, input.title);
        return { success: true };
      }),
    // 分析词汇/语法点
    analyzeWord: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(50),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一位专业的日语教师。请分析给定的日语词汇或语法点，提供详细的解释。

请以JSON格式返回，包含以下字段:
- word: 原词
- reading: 假名读音
- meaning: 中文释义
- partOfSpeech: 词性(如"名词", "动词", "形容词", "副词", "语法点"等)
- usage: 用法说明
- isGrammar: 是否为语法点(boolean)
- grammarLevel: 如果是语法点，标注JLPT级别(N5-N1)
- grammarPattern: 如果是语法点，提供语法模式
- examples: 例句数组，每个包含{japanese: "带注音的日文", meaning: "中文翻译"}

注意: japanese字段中的汉字必须用括号标注假名，例如: "私(わたし)は日本語(にほんご)を勉強(べんきょう)しています。"`
            },
            {
              role: "user",
              content: `请分析这个日语词汇/语法: "${input.text}"`
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
        if (!content || typeof content !== 'string') return null;
        
        try {
          return JSON.parse(content);
        } catch {
          return null;
        }
      }),

    // 翻译日语文本
    translate: publicProcedure
      .input(z.object({
        text: z.string(),
        targetLang: z.enum(['zh', 'en']).default('zh'),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: input.targetLang === 'zh' 
                ? "你是一个日语翻译器。请将输入的日语文本翻译成自然流畅的中文。只返回翻译结果，不要包含任何其他内容。"
                : "You are a Japanese translator. Please translate the input Japanese text into natural English. Only return the translation, nothing else."
            },
            {
              role: "user",
              content: input.text
            }
          ]
        });
        
        const content = response.choices[0]?.message?.content;
        const translation = typeof content === 'string' ? content.trim() : '';
        return { translation };
      }),

    // 获取日语文本的假名读音
    getReading: publicProcedure
      .input(z.object({
        text: z.string(),
      }))
      .mutation(async ({ input }) => {
        // 检查是否包含汉字
        const hasKanji = /[\u4e00-\u9faf\u3400-\u4dbf]/.test(input.text);
        if (!hasKanji) {
          return { reading: input.text };
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "你是一个日语读音转换器。请将输入的日语文本转换为纯假名读音。只返回假名，不要包含任何其他内容。"
            },
            {
              role: "user",
              content: input.text
            }
          ]
        });
        
        const content = response.choices[0]?.message?.content;
        const reading = typeof content === 'string' ? content.trim() : input.text;
        return { reading };
      }),

    // 分析句子 - 返回翻译、重要词汇和语法知识点
    analyzeSentence: publicProcedure
      .input(z.object({
        sentence: z.string().min(1).max(500),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一个日语教学助手。请分析输入的日语句子，返回以下信息：
1. 中文翻译
2. 重要词汇（最多5个）
3. 语法知识点（最多3个）

请以JSON格式返回，格式如下：
{
  "translation": "中文翻译",
  "vocabulary": [
    {
      "word": "日语单词",
      "reading": "假名读音",
      "meaning": "中文意思",
      "partOfSpeech": "词性"
    }
  ],
  "grammar": [
    {
      "pattern": "语法模式",
      "meaning": "语法含义",
      "level": "JLPT级别",
      "usage": "用法说明"
    }
  ]
}

只返回JSON，不要包含任何其他内容。`
            },
            {
              role: "user",
              content: input.sentence
            }
          ]
        });
        
        const content = response.choices[0]?.message?.content;
        if (typeof content !== 'string') {
          return {
            translation: "无法分析",
            vocabulary: [],
            grammar: []
          };
        }
        
        try {
          // 尝试解析JSON
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              translation: parsed.translation || "无法翻译",
              vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
              grammar: Array.isArray(parsed.grammar) ? parsed.grammar : []
            };
          }
        } catch (e) {
          console.error('Failed to parse sentence analysis:', e);
        }
        
        return {
          translation: content.trim(),
          vocabulary: [],
          grammar: []
        };
      }),
  }),

  /**
   * ============================================
   * 语音识别相关路由
   * ============================================
   */
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language || "ja",
        });
        
        return result;
      }),
  }),

  /**
   * ============================================
   * 学习资源管理路由
   * ============================================
   */
  resources: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getActiveResources(input.category);
      }),
  }),

  /**
   * ============================================
   * 学习大纲路由
   * ============================================
   */
  curriculum: router({
    getByLevel: publicProcedure
      .input(z.object({
        level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
      }))
      .query(async ({ input }) => {
        return await db.getCurriculumByLevel(input.level);
      }),

    getUserPath: protectedProcedure.query(async ({ ctx }) => {
      let path = await db.getUserLearningPath(ctx.user.id);
      if (!path) {
        await db.initUserLearningPath(ctx.user.id);
        path = await db.getUserLearningPath(ctx.user.id);
      }
      return path;
    }),
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
    getCategories: publicProcedure
      .input(z.object({
        parentId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getSceneCategories(input.parentId);
      }),

    // 获取学习单元列表
    getUnits: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        subCategory: z.string().optional(),
        unitType: z.enum(["daily_conversation", "anime_scene", "jpop_lyrics", "movie_clip", "news_article", "business_japanese"]).optional(),
        jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
        difficulty: z.number().min(1).max(10).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getLearningUnits(input);
      }),

    // 获取学习单元详情
    getUnitById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getLearningUnitById(input.id);
      }),

    // 获取媒体素材列表
    getMediaMaterials: publicProcedure
      .input(z.object({
        mediaType: z.enum(["anime", "jpop", "movie", "drama", "variety", "news"]).optional(),
        jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getMediaMaterials(input);
      }),

    // 获取媒体素材详情
    getMediaById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMediaMaterialById(input.id);
      }),

    // 获取用户单元学习进度
    getUserProgress: protectedProcedure
      .input(z.object({
        unitId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getUserUnitProgress(ctx.user.id, input.unitId);
      }),

    // 更新用户单元学习进度
    updateProgress: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        status: z.enum(["not_started", "in_progress", "completed", "mastered"]).optional(),
        completionRate: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserUnitProgress({
          userId: ctx.user.id,
          unitId: input.unitId,
          status: input.status,
          completionRate: input.completionRate,
        });
        return { success: true };
      }),

    // 获取每日学习计划
    getDailyPlan: protectedProcedure
      .input(z.object({
        date: z.string().optional(), // YYYY-MM-DD format
      }))
      .query(async ({ ctx, input }) => {
        const date = input.date || new Date().toISOString().split('T')[0];
        return await db.getDailyLearningPlan(ctx.user.id, date);
      }),

    // 生成每日学习计划 (AI驱动)
    generateDailyPlan: protectedProcedure
      .input(z.object({
        targetMinutes: z.number().min(10).max(120).default(30),
        focusAreas: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const date = new Date().toISOString().split('T')[0];
        
        // 获取用户学习进度
        const userProgress = await db.getUserUnitProgress(ctx.user.id);
        const completedUnitIds = Array.isArray(userProgress) 
          ? userProgress.filter(p => p.status === 'completed' || p.status === 'mastered').map(p => p.unitId)
          : [];
        
        // 获取推荐单元
        const recommendedUnits = await db.getRecommendedUnits(ctx.user.id, 20);
        
        // 获取待复习的单元
        const dueReviews = await db.getDueReviews(ctx.user.id, undefined, 10);
        
        // 使用AI生成学习计划
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一位专业的日语学习规划师。请根据用户的学习进度和目标，生成今日学习计划。

规则：
1. 优先安排待复习的内容（艾宾浩斯复习）
2. 新内容应该循序渐进，难度适中
3. 每个学习单元预估5-15分钟
4. 总时长控制在用户目标时间内
5. 返回JSON格式的计划`
            },
            {
              role: "user",
              content: `用户信息：
- 目标学习时间：${input.targetMinutes}分钟
- 已完成单元数：${completedUnitIds.length}
- 待复习项目：${dueReviews.length}个
- 关注领域：${input.focusAreas?.join(', ') || '综合学习'}

可选学习单元：
${recommendedUnits.slice(0, 10).map(u => `- ID:${u.id} 「${u.titleJa}」 难度:${u.difficulty} 类型:${u.unitType}`).join('\n')}

请生成今日学习计划，返回JSON格式：
{
  "reasoning": "规划理由",
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
        let plan = { reasoning: "", units: [] as any[] };
        
        try {
          plan = JSON.parse(typeof content === 'string' ? content : '{}');
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
        
        // 保存学习计划
        await db.upsertDailyLearningPlan({
          userId: ctx.user.id,
          date,
          plannedUnits: plan.units,
          aiReasoning: plan.reasoning,
        });
        
        return await db.getDailyLearningPlan(ctx.user.id, date);
      }),

    // 获取表达库
    getExpressions: publicProcedure
      .input(z.object({
        functionCategory: z.string().optional(),
        situationCategory: z.string().optional(),
        jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getExpressions(input);
      }),

    // AI生成对话变体
    generateDialogueVariant: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        style: z.enum(["casual", "polite", "formal", "slang"]).default("casual"),
      }))
      .mutation(async ({ ctx, input }) => {
        const unit = await db.getLearningUnitById(input.unitId);
        if (!unit) {
          throw new Error("学习单元不存在");
        }
        
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一位专业的日语对话生成器。请根据给定的场景和风格，生成自然的日语对话变体。

要求：
1. 对话要符合日本人的真实表达习惯
2. 包含适当的语气词和口语表达
3. 为每句话添加假名注音（汉字后用括号标注）
4. 提供自然的中文翻译
5. 标注关键表达和语法点`
            },
            {
              role: "user",
              content: `场景：${unit.titleJa}
描述：${unit.descriptionJa || ''}
目标表达：${JSON.stringify(unit.targetExpressions || [])}
风格：${input.style}

请生成一段新的对话变体。`
            }
          ]
        });
        
        const content = response.choices[0]?.message?.content || "";
        
        // 保存生成的内容
        await db.saveAIGeneratedContent({
          userId: ctx.user.id,
          contentType: "dialogue",
          prompt: `生成对话变体: ${unit.titleJa} (${input.style})`,
          generatedContent: { dialogue: content },
        });
        
        return { dialogue: content };
      }),

    // 完成学习单元
    completeUnit: protectedProcedure
      .input(z.object({
        unitId: z.number(),
        score: z.number().min(0).max(100).optional(),
        timeSpent: z.number().optional(), // 实际花费时间(分钟)
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserUnitProgress({
          userId: ctx.user.id,
          unitId: input.unitId,
          status: "completed",
          completionRate: 100,
        });
        
        return { success: true };
      }),

    // 获取单元知识扩展内容
    getKnowledgeExpansion: publicProcedure
      .input(z.object({
        unitId: z.number(),
      }))
      .query(async ({ input }) => {
        const unit = await db.getLearningUnitById(input.unitId);
        if (!unit) {
          throw new Error("学习单元不存在");
        }
        
        // 检查是否已缓存
        const cached = await db.getKnowledgeExpansion(input.unitId);
        if (cached) {
          return cached;
        }
        
        return null;
      }),

    // AI生成知识扩展内容
    generateKnowledgeExpansion: publicProcedure
      .input(z.object({
        unitId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const unit = await db.getLearningUnitById(input.unitId);
        if (!unit) {
          throw new Error("学习单元不存在");
        }
        
        // 使用AI生成知识扩展内容
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `你是一位精通日语语言和文化的专家。请根据给定的学习单元内容，生成详细的知识扩展内容。

要求：
1. 场景应用：详细说明这些表达在什么场景下使用，以及在其他场景下会有什么变体
2. 语言起源：这些表达的历史渊源和演变过程
3. 古今对比：古代日语和现代日语的差异，语言是如何演变的
4. 文化背景：相关的日本文化知识和社会习俗
5. 学习建议：如何更好地掌握和使用这些表达

重要：所有日语例句都必须提供对应的中文翻译，帮助学习者理解句子含义。
请用中文回答，并在适当的地方包含日语原文和注音。
返回JSON格式。`
            },
            {
              role: "user",
              content: `学习单元：${unit.titleJa} (${unit.titleZh})
JLPT等级：${unit.jlptLevel}
描述：${unit.descriptionJa || ''}
目标表达：${JSON.stringify(unit.targetExpressions || [])}
对话内容：${JSON.stringify(unit.content?.dialogues || [])}

请生成详细的知识扩展内容。`
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
          expansion = JSON.parse(typeof content === 'string' ? content : '{}');
        } catch (e) {
          console.error('Failed to parse AI response:', e);
          throw new Error('生成知识扩展内容失败');
        }
        
        // 添加参考来源
        const references = [
          {
            title: "Reddit r/LearnJapanese - Japanese Greetings Etymology",
            url: "https://www.reddit.com/r/LearnJapanese/comments/ulcd0m/breakdown_of_japanese_greetingsset_phrases/",
            description: "日语问候语词源详细分析"
          },
          {
            title: "Coto Academy - Japanese Study",
            url: "https://cotoacademy.com/cn/category/japanese-study/",
            description: "日语学习资源"
          },
          {
            title: "日语敬语史研究",
            url: "https://web.dhu.edu.cn/2015/1208/c5973a138424/page.htm",
            description: "敬语史的史的变化的方向性"
          }
        ];
        
        const result = {
          ...expansion,
          references,
          generatedAt: new Date().toISOString()
        };
        
        // 缓存结果
        await db.saveKnowledgeExpansion(input.unitId, result);
        
        return result;
      }),
  }),

  review: router({
    // 获取学习统计
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getStudyStats(ctx.user.id);
    }),

    // 获取待复习内容
    getDueReviews: protectedProcedure
      .input(z.object({
        itemType: z.enum(["vocabulary", "grammar"]).optional(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const records = await db.getDueReviews(ctx.user.id, input.itemType, input.limit);
        
        // 获取对应的词汇或语法详情
        const enrichedRecords = await Promise.all(
          records.map(async (record) => {
            let item = null;
            if (record.itemType === "vocabulary") {
              item = await db.getVocabularyById(record.itemId);
            } else {
              item = await db.getGrammarById(record.itemId);
            }
            return { ...record, item };
          })
        );
        
        return enrichedRecords;
      }),

    // 添加到学习计划
    addToStudyPlan: protectedProcedure
      .input(z.object({
        itemType: z.enum(["vocabulary", "grammar"]),
        itemId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addStudyRecord(ctx.user.id, input.itemType, input.itemId);
      }),

    // 检查是否已在学习计划中
    isInStudyPlan: protectedProcedure
      .input(z.object({
        itemType: z.enum(["vocabulary", "grammar"]),
        itemId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.isItemInStudyPlan(ctx.user.id, input.itemType, input.itemId);
      }),

    // 从学习计划中移除
    removeFromStudyPlan: protectedProcedure
      .input(z.object({
        itemType: z.enum(["vocabulary", "grammar"]),
        itemId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeFromStudyPlan(ctx.user.id, input.itemType, input.itemId);
      }),

    // 更新复习结果
    updateReviewResult: protectedProcedure
      .input(z.object({
        recordId: z.number(),
        quality: z.number().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateReviewResult(ctx.user.id, input.recordId, input.quality);
      }),

    // 获取每日学习统计
    getDailyStats: protectedProcedure
      .input(z.object({
        days: z.number().optional().default(7),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getDailyStats(ctx.user.id, input.days);
      }),
  }),
});

export type AppRouter = typeof appRouter;
