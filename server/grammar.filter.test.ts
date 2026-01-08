import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("语法库筛选和排序功能", () => {
  beforeAll(async () => {
    // 确保数据库已连接
    await db.getDb();
  });

  describe("按JLPT等级筛选", () => {
    it("应该能够筛选出N5级别的语法", async () => {
      const result = await db.getGrammarList({
        jlptLevel: "N5",
        limit: 50,
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((grammar) => {
        expect(grammar.jlptLevel).toBe("N5");
      });
    });

    it("应该能够筛选出N4级别的语法", async () => {
      const result = await db.getGrammarList({
        jlptLevel: "N4",
        limit: 50,
      });

      if (result.length > 0) {
        result.forEach((grammar) => {
          expect(grammar.jlptLevel).toBe("N4");
        });
      }
    });
  });

  describe("按首字母筛选", () => {
    it("应该能够筛选出あ行的语法", async () => {
      const result = await db.getGrammarList({
        firstLetter: "a",
        limit: 100,
      });

      if (result.length > 0) {
        result.forEach((grammar) => {
          const firstChar = grammar.pattern.charAt(0);
          expect(firstChar >= "あ" && firstChar <= "お").toBe(true);
        });
      }
    });

    it("应该能够筛选出ま行的语法", async () => {
      const result = await db.getGrammarList({
        firstLetter: "ma",
        limit: 100,
      });

      if (result.length > 0) {
        result.forEach((grammar) => {
          const firstChar = grammar.pattern.charAt(0);
          expect(firstChar >= "ま" && firstChar <= "も").toBe(true);
        });
      }
    });
  });

  describe("按五十音图排序", () => {
    it("应该能够按句型顺序排序", async () => {
      const result = await db.getGrammarList({
        sortBy: "kana",
        limit: 50,
      });

      expect(result.length).toBeGreaterThan(0);
      
      // 验证结果是按pattern排序的
      for (let i = 1; i < result.length; i++) {
        expect(result[i].pattern >= result[i - 1].pattern).toBe(true);
      }
    });

    it("默认排序应该按ID排序", async () => {
      const result = await db.getGrammarList({
        sortBy: "default",
        limit: 50,
      });

      expect(result.length).toBeGreaterThan(0);
      
      // 验证结果是按ID排序的
      for (let i = 1; i < result.length; i++) {
        expect(result[i].id >= result[i - 1].id).toBe(true);
      }
    });
  });

  describe("搜索功能", () => {
    it("应该能够按句型搜索", async () => {
      const result = await db.getGrammarList({
        search: "ます",
        limit: 50,
      });

      if (result.length > 0) {
        result.forEach((grammar) => {
          const matchPattern = grammar.pattern.includes("ます");
          const matchMeaning = grammar.meaning.includes("ます");
          expect(matchPattern || matchMeaning).toBe(true);
        });
      }
    });

    it("应该能够按释义搜索", async () => {
      const result = await db.getGrammarList({
        search: "礼貌",
        limit: 50,
      });

      if (result.length > 0) {
        result.forEach((grammar) => {
          const matchPattern = grammar.pattern.includes("礼貌");
          const matchMeaning = grammar.meaning.includes("礼貌");
          expect(matchPattern || matchMeaning).toBe(true);
        });
      }
    });
  });

  describe("组合筛选", () => {
    it("应该能够同时使用JLPT等级和首字母筛选", async () => {
      const result = await db.getGrammarList({
        jlptLevel: "N5",
        firstLetter: "a",
        limit: 100,
      });

      if (result.length > 0) {
        result.forEach((grammar) => {
          expect(grammar.jlptLevel).toBe("N5");
          const firstChar = grammar.pattern.charAt(0);
          expect(firstChar >= "あ" && firstChar <= "お").toBe(true);
        });
      }
    });

    it("应该能够同时使用首字母筛选和排序", async () => {
      const result = await db.getGrammarList({
        firstLetter: "ma",
        sortBy: "kana",
        limit: 50,
      });

      if (result.length > 0) {
        // 验证首字母筛选
        result.forEach((grammar) => {
          const firstChar = grammar.pattern.charAt(0);
          expect(firstChar >= "ま" && firstChar <= "も").toBe(true);
        });

        // 验证排序
        for (let i = 1; i < result.length; i++) {
          expect(result[i].pattern >= result[i - 1].pattern).toBe(true);
        }
      }
    });

    it("应该能够同时使用搜索、等级筛选和排序", async () => {
      const result = await db.getGrammarList({
        jlptLevel: "N5",
        search: "ます",
        sortBy: "kana",
        limit: 50,
      });

      // 可能没有结果,但不应该报错
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        result.forEach((grammar) => {
          expect(grammar.jlptLevel).toBe("N5");
        });
      }
    });
  });

  describe("边界情况", () => {
    it("不指定筛选条件应该返回所有语法", async () => {
      const result = await db.getGrammarList({
        limit: 50,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it("无效的首字母应该被忽略", async () => {
      const result = await db.getGrammarList({
        firstLetter: "invalid" as any,
        limit: 50,
      });

      // 应该返回结果,不应该报错
      expect(Array.isArray(result)).toBe(true);
    });

    it("搜索不存在的内容应该返回空数组", async () => {
      const result = await db.getGrammarList({
        search: "这个语法绝对不存在xyz123",
        limit: 50,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
