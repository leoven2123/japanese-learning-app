import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// 创建公共上下文
function createPublicContext(): TrpcContext {
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

describe("AI analyzeWord API", () => {
  it("should analyze a Japanese vocabulary word", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.analyzeWord({ text: "食べる" });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("word");
    expect(result).toHaveProperty("reading");
    expect(result).toHaveProperty("meaning");
    expect(result).toHaveProperty("partOfSpeech");
    expect(result).toHaveProperty("usage");
    expect(result).toHaveProperty("isGrammar");
    expect(result).toHaveProperty("examples");
    expect(Array.isArray(result?.examples)).toBe(true);
  }, 30000);

  it("should analyze a Japanese grammar point", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.analyzeWord({ text: "ている" });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("word");
    expect(result).toHaveProperty("meaning");
    expect(result).toHaveProperty("partOfSpeech");
    // 语法点应该有isGrammar标记
    expect(result).toHaveProperty("isGrammar");
  }, 30000);

  it("should return examples with japanese and meaning fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.analyzeWord({ text: "勉強" });

    expect(result).toBeDefined();
    if (result?.examples && result.examples.length > 0) {
      const example = result.examples[0];
      expect(example).toHaveProperty("japanese");
      expect(example).toHaveProperty("meaning");
      expect(typeof example.japanese).toBe("string");
      expect(typeof example.meaning).toBe("string");
    }
  }, 30000);
});
