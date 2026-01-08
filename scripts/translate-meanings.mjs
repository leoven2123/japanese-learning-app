import { createConnection } from 'mysql2/promise';
import 'dotenv/config';

const connection = await createConnection(process.env.DATABASE_URL);

async function translateMeanings() {
  console.log('开始批量翻译英文释义为中文...\n');
  
  // 获取所有英文释义的词汇
  const [rows] = await connection.execute(
    `SELECT id, expression, reading, meaning 
     FROM vocabulary 
     WHERE meaning REGEXP '^[A-Za-z]'
     ORDER BY id`
  );
  
  const total = rows.length;
  console.log(`找到 ${total} 个需要翻译的词汇\n`);
  
  if (total === 0) {
    console.log('没有需要翻译的词汇');
    await connection.end();
    return;
  }
  
  let translated = 0;
  let failed = 0;
  
  // 分批处理,每批20个
  const batchSize = 20;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    try {
      // 构建批量翻译请求
      const translationPrompt = batch.map((row, idx) => 
        `${idx + 1}. ${row.expression} (${row.reading}): ${row.meaning}`
      ).join('\n');
      
      const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一个专业的日语翻译。请将下面的英文释义翻译为简洁准确的中文。只返回翻译结果,每行一个,格式为"序号. 中文释义",不要包含日文和英文。'
            },
            {
              role: 'user',
              content: translationPrompt
            }
          ]
        })
      });
      
      if (!response.ok) {
        console.error(`批次 ${Math.floor(i / batchSize) + 1} 翻译失败: ${response.statusText}`);
        failed += batch.length;
        continue;
      }
      
      const result = await response.json();
      const translations = result.choices[0].message.content.trim().split('\n');
      
      // 更新数据库
      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const translation = translations[j]?.replace(/^\d+\.\s*/, '').trim();
        
        if (translation && translation.length > 0) {
          await connection.execute(
            'UPDATE vocabulary SET meaning = ? WHERE id = ?',
            [translation, row.id]
          );
          translated++;
          console.log(`✓ [${translated}/${total}] ${row.expression}: ${row.meaning} → ${translation}`);
        } else {
          failed++;
          console.log(`✗ [${i + j + 1}/${total}] ${row.expression}: 翻译失败`);
        }
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`批次 ${Math.floor(i / batchSize) + 1} 处理失败:`, error.message);
      failed += batch.length;
    }
  }
  
  console.log(`\n翻译完成!`);
  console.log(`成功: ${translated}个`);
  console.log(`失败: ${failed}个`);
  
  await connection.end();
}

translateMeanings().catch(console.error);
