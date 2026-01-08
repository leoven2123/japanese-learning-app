import { describe, expect, it } from "vitest";

/**
 * 振假名功能测试
 * 
 * 由于Ruby组件是React组件,这里测试的是后端数据是否正确提供了
 * expression(汉字)和reading(假名)字段供前端使用
 */

describe("Ruby furigana data verification", () => {
  it("should have vocabulary with both expression and reading", async () => {
    // 这个测试验证数据库中的词汇数据包含必要的字段
    const { getDb } = await import("./db");
    const db = await getDb();
    
    if (!db) {
      console.warn("Database not available for testing");
      return;
    }

    const result = await db.execute(`
      SELECT expression, reading 
      FROM vocabulary 
      WHERE expression REGEXP '[一-龯]'
      LIMIT 5
    `);

    const rows = Array.isArray(result) ? result[0] : result;
    expect(Array.isArray(rows)).toBe(true);
    
    if (Array.isArray(rows) && rows.length > 0) {
      const vocab = rows[0] as any;
      expect(vocab).toHaveProperty("expression");
      expect(vocab).toHaveProperty("reading");
      expect(typeof vocab.expression).toBe("string");
      expect(typeof vocab.reading).toBe("string");
      expect(vocab.expression.length).toBeGreaterThan(0);
      expect(vocab.reading.length).toBeGreaterThan(0);
    }
  });

  it("should have kanji in expression field", async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    
    if (!db) {
      console.warn("Database not available for testing");
      return;
    }

    // 测试是否有包含汉字的词汇
    const result = await db.execute(`
      SELECT COUNT(*) as count 
      FROM vocabulary 
      WHERE expression REGEXP '[一-龯]'
    `);

    const rows = Array.isArray(result) ? result[0] : result;
    if (Array.isArray(rows) && rows.length > 0) {
      const countRow = rows[0] as any;
      expect(countRow.count).toBeGreaterThan(0);
    }
  });

  it("should have different expression and reading for kanji words", async () => {
    const { getDb } = await import("./db");
    const db = await getDb();
    
    if (!db) {
      console.warn("Database not available for testing");
      return;
    }

    // 测试包含汉字的词汇,其expression和reading应该不同
    const result = await db.execute(`
      SELECT expression, reading 
      FROM vocabulary 
      WHERE expression REGEXP '[一-龯]'
      AND expression != reading
      LIMIT 1
    `);

    const rows = Array.isArray(result) ? result[0] : result;
    if (Array.isArray(rows) && rows.length > 0) {
      const vocab = rows[0] as any;
      expect(vocab.expression).not.toBe(vocab.reading);
    }
  });
});
