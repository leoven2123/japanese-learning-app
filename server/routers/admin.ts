import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * 管理员路由
 * 包含数据导入等管理功能
 */
export const adminRouter = router({
  // 批量导入词汇
  importVocabulary: protectedProcedure
    .input(z.object({
      data: z.array(z.object({
        expression: z.string(),
        reading: z.string(),
        meaning: z.string(),
        level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
        partOfSpeech: z.string().optional(),
        tags: z.string().optional(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const item of input.data) {
        try {
          // 检查是否已存在
          const existing = await db.getVocabularyByExpression(item.expression);
          if (existing) {
            errors.push(`词汇 "${item.expression}" 已存在,跳过`);
            failed++;
            continue;
          }

          // 插入新词汇
          await db.createVocabulary({
            expression: item.expression,
            reading: item.reading,
            meaning: item.meaning,
            level: item.level,
            partOfSpeech: item.partOfSpeech || null,
            tags: item.tags || null,
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`导入 "${item.expression}" 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return { success, failed, errors };
    }),

  // 批量导入语法
  importGrammar: protectedProcedure
    .input(z.object({
      data: z.array(z.object({
        pattern: z.string(),
        meaning: z.string(),
        level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
        explanation: z.string().optional(),
        tags: z.string().optional(),
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const item of input.data) {
        try {
          // 检查是否已存在
          const existing = await db.getGrammarByPattern(item.pattern);
          if (existing) {
            errors.push(`语法 "${item.pattern}" 已存在,跳过`);
            failed++;
            continue;
          }

          // 插入新语法
          await db.createGrammar({
            pattern: item.pattern,
            meaning: item.meaning,
            level: item.level,
            explanation: item.explanation || null,
            tags: item.tags || null,
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`导入 "${item.pattern}" 失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return { success, failed, errors };
    }),
});
