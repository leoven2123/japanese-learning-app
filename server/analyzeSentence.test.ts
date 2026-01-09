import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          translation: "这是一个测试翻译",
          vocabulary: [
            {
              word: "テスト",
              reading: "てすと",
              meaning: "测试",
              partOfSpeech: "名词"
            }
          ],
          grammar: [
            {
              pattern: "〜です",
              meaning: "表示判断或说明",
              level: "N5",
              usage: "用于礼貌地陈述事实"
            }
          ]
        })
      }
    }]
  })
}));

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("ai.analyzeSentence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze a Japanese sentence and return translation, vocabulary, and grammar", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ai.analyzeSentence({
      sentence: "これはテストです。"
    });
    
    expect(result).toHaveProperty("translation");
    expect(result).toHaveProperty("vocabulary");
    expect(result).toHaveProperty("grammar");
    expect(result.translation).toBe("这是一个测试翻译");
    expect(Array.isArray(result.vocabulary)).toBe(true);
    expect(Array.isArray(result.grammar)).toBe(true);
  });

  it("should return vocabulary with correct structure", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ai.analyzeSentence({
      sentence: "日本語を勉強しています。"
    });
    
    expect(result.vocabulary.length).toBeGreaterThan(0);
    const vocab = result.vocabulary[0];
    expect(vocab).toHaveProperty("word");
    expect(vocab).toHaveProperty("reading");
    expect(vocab).toHaveProperty("meaning");
    expect(vocab).toHaveProperty("partOfSpeech");
  });

  it("should return grammar with correct structure", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ai.analyzeSentence({
      sentence: "食べたいです。"
    });
    
    expect(result.grammar.length).toBeGreaterThan(0);
    const gram = result.grammar[0];
    expect(gram).toHaveProperty("pattern");
    expect(gram).toHaveProperty("meaning");
    expect(gram).toHaveProperty("level");
    expect(gram).toHaveProperty("usage");
  });

  it("should handle empty response gracefully", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: null
        }
      }]
    });
    
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ai.analyzeSentence({
      sentence: "テスト"
    });
    
    expect(result).toHaveProperty("translation");
    expect(result).toHaveProperty("vocabulary");
    expect(result).toHaveProperty("grammar");
  });

  it("should handle malformed JSON response", async () => {
    const { invokeLLM } = await import("./_core/llm");
    (invokeLLM as any).mockResolvedValueOnce({
      choices: [{
        message: {
          content: "这不是有效的JSON"
        }
      }]
    });
    
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ai.analyzeSentence({
      sentence: "テスト"
    });
    
    // Should fallback to using the content as translation
    expect(result).toHaveProperty("translation");
    expect(result.vocabulary).toEqual([]);
    expect(result.grammar).toEqual([]);
  });
});
