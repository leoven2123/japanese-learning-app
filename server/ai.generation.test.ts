import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

describe('AI Generation Features', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockContext: Context;

  beforeAll(() => {
    // 模拟已登录用户的上下文
    mockContext = {
      user: {
        id: 1,
        openId: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    caller = appRouter.createCaller(mockContext);
  });

  describe('Generate Examples', () => {
    it('should generate examples for a vocabulary word', async () => {
      // 使用一个存在的词汇ID (假设ID 1存在)
      const result = await caller.ai.generateExamples({
        vocabularyId: 1,
        count: 2,
      });

      expect(result).toBeDefined();
      expect(result.examples).toBeDefined();
      expect(Array.isArray(result.examples)).toBe(true);
      expect(result.examples.length).toBeGreaterThan(0);
      
      // 检查例句结构
      const firstExample = result.examples[0];
      expect(firstExample).toHaveProperty('japanese');
      expect(firstExample).toHaveProperty('reading');
      expect(firstExample).toHaveProperty('chinese');
    }, 30000); // AI调用可能需要更长时间

    it('should generate examples for a grammar point', async () => {
      // 使用一个存在的语法ID (假设ID 1存在)
      const result = await caller.ai.generateExamples({
        grammarId: 1,
        count: 2,
      });

      expect(result).toBeDefined();
      expect(result.examples).toBeDefined();
      expect(Array.isArray(result.examples)).toBe(true);
    }, 30000);
  });

  describe('Generate Dialogue', () => {
    it('should generate dialogue for a vocabulary word', async () => {
      const result = await caller.ai.generateDialogue({
        vocabularyId: 1,
        scenario: '在餐厅点餐',
      });

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.scenario).toBeDefined();
      expect(result.dialogue).toBeDefined();
      expect(Array.isArray(result.dialogue)).toBe(true);
      expect(result.dialogue.length).toBeGreaterThan(0);
      
      // 检查对话结构
      const firstLine = result.dialogue[0];
      expect(firstLine).toHaveProperty('speaker');
      expect(firstLine).toHaveProperty('japanese');
      expect(firstLine).toHaveProperty('reading');
      expect(firstLine).toHaveProperty('chinese');
    }, 30000);

    it('should generate dialogue for a grammar point', async () => {
      const result = await caller.ai.generateDialogue({
        grammarId: 1,
      });

      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.dialogue).toBeDefined();
      expect(Array.isArray(result.dialogue)).toBe(true);
    }, 30000);
  });

  describe('Explain Grammar', () => {
    it('should explain a grammar point', async () => {
      const result = await caller.ai.explainGrammar({
        grammarPoint: 'ている',
        question: '什么时候使用ている形式?',
      });

      expect(result).toBeDefined();
      expect(result.explanation).toBeDefined();
      expect(typeof result.explanation).toBe('string');
      expect(result.explanation.length).toBeGreaterThan(0);
    }, 30000);
  });
});
