import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// 创建公共上下文（无用户）
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

// 创建认证用户上下文
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Immersive Learning API", () => {
  describe("getCategories", () => {
    it("should return scene categories", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const categories = await caller.immersive.getCategories({});

      expect(Array.isArray(categories)).toBe(true);
      // 验证返回的分类结构
      categories.forEach((cat) => {
        expect(cat).toHaveProperty("category");
        expect(cat).toHaveProperty("count");
        expect(typeof cat.category).toBe("string");
        expect(typeof cat.count).toBe("number");
      });
    });
  });

  describe("getUnits", () => {
    it("should return learning units list", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.immersive.getUnits({});

      // API返回 { items, total }
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should filter units by JLPT level", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.immersive.getUnits({ jlptLevel: "N5" });

      expect(Array.isArray(result.items)).toBe(true);
      result.items.forEach((unit) => {
        expect(unit.jlptLevel).toBe("N5");
      });
    });

    it("should filter units by category", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.immersive.getUnits({ category: "日常生活" });

      expect(Array.isArray(result.items)).toBe(true);
      result.items.forEach((unit) => {
        expect(unit.category).toBe("日常生活");
      });
    });

    it("should support pagination", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.immersive.getUnits({ limit: 5, offset: 0 });

      expect(result.items.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getUnitById", () => {
    it("should return a single learning unit by ID", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // 先获取单元列表
      const listResult = await caller.immersive.getUnits({ limit: 1 });
      
      if (listResult.items.length > 0) {
        const firstUnit = listResult.items[0];
        const unit = await caller.immersive.getUnitById({ id: firstUnit.id });

        expect(unit).toBeDefined();
        expect(unit?.id).toBe(firstUnit.id);
        expect(unit?.titleJa).toBe(firstUnit.titleJa);
        expect(unit).toHaveProperty("content");
      }
    });

    it("should return null for non-existent ID", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const unit = await caller.immersive.getUnitById({ id: 999999 });

      expect(unit).toBeNull();
    });
  });

  describe("Unit content structure", () => {
    it("should have valid dialogue structure", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.immersive.getUnits({ limit: 1 });
      
      if (result.items.length > 0) {
        const unit = await caller.immersive.getUnitById({ id: result.items[0].id });
        
        if (unit && unit.content) {
          const content = unit.content as {
            dialogues?: Array<{
              speaker: string;
              text: string;
              reading?: string;
              notes?: string;
            }>;
            situationDescription?: string;
            keyPoints?: string[];
            culturalNotes?: string;
          };

          if (content.dialogues) {
            expect(Array.isArray(content.dialogues)).toBe(true);
            content.dialogues.forEach((dialogue) => {
              expect(dialogue).toHaveProperty("speaker");
              expect(dialogue).toHaveProperty("text");
              expect(typeof dialogue.speaker).toBe("string");
              expect(typeof dialogue.text).toBe("string");
            });
          }
        }
      }
    });
  });

  describe("Unit metadata validation", () => {
    it("should have valid target expressions", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.immersive.getUnits({ limit: 5 });

      result.items.forEach((unit) => {
        if (unit.targetExpressions) {
          expect(Array.isArray(unit.targetExpressions)).toBe(true);
        }
      });
    });

    it("should have valid difficulty levels (1-10)", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.immersive.getUnits({});

      result.items.forEach((unit) => {
        expect(unit.difficulty).toBeGreaterThanOrEqual(1);
        expect(unit.difficulty).toBeLessThanOrEqual(10);
      });
    });

    it("should have valid JLPT levels", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const validLevels = ["N5", "N4", "N3", "N2", "N1", null];
      const result = await caller.immersive.getUnits({});

      result.items.forEach((unit) => {
        expect(validLevels).toContain(unit.jlptLevel);
      });
    });
  });

  describe("User progress (authenticated)", () => {
    it("should get user progress for a unit", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // 先获取一个单元
      const listResult = await caller.immersive.getUnits({ limit: 1 });
      
      if (listResult.items.length > 0) {
        const progress = await caller.immersive.getUserProgress({ 
          unitId: listResult.items[0].id 
        });

        // 可能返回null（无进度）或进度对象
        if (progress) {
          expect(progress).toHaveProperty("status");
          expect(progress).toHaveProperty("completionRate");
        }
      }
    });
  });
});
