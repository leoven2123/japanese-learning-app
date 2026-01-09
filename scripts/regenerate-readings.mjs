/**
 * 重新生成数据库中所有对话的reading数据
 * 使用新的API（保留标点符号）
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { learningUnits } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// LLM API配置
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// 创建数据库连接
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// 调用LLM获取reading
async function getReading(text) {
  try {
    const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: '你是一个日语注音助手。用户会给你日语文本，你需要返回对应的平假名读音。\n\n重要规则：\n1. 所有汉字必须转换为平假名（包括申す→もうす、田中→たなか、山田→やまだ等）\n2. 保留所有标点符号（、。！？等）在原来的位置\n3. 片假名保持不变\n4. 平假名保持不变\n5. 只返回读音，不要有任何解释\n\n示例：\n输入：はじめまして。田中と申します。\n输出：はじめまして。たなかともうします。\n\n输入：今日は良い天気ですね。\n输出：きょうはよいてんきですね。\n\n输入：ねえ、今週の土曜日、暇？\n输出：ねえ、こんしゅうのどようび、ひま？'
          },
          {
            role: 'user',
            content: text
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const reading = data.choices?.[0]?.message?.content?.trim();
    
    if (!reading) {
      throw new Error('No reading returned from API');
    }

    return reading;
  } catch (error) {
    console.error(`Error getting reading for "${text}":`, error.message);
    return null;
  }
}

// 主函数
async function main() {
  console.log('开始重新生成reading数据...\n');

  // 获取所有学习单元
  const units = await db.select().from(learningUnits);
  console.log(`找到 ${units.length} 个学习单元\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const unit of units) {
    console.log(`处理单元 ${unit.id}: ${unit.titleJa}`);

    if (!unit.content?.dialogues || unit.content.dialogues.length === 0) {
      console.log('  跳过：没有对话内容\n');
      continue;
    }

    const dialogues = unit.content.dialogues;
    let needsUpdate = false;

    // 为每个对话生成新的reading
    for (let i = 0; i < dialogues.length; i++) {
      const dialogue = dialogues[i];
      const text = dialogue.text;

      if (!text) {
        continue;
      }

      console.log(`  对话 ${i + 1}: ${text}`);

      // 获取新的reading
      const newReading = await getReading(text);

      if (newReading) {
        console.log(`    新reading: ${newReading}`);
        dialogue.reading = newReading;
        needsUpdate = true;

        // 避免API限流
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`    错误：无法获取reading`);
        errorCount++;
      }
    }

    // 更新数据库
    if (needsUpdate) {
      try {
        await db.update(learningUnits)
          .set({ content: unit.content })
          .where(eq(learningUnits.id, unit.id));

        console.log(`  ✓ 已更新单元 ${unit.id}\n`);
        updatedCount++;
      } catch (error) {
        console.error(`  ✗ 更新失败:`, error.message, '\n');
        errorCount++;
      }
    } else {
      console.log(`  跳过：无需更新\n`);
    }
  }

  console.log('\n完成！');
  console.log(`成功更新: ${updatedCount} 个单元`);
  console.log(`错误: ${errorCount} 次`);

  await connection.end();
}

main().catch(console.error);
