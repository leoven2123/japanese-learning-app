import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("词汇库筛选和排序功能", () => {
  beforeAll(async () => {
    // 确保数据库已连接
    await db.getDb();
  });

  describe("按首字母筛选", () => {
    it("应该能够筛选出あ行的词汇", async () => {
      const result = await db.getVocabularyList({
        firstLetter: "a",
        limit: 100,
      });

      expect(result.length).toBeGreaterThan(0);
      // 验证所有结果的reading都以あ行假名开头
      result.forEach((vocab) => {
        const firstChar = vocab.reading.charAt(0);
        expect(["あ", "い", "う", "え", "お"].some(char => firstChar >= char && firstChar <= "お")).toBe(true);
      });
    });

    it("应该能够筛选出か行的词汇", async () => {
      const result = await db.getVocabularyList({
        firstLetter: "ka",
        limit: 100,
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((vocab) => {
        const firstChar = vocab.reading.charAt(0);
        expect(firstChar >= "か" && firstChar <= "ご").toBe(true);
      });
    });

    it("应该能够筛选出さ行的词汇", async () => {
      const result = await db.getVocabularyList({
        firstLetter: "sa",
        limit: 100,
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((vocab) => {
        const firstChar = vocab.reading.charAt(0);
        expect(firstChar >= "さ" && firstChar <= "ぞ").toBe(true);
      });
    });

    it("应该能够筛选出た行的词汇", async () => {
      const result = await db.getVocabularyList({
        firstLetter: "ta",
        limit: 100,
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((vocab) => {
        const firstChar = vocab.reading.charAt(0);
        expect(firstChar >= "た" && firstChar <= "ど").toBe(true);
      });
    });

    it("应该能够筛选出は行的词汇", async () => {
      const result = await db.getVocabularyList({
        firstLetter: "ha",
        limit: 100,
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((vocab) => {
        const firstChar = vocab.reading.charAt(0);
        expect(firstChar >= "は" && firstChar <= "ぽ").toBe(true);
      });
    });
  });

  describe("按五十音图排序", () => {
    it("应该能够按假名顺序排序", async () => {
      const result = await db.getVocabularyList({
        sortBy: "kana",
        limit: 50,
      });

      expect(result.length).toBeGreaterThan(0);
      
      // 验证结果是按reading排序的
      for (let i = 1; i < result.length; i++) {
        expect(result[i].reading >= result[i - 1].reading).toBe(true);
      }
    });

    it("默认排序应该按ID排序", async () => {
      const result = await db.getVocabularyList({
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

  describe("组合筛选", () => {
    it("应该能够同时使用JLPT等级和首字母筛选", async () => {
      const result = await db.getVocabularyList({
        jlptLevel: "N5",
        firstLetter: "a",
        limit: 100,
      });

      expect(result.length).toBeGreaterThan(0);
      result.forEach((vocab) => {
        expect(vocab.jlptLevel).toBe("N5");
        const firstChar = vocab.reading.charAt(0);
        expect(firstChar >= "あ" && firstChar <= "お").toBe(true);
      });
    });

    it("应该能够同时使用首字母筛选和排序", async () => {
      const result = await db.getVocabularyList({
        firstLetter: "ka",
        sortBy: "kana",
        limit: 50,
      });

      expect(result.length).toBeGreaterThan(0);
      
      // 验证首字母筛选
      result.forEach((vocab) => {
        const firstChar = vocab.reading.charAt(0);
        expect(firstChar >= "か" && firstChar <= "ご").toBe(true);
      });

      // 验证排序
      for (let i = 1; i < result.length; i++) {
        expect(result[i].reading >= result[i - 1].reading).toBe(true);
      }
    });

    it("应该能够同时使用搜索、首字母筛选和排序", async () => {
      const result = await db.getVocabularyList({
        search: "食",
        firstLetter: "ta",
        sortBy: "kana",
        limit: 50,
      });

      // 可能没有结果,但不应该报错
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("边界情况", () => {
    it("不指定筛选条件应该返回所有词汇", async () => {
      const result = await db.getVocabularyList({
        limit: 50,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it("无效的首字母应该被忽略", async () => {
      const result = await db.getVocabularyList({
        firstLetter: "invalid" as any,
        limit: 50,
      });

      // 应该返回结果,不应该报错
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
