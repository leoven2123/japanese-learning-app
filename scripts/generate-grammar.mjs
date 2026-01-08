/**
 * 使用AI批量生成JLPT语法数据
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// 解析数据库连接字符串
function parseDbUrl(url) {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = url.match(regex);
  if (!match) throw new Error('Invalid DATABASE_URL');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
}

// 调用LLM生成语法数据
async function generateGrammarData(level, batchNum, existingPatterns) {
  const excludeList = existingPatterns.slice(0, 50).join('、');
  
  const prompt = `请生成10个JLPT ${level}级别的日语语法点数据，返回JSON数组格式。
这是第${batchNum}批数据。

已有的语法点(请勿重复): ${excludeList}

每个语法点需要包含以下字段:
- pattern: 语法句型(日文)，如"〜ている"、"〜なければならない"
- meaning: 中文释义，简洁明了
- structure: 接续方式说明(中文)，如"动词て形 + いる"
- example_sentence: 一个例句(日文)
- example_reading: 例句的假名读音
- example_meaning: 例句的中文翻译
- notes: 使用注意事项(中文，可为空字符串)

请确保:
1. 语法点符合${level}级别的难度
2. 例句自然实用
3. 释义准确清晰
4. 不要重复已有的语法点

返回格式: {"grammar_points": [...]}`;

  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: '你是一位专业的日语教师，精通JLPT各级别的语法教学。请生成准确、实用的语法数据。只返回JSON格式。' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.grammar_points) {
      return parsed.grammar_points;
    } else if (parsed.data) {
      return parsed.data;
    }
    return [];
  } catch (e) {
    console.error('解析JSON失败:', content.substring(0, 200));
    return [];
  }
}

async function main() {
  console.log('开始使用AI生成JLPT语法数据...\n');
  
  const dbConfig = parseDbUrl(DATABASE_URL);
  const connection = await mysql.createConnection({
    ...dbConfig,
    ssl: { rejectUnauthorized: true },
  });

  // 获取现有的语法pattern
  const [existingRows] = await connection.execute('SELECT pattern FROM grammar');
  const existingPatterns = existingRows.map(r => r.pattern);
  console.log(`数据库中已有 ${existingPatterns.length} 个语法点\n`);

  // 每个等级生成的批次数(目标总数约700+)
  const batchesPerLevel = {
    'N5': 8,   // 约80个语法点
    'N4': 10,  // 约100个语法点
    'N3': 15,  // 约150个语法点
    'N2': 18,  // 约180个语法点
    'N1': 20,  // 约200个语法点
  };

  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  let totalImported = 0;
  let totalSkipped = 0;
  const allPatterns = [...existingPatterns];

  for (const level of levels) {
    console.log(`\n========== 处理 ${level} 级别 ==========`);
    const batches = batchesPerLevel[level];
    
    for (let batch = 1; batch <= batches; batch++) {
      console.log(`[${level}] 生成第 ${batch}/${batches} 批语法数据...`);
      
      try {
        const grammarPoints = await generateGrammarData(level, batch, allPatterns);
        
        if (!grammarPoints || grammarPoints.length === 0) {
          console.log(`  警告: 第 ${batch} 批没有生成数据`);
          continue;
        }

        let batchImported = 0;
        for (const grammar of grammarPoints) {
          try {
            // 检查是否已存在
            if (allPatterns.includes(grammar.pattern)) {
              totalSkipped++;
              continue;
            }

            // 插入语法数据 (grammar表字段: pattern, meaning, usage, jlptLevel, difficulty, tags)
            const usageText = `${grammar.structure || ''}\n\n例句: ${grammar.example_sentence || ''}\n读音: ${grammar.example_reading || ''}\n翻译: ${grammar.example_meaning || ''}\n\n${grammar.notes || ''}`;
            
            await connection.execute(
              `INSERT INTO grammar (pattern, meaning, \`usage\`, jlptLevel, difficulty, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                grammar.pattern || '',
                grammar.meaning || '',
                usageText.trim(),
                level,
                1,
              ]
            );
            totalImported++;
            batchImported++;
            allPatterns.push(grammar.pattern);
          } catch (insertError) {
            if (insertError.code === 'ER_DUP_ENTRY') {
              totalSkipped++;
            } else {
              console.error(`  插入失败: ${grammar.pattern}`, insertError.message);
            }
          }
        }

        console.log(`  ✓ 导入 ${batchImported} 个语法点 (总计: ${totalImported})`);
        
        // 避免API限流
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`  生成失败:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // 输出统计
  const [stats] = await connection.execute(`
    SELECT level, COUNT(*) as count 
    FROM grammar 
    GROUP BY level 
    ORDER BY level DESC
  `);

  console.log('\n========== 导入完成 ==========');
  console.log(`新导入: ${totalImported} 个语法点`);
  console.log(`跳过(已存在): ${totalSkipped} 个`);
  console.log('\n各等级统计:');
  for (const row of stats) {
    console.log(`  ${row.level}: ${row.count} 个`);
  }

  const [total] = await connection.execute('SELECT COUNT(*) as total FROM grammar');
  console.log(`\n语法点总数: ${total[0].total}`);

  await connection.end();
}

main().catch(console.error);
