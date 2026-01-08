import { createConnection } from 'mysql2/promise';
import 'dotenv/config';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// 调用LLM API生成例句
async function generateSentences(vocab) {
  const prompt = `请为日语词汇"${vocab.expression}"(${vocab.reading}, ${vocab.meaning})生成2-3个实用例句。

要求:
1. 每个例句都要包含这个词汇
2. 例句要符合${vocab.jlptLevel}等级的难度
3. 例句要贴近日常生活场景
4. 如果词性是${vocab.partOfSpeech},请使用相应的语法结构
5. 返回JSON格式,包含japanese(日文)、reading(假名标注)、chinese(中文翻译)

返回格式示例:
[
  {
    "japanese": "今日は天気がいいですね。",
    "reading": "きょうはてんきがいいですね。",
    "chinese": "今天天气真好啊。"
  }
]`;

  const apiUrl = FORGE_API_URL && FORGE_API_URL.trim().length > 0
    ? `${FORGE_API_URL.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${FORGE_API_KEY}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: '你是一个专业的日语教学助手,擅长创作实用的日语例句。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sentences',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              sentences: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    japanese: { type: 'string' },
                    reading: { type: 'string' },
                    chinese: { type: 'string' }
                  },
                  required: ['japanese', 'reading', 'chinese'],
                  additionalProperties: false
                }
              }
            },
            required: ['sentences'],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  const result = JSON.parse(content);
  
  return result.sentences || [];
}

async function main() {
  console.log('开始批量生成词汇例句...\n');
  
  const connection = await createConnection(process.env.DATABASE_URL);
  
  // 获取所有没有例句的词汇(排除已有例句的28个)
  const [vocabularies] = await connection.execute(`
    SELECT v.* 
    FROM vocabulary v
    LEFT JOIN vocabulary_sentences vs ON v.id = vs.vocabularyId
    WHERE vs.vocabularyId IS NULL
    ORDER BY v.id
  `);
  
  console.log(`找到 ${vocabularies.length} 个需要生成例句的词汇\n`);
  
  if (vocabularies.length === 0) {
    console.log('所有词汇都已有例句');
    await connection.end();
    return;
  }
  
  const BATCH_SIZE = 10; // 每批处理10个词汇
  let generated = 0;
  let failed = 0;
  let totalSentences = 0;
  
  for (let i = 0; i < vocabularies.length; i += BATCH_SIZE) {
    const batch = vocabularies.slice(i, i + BATCH_SIZE);
    
    for (const vocab of batch) {
      try {
        console.log(`[${i + batch.indexOf(vocab) + 1}/${vocabularies.length}] 正在为"${vocab.expression}"生成例句...`);
        
        const sentences = await generateSentences(vocab);
        
        if (sentences.length === 0) {
          console.log(`  ✗ 生成失败: 没有返回例句`);
          failed++;
          continue;
        }
        
        // 插入例句并关联
        for (const sentence of sentences) {
          // 插入例句
          const [result] = await connection.execute(
            'INSERT INTO sentences (japanese, reading, chinese, sourceType, difficulty) VALUES (?, ?, ?, ?, ?)',
            [sentence.japanese, sentence.reading, sentence.chinese, 'ai', vocab.difficulty || 1]
          );
          
          const sentenceId = result.insertId;
          
          // 创建关联
          await connection.execute(
            'INSERT INTO vocabulary_sentences (vocabularyId, sentenceId) VALUES (?, ?)',
            [vocab.id, sentenceId]
          );
          
          totalSentences++;
        }
        
        generated++;
        console.log(`  ✓ 成功生成 ${sentences.length} 个例句`);
        
        // 避免API限流
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ✗ 生成失败:`, error.message);
        failed++;
        
        // 出错后暂停更长时间
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 每批之间暂停
    if (i + BATCH_SIZE < vocabularies.length) {
      console.log(`\n已完成 ${Math.min(i + BATCH_SIZE, vocabularies.length)}/${vocabularies.length} (${Math.round(Math.min(i + BATCH_SIZE, vocabularies.length) / vocabularies.length * 100)}%)\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n生成完成!');
  console.log(`成功生成: ${generated} 个词汇的例句`);
  console.log(`生成失败: ${failed} 个词汇`);
  console.log(`总例句数: ${totalSentences} 个`);
  
  // 验证结果
  const [result] = await connection.execute(`
    SELECT COUNT(DISTINCT vocabularyId) as withSentences 
    FROM vocabulary_sentences
  `);
  
  const [totalResult] = await connection.execute(`
    SELECT COUNT(*) as total FROM sentences
  `);
  
  console.log(`\n数据库统计:`);
  console.log(`有例句的词汇: ${result[0].withSentences} 个`);
  console.log(`例句总数: ${totalResult[0].total} 个`);
  
  await connection.end();
}

main().catch(console.error);
