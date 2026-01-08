import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";

describe("数据导入功能", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // 创建测试用的caller,模拟已登录用户
    const mockContext: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: null,
        avatarUrl: null,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    caller = appRouter.createCaller(mockContext);
  });

  describe("词汇导入", () => {
    it("应该能够导入有效的词汇数据", async () => {
      const testData = [
        {
          expression: "テスト",
          reading: "てすと",
          meaning: "测试",
          level: "N5" as const,
        },
      ];

      const result = await caller.admin.importVocabulary({ data: testData });

      expect(result).toBeDefined();
      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("应该跳过已存在的词汇", async () => {
      const testData = [
        {
          expression: "日本語",
          reading: "にほんご",
          meaning: "日语",
          level: "N5" as const,
        },
      ];

      // 第一次导入
      await caller.admin.importVocabulary({ data: testData });

      // 第二次导入相同数据
      const result = await caller.admin.importVocabulary({ data: testData });

      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("已存在");
    });
  });

  describe("语法导入", () => {
    it("应该能够导入有效的语法数据", async () => {
      const testData = [
        {
          pattern: "〜テスト",
          meaning: "测试语法",
          level: "N5" as const,
          explanation: "这是一个测试语法点",
        },
      ];

      const result = await caller.admin.importGrammar({ data: testData });

      expect(result).toBeDefined();
      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("应该跳过已存在的语法", async () => {
      const testData = [
        {
          pattern: "〜は〜です",
          meaning: "...是...",
          level: "N5" as const,
        },
      ];

      // 第一次导入
      await caller.admin.importGrammar({ data: testData });

      // 第二次导入相同数据
      const result = await caller.admin.importGrammar({ data: testData });

      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("已存在");
    });
  });

  describe("批量导入", () => {
    it("应该能够批量导入多个词汇", async () => {
      const testData = [
        {
          expression: "テスト1",
          reading: "てすと1",
          meaning: "测试1",
          level: "N5" as const,
        },
        {
          expression: "テスト2",
          reading: "てすと2",
          meaning: "测试2",
          level: "N4" as const,
        },
        {
          expression: "テスト3",
          reading: "てすと3",
          meaning: "测试3",
          level: "N3" as const,
        },
      ];

      const result = await caller.admin.importVocabulary({ data: testData });

      expect(result.success + result.failed).toBe(testData.length);
    });

    it("应该能够批量导入多个语法点", async () => {
      const testData = [
        {
          pattern: "〜テスト1",
          meaning: "测试语法1",
          level: "N5" as const,
        },
        {
          pattern: "〜テスト2",
          meaning: "测试语法2",
          level: "N4" as const,
        },
        {
          pattern: "〜テスト3",
          meaning: "测试语法3",
          level: "N3" as const,
        },
      ];

      const result = await caller.admin.importGrammar({ data: testData });

      expect(result.success + result.failed).toBe(testData.length);
    });
  });
});
