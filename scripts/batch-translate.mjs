import { createConnection } from 'mysql2/promise';
import 'dotenv/config';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// 调用LLM API进行翻译
async function translateBatch(englishTexts) {
  const prompt = `请将以下英文释义翻译为简洁的中文,保持专业和准确。每行一个翻译结果,不要添加序号或其他内容。

${englishTexts.map((text, i) => `${i + 1}. ${text}`).join('\n')}

请按顺序返回翻译结果,每行一个:`;

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
        { role: 'system', content: '你是一个专业的日语-中文翻译助手。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const translated = data.choices[0].message.content.trim();
  
  // 解析翻译结果
  const lines = translated.split('\n').filter(line => line.trim());
  return lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
}

async function main() {
  console.log('开始批量翻译英文释义为中文...\n');
  
  const connection = await createConnection(process.env.DATABASE_URL);
  
  // 获取所有需要翻译的词汇
  const [vocabularies] = await connection.execute(`
    SELECT id, expression, meaning 
    FROM vocabulary 
    WHERE meaning REGEXP '^[a-zA-Z]'
    ORDER BY id
  `);
  
  console.log(`找到 ${vocabularies.length} 个需要翻译的词汇\n`);
  
  if (vocabularies.length === 0) {
    console.log('没有需要翻译的词汇');
    await connection.end();
    return;
  }
  
  const BATCH_SIZE = 20; // 每批翻译20个
  let translated = 0;
  let failed = 0;
  
  for (let i = 0; i < vocabularies.length; i += BATCH_SIZE) {
    const batch = vocabularies.slice(i, i + BATCH_SIZE);
    const englishTexts = batch.map(v => v.meaning);
    
    try {
      console.log(`正在翻译第 ${i + 1}-${Math.min(i + BATCH_SIZE, vocabularies.length)} 个词汇...`);
      
      const chineseTexts = await translateBatch(englishTexts);
      
      // 更新数据库
      for (let j = 0; j < batch.length; j++) {
        if (chineseTexts[j]) {
          await connection.execute(
            'UPDATE vocabulary SET meaning = ? WHERE id = ?',
            [chineseTexts[j], batch[j].id]
          );
          translated++;
          console.log(`  ✓ ${batch[j].expression}: ${batch[j].meaning} → ${chineseTexts[j]}`);
        } else {
          failed++;
          console.log(`  ✗ ${batch[j].expression}: 翻译失败`);
        }
      }
      
      // 避免API限流,每批之间暂停
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`批次翻译失败:`, error.message);
      failed += batch.length;
      
      // 出错后暂停更长时间
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 每100个词汇输出进度
    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= vocabularies.length) {
      console.log(`\n进度: ${Math.min(i + BATCH_SIZE, vocabularies.length)}/${vocabularies.length} (${Math.round(Math.min(i + BATCH_SIZE, vocabularies.length) / vocabularies.length * 100)}%)\n`);
    }
  }
  
  console.log('\n翻译完成!');
  console.log(`成功翻译: ${translated} 个`);
  console.log(`翻译失败: ${failed} 个`);
  
  // 验证结果
  const [result] = await connection.execute(`
    SELECT COUNT(*) as remaining 
    FROM vocabulary 
    WHERE meaning REGEXP '^[a-zA-Z]'
  `);
  
  console.log(`\n剩余未翻译: ${result[0].remaining} 个`);
  
  await connection.end();
}

main().catch(console.error);
