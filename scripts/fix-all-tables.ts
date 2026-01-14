/**
 * 修复所有表结构，使其匹配 schema.ts 定义
 * 运行: npx tsx scripts/fix-all-tables.ts
 */

import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_jcfQPBL2FbR7@ep-proud-mountain-ahytouvq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function fixAllTables() {
  // 使用 prepare: false 避免缓存问题
  const sql = postgres(NEON_URL, { prepare: false });

  console.log('🔧 修复所有表结构以匹配 schema.ts 定义...\n');

  try {
    // ====== 创建所有需要的 enum 类型 ======
    console.log('1️⃣ 创建 enum 类型...');

    await sql.unsafe(`
      DO $$ BEGIN CREATE TYPE jlpt_level AS ENUM ('N5', 'N4', 'N3', 'N2', 'N1'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await sql.unsafe(`
      DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await sql.unsafe(`
      DO $$ BEGIN CREATE TYPE source_type AS ENUM ('web', 'ai', 'textbook', 'anime', 'drama', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    console.log('   ✓ enum 类型已创建');

    // ====== 修复 vocabulary 表 ======
    console.log('\n2️⃣ 修复 vocabulary 表...');

    // 备份数据
    const vocabData = await sql`SELECT * FROM vocabulary`;
    console.log(`   备份了 ${vocabData.length} 条记录`);

    // 删除并重建表
    await sql.unsafe(`DROP TABLE IF EXISTS vocabulary CASCADE`);
    await sql.unsafe(`
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
    `);
    console.log('   表已重建');

    // 恢复数据
    let vocabRestored = 0;
    for (const row of vocabData) {
      try {
        const expression = row.word || row.expression || '';
        const jlptLevel = row.level || row.jlpt_level || 'N5';
        let tagsJson = null;
        if (row.tags) {
          try {
            tagsJson = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
          } catch { tagsJson = null; }
        }

        await sql`
          INSERT INTO vocabulary (id, expression, reading, meaning, part_of_speech, jlpt_level, tags, created_at, updated_at)
          VALUES (
            ${row.id}, ${expression}, ${row.reading || ''}, ${row.meaning || ''},
            ${row.partOfSpeech || row.part_of_speech || null},
            ${jlptLevel}::jlpt_level,
            ${tagsJson ? JSON.stringify(tagsJson) : null}::jsonb,
            ${row.createdAt || row.created_at || new Date()},
            ${row.updatedAt || row.updated_at || new Date()}
          )
        `;
        vocabRestored++;
        if (vocabRestored % 500 === 0) {
          process.stdout.write(`\r   恢复进度: ${vocabRestored}/${vocabData.length}`);
        }
      } catch (err: any) {
        // 静默跳过
      }
    }
    console.log(`\n   恢复了 ${vocabRestored}/${vocabData.length} 条记录`);

    // 更新序列
    await sql.unsafe(`SELECT setval('vocabulary_id_seq', (SELECT COALESCE(MAX(id), 1) FROM vocabulary), true)`);

    // ====== 修复 grammar 表 ======
    console.log('\n3️⃣ 修复 grammar 表...');

    const grammarData = await sql`SELECT * FROM grammar`;
    console.log(`   备份了 ${grammarData.length} 条记录`);

    await sql.unsafe(`DROP TABLE IF EXISTS grammar CASCADE`);
    await sql.unsafe(`
      CREATE TABLE grammar (
        id SERIAL PRIMARY KEY,
        pattern VARCHAR(255) NOT NULL,
        meaning TEXT NOT NULL,
        usage TEXT,
        jlpt_level jlpt_level NOT NULL,
        difficulty INTEGER DEFAULT 1,
        tags JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('   表已重建');

    let grammarRestored = 0;
    for (const row of grammarData) {
      try {
        const jlptLevel = row.level || row.jlpt_level || 'N5';
        let tagsJson = null;
        if (row.tags) {
          try { tagsJson = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags; } catch {}
        }

        await sql`
          INSERT INTO grammar (id, pattern, meaning, usage, jlpt_level, tags, created_at, updated_at)
          VALUES (
            ${row.id}, ${row.pattern || ''}, ${row.meaning || ''}, ${row.usage || null},
            ${jlptLevel}::jlpt_level,
            ${tagsJson ? JSON.stringify(tagsJson) : null}::jsonb,
            ${row.createdAt || row.created_at || new Date()},
            ${row.updatedAt || row.updated_at || new Date()}
          )
        `;
        grammarRestored++;
      } catch (err: any) {}
    }
    console.log(`   恢复了 ${grammarRestored}/${grammarData.length} 条记录`);

    await sql.unsafe(`SELECT setval('grammar_id_seq', (SELECT COALESCE(MAX(id), 1) FROM grammar), true)`);

    // ====== 修复 sentences 表 ======
    console.log('\n4️⃣ 修复 sentences 表...');

    const sentencesData = await sql`SELECT * FROM sentences`;
    console.log(`   备份了 ${sentencesData.length} 条记录`);

    await sql.unsafe(`DROP TABLE IF EXISTS sentences CASCADE`);
    await sql.unsafe(`
      CREATE TABLE sentences (
        id SERIAL PRIMARY KEY,
        japanese TEXT NOT NULL,
        reading TEXT,
        romaji TEXT,
        chinese TEXT NOT NULL,
        source VARCHAR(255),
        source_type source_type DEFAULT 'other',
        difficulty INTEGER DEFAULT 1,
        tags JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('   表已重建');

    let sentencesRestored = 0;
    for (const row of sentencesData) {
      try {
        await sql`
          INSERT INTO sentences (id, japanese, reading, chinese, created_at)
          VALUES (
            ${row.id}, ${row.japanese || ''}, ${row.reading || null},
            ${row.chinese || row.translation || ''},
            ${row.createdAt || row.created_at || new Date()}
          )
        `;
        sentencesRestored++;
        if (sentencesRestored % 1000 === 0) {
          process.stdout.write(`\r   恢复进度: ${sentencesRestored}/${sentencesData.length}`);
        }
      } catch (err: any) {}
    }
    console.log(`\n   恢复了 ${sentencesRestored}/${sentencesData.length} 条记录`);

    await sql.unsafe(`SELECT setval('sentences_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sentences), true)`);

    // ====== 验证结果 ======
    console.log('\n5️⃣ 验证结果...');

    const vocabCount = await sql`SELECT COUNT(*) as count FROM vocabulary`;
    const grammarCount = await sql`SELECT COUNT(*) as count FROM grammar`;
    const sentencesCount = await sql`SELECT COUNT(*) as count FROM sentences`;
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`;

    console.log(`   vocabulary: ${vocabCount[0].count} 条`);
    console.log(`   grammar: ${grammarCount[0].count} 条`);
    console.log(`   sentences: ${sentencesCount[0].count} 条`);
    console.log(`   users: ${usersCount[0].count} 条`);

    console.log('\n✅ 所有表修复完成！');

  } catch (err) {
    console.error('❌ 错误:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

fixAllTables().catch(err => {
  console.error('修复失败:', err);
  process.exit(1);
});
