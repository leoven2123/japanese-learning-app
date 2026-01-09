import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import * as llm from './_core/llm';

// Mock the database functions
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    getLearningUnitById: vi.fn(),
    getKnowledgeExpansion: vi.fn(),
    saveKnowledgeExpansion: vi.fn(),
  };
});

// Mock the LLM function
vi.mock('./_core/llm', async () => {
  const actual = await vi.importActual('./_core/llm');
  return {
    ...actual,
    invokeLLM: vi.fn(),
  };
});

const mockLLMResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        sceneApplications: {
          title: "场景应用",
          mainScenes: [
            {
              scene: "初次见面",
              description: "在商务或社交场合第一次见到某人时使用",
              example: "はじめまして、田中と申します。",
              exampleReading: "hajimemashite, tanaka to moushimasu"
            }
          ],
          variations: [
            {
              context: "非正式场合",
              expression: "はじめまして！",
              expressionReading: "hajimemashite",
              explanation: "在轻松的社交场合可以省略后面的敬语"
            }
          ]
        },
        languageOrigin: {
          title: "语言起源",
          etymology: "「はじめまして」来源于动词「始める」(hajimeru)，意为「开始」",
          historicalDevelopment: "这个表达从江户时代开始广泛使用",
          keyMilestones: [
            {
              period: "江户时代",
              event: "「はじめまして」开始在武士阶层中使用"
            }
          ]
        },
        ancientVsModern: {
          title: "古今对比",
          introduction: "日语问候语经历了显著的演变",
          comparisons: [
            {
              aspect: "初次见面问候",
              ancient: "初めてお目にかかります",
              modern: "はじめまして",
              explanation: "现代日语更加简洁直接"
            }
          ]
        },
        culturalBackground: {
          title: "文化背景",
          content: "日本文化非常重视初次见面的印象",
          customs: [
            {
              name: "鞠躬礼仪",
              description: "初次见面时通常会配合鞠躬"
            }
          ]
        },
        learningTips: {
          title: "学习建议",
          tips: [
            "练习时注意语调的自然性",
            "配合适当的鞠躬动作"
          ],
          commonMistakes: [
            {
              mistake: "只说「はじめまして」不加后续",
              correction: "应该加上「よろしくお願いします」"
            }
          ]
        }
      })
    }
  }]
};

describe('Knowledge Expansion API', () => {
  const mockUnit = {
    id: 1,
    titleJa: 'はじめまして',
    titleZh: '初次见面',
    jlptLevel: 'N5',
    descriptionJa: '初対面の挨拶',
    targetExpressions: ['はじめまして', 'よろしくお願いします'],
    content: {
      dialogues: [
        { speaker: '田中', text: 'はじめまして。田中と申します。' }
      ]
    }
  };

  const mockCachedContent = {
    sceneApplications: {
      title: "场景应用",
      mainScenes: [],
      variations: []
    },
    generatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock for invokeLLM
    vi.mocked(llm.invokeLLM).mockResolvedValue(mockLLMResponse as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getKnowledgeExpansion', () => {
    it('should return null when unit does not exist', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(null);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.immersive.getKnowledgeExpansion({ unitId: 999 }))
        .rejects.toThrow('学习单元不存在');
    });

    it('should return cached content when available', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(mockUnit as any);
      vi.mocked(db.getKnowledgeExpansion).mockResolvedValue(mockCachedContent);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.immersive.getKnowledgeExpansion({ unitId: 1 });
      
      expect(result).toEqual(mockCachedContent);
      expect(db.getKnowledgeExpansion).toHaveBeenCalledWith(1);
    });

    it('should return null when no cached content exists', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(mockUnit as any);
      vi.mocked(db.getKnowledgeExpansion).mockResolvedValue(null);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.immersive.getKnowledgeExpansion({ unitId: 1 });
      
      expect(result).toBeNull();
    });
  });

  describe('generateKnowledgeExpansion', () => {
    it('should throw error when unit does not exist', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(null);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(caller.immersive.generateKnowledgeExpansion({ unitId: 999 }))
        .rejects.toThrow('学习单元不存在');
    });

    it('should generate and save knowledge expansion content', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(mockUnit as any);
      vi.mocked(db.saveKnowledgeExpansion).mockResolvedValue(undefined);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.immersive.generateKnowledgeExpansion({ unitId: 1 });
      
      // Check that the result has the expected structure
      expect(result).toHaveProperty('sceneApplications');
      expect(result).toHaveProperty('languageOrigin');
      expect(result).toHaveProperty('ancientVsModern');
      expect(result).toHaveProperty('culturalBackground');
      expect(result).toHaveProperty('learningTips');
      expect(result).toHaveProperty('references');
      expect(result).toHaveProperty('generatedAt');
      
      // Check that references are included
      expect(result.references).toBeInstanceOf(Array);
      expect(result.references.length).toBeGreaterThan(0);
      
      // Check that content was saved
      expect(db.saveKnowledgeExpansion).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should include scene applications with main scenes and variations', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(mockUnit as any);
      vi.mocked(db.saveKnowledgeExpansion).mockResolvedValue(undefined);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.immersive.generateKnowledgeExpansion({ unitId: 1 });
      
      expect(result.sceneApplications).toHaveProperty('title');
      expect(result.sceneApplications).toHaveProperty('mainScenes');
      expect(result.sceneApplications).toHaveProperty('variations');
      expect(result.sceneApplications.mainScenes).toBeInstanceOf(Array);
    });

    it('should include language origin with etymology and milestones', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(mockUnit as any);
      vi.mocked(db.saveKnowledgeExpansion).mockResolvedValue(undefined);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.immersive.generateKnowledgeExpansion({ unitId: 1 });
      
      expect(result.languageOrigin).toHaveProperty('title');
      expect(result.languageOrigin).toHaveProperty('etymology');
      expect(result.languageOrigin).toHaveProperty('historicalDevelopment');
      expect(result.languageOrigin).toHaveProperty('keyMilestones');
    });

    it('should include ancient vs modern comparisons', async () => {
      vi.mocked(db.getLearningUnitById).mockResolvedValue(mockUnit as any);
      vi.mocked(db.saveKnowledgeExpansion).mockResolvedValue(undefined);
      
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.immersive.generateKnowledgeExpansion({ unitId: 1 });
      
      expect(result.ancientVsModern).toHaveProperty('title');
      expect(result.ancientVsModern).toHaveProperty('introduction');
      expect(result.ancientVsModern).toHaveProperty('comparisons');
      expect(result.ancientVsModern.comparisons).toBeInstanceOf(Array);
    });
  });
});
