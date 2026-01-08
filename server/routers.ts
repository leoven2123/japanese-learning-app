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
});

export type AppRouter = typeof appRouter;
