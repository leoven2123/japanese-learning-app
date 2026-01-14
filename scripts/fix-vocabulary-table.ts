/**
 * 修复 vocabulary 表结构，使其匹配 schema.ts 定义
 * 运行: npx tsx scripts/fix-vocabulary-table.ts
 */

import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_jcfQPBL2FbR7@ep-proud-mountain-ahytouvq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function fixVocabularyTable() {
  const sql = postgres(NEON_URL);

  console.log('🔧 修复 vocabulary 表结构...\n');

  try {
    // 1. 检查当前表结构
    console.log('1️⃣ 当前表结构:');
    const currentCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vocabulary'
      ORDER BY ordinal_position
    `;
    currentCols.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type}`));

    // 2. 备份数据
    console.log('\n2️⃣ 备份数据...');
    const data = await sql`SELECT * FROM vocabulary`;
    console.log(`   备份了 ${data.length} 条记录`);

    // 3. 创建 jlpt_level enum（如果不存在）
    console.log('\n3️⃣ 创建 enum 类型...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE jlpt_level AS ENUM ('N5', 'N4', 'N3', 'N2', 'N1');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // 4. 删除旧表并创建新表
    console.log('\n4️⃣ 重建 vocabulary 表...');
    await sql`DROP TABLE IF EXISTS vocabulary CASCADE`;

    await sql`
      CREATE TABLE vocabulary (
        id SERIAL PRIMARY KEY,
        expression VARCHAR(255) NOT NULL,
        reading VARCHAR(255) NOT NULL,
        romaji VARCHAR(255),
        meaning TEXT NOT NULL,
        part_of_speech VARCHAR(100),
        jlpt_level jlpt_level NOT NULL,
        difficulty INTEGER DEFAULT 1,
        tags JSONB,
        category VARCHAR(50) DEFAULT 'standard',
        source VARCHAR(255),
        detailed_explanation TEXT,
        collocations JSONB,
        synonyms JSONB,
        antonyms JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // 5. 恢复数据（映射旧列名到新列名）
    console.log('\n5️⃣ 恢复数据...');
    let restored = 0;
    for (const row of data) {
      try {
        await sql`
          INSERT INTO vocabulary (
            id, expression, reading, meaning, part_of_speech, jlpt_level,
            tags, created_at, updated_at
          ) VALUES (
            ${row.id},
            ${row.word || row.expression || ''},
            ${row.reading || ''},
            ${row.meaning || ''},
            ${row.partOfSpeech || row.part_of_speech || null},
            ${(row.level || row.jlpt_level || 'N5') as any},
            ${row.tags ? (typeof row.tags === 'string' ? row.tags : JSON.stringify(row.tags)) : null},
            ${row.createdAt || row.created_at || new Date()},
            ${row.updatedAt || row.updated_at || new Date()}
          )
        `;
        restored++;
      } catch (err: any) {
        console.log(`   ⚠️ 跳过 id=${row.id}: ${err.message.slice(0, 50)}`);
      }
    }
    console.log(`   恢复了 ${restored}/${data.length} 条记录`);

    // 6. 更新序列
    const maxId = await sql`SELECT MAX(id) as max_id FROM vocabulary`;
    if (maxId[0]?.max_id) {
      await sql`SELECT setval('vocabulary_id_seq', ${maxId[0].max_id}, true)`;
      console.log(`\n6️⃣ 序列已更新到 ${maxId[0].max_id}`);
    }

    // 7. 验证新表结构
    console.log('\n7️⃣ 新表结构:');
    const newCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vocabulary'
      ORDER BY ordinal_position
    `;
    newCols.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type}`));

    console.log('\n✅ vocabulary 表修复完成！');

  } catch (err) {
    console.error('❌ 错误:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

fixVocabularyTable().catch(err => {
  console.error('修复失败:', err);
  process.exit(1);
});
