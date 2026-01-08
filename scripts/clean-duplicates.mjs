import { createConnection } from 'mysql2/promise';
import 'dotenv/config';

const connection = await createConnection(process.env.DATABASE_URL);

async function cleanDuplicates() {
  console.log('开始清理重复词汇...\n');
  
  // 查找所有重复的expression
  const [duplicates] = await connection.execute(`
    SELECT expression, COUNT(*) as count 
    FROM vocabulary 
    GROUP BY expression 
    HAVING count > 1
  `);
  
  console.log(`找到 ${duplicates.length} 个重复的词汇\n`);
  
  if (duplicates.length === 0) {
    console.log('没有重复词汇需要清理');
    await connection.end();
    return;
  }
  
  let totalDeleted = 0;
  
  for (const dup of duplicates) {
    const expression = dup.expression;
    
    // 获取该expression的所有记录,按ID排序
    const [records] = await connection.execute(
      'SELECT id, createdAt FROM vocabulary WHERE expression = ? ORDER BY id DESC',
      [expression]
    );
    
    if (records.length <= 1) continue;
    
    // 保留最新的(ID最大的),删除其他的
    const keepId = records[0].id;
    const deleteIds = records.slice(1).map(r => r.id);
    
    // 批量删除旧记录
    if (deleteIds.length > 0) {
      await connection.execute(
        `DELETE FROM vocabulary WHERE id IN (${deleteIds.join(',')})` 
      );
      totalDeleted += deleteIds.length;
      console.log(`✓ ${expression}: 保留ID ${keepId}, 删除 ${deleteIds.length} 个旧记录`);
    }
  }
  
  console.log(`\n清理完成!`);
  console.log(`删除了 ${totalDeleted} 个重复词汇`);
  console.log(`保留了 ${duplicates.length} 个唯一词汇`);
  
  // 验证结果
  const [result] = await connection.execute('SELECT COUNT(*) as total FROM vocabulary');
  console.log(`\n当前词汇总数: ${result[0].total}`);
  
  await connection.end();
}

cleanDuplicates().catch(console.error);
