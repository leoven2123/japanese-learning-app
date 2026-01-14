/**
 * 数据迁移脚本: MySQL (TiDB) -> Neon PostgreSQL
 * 针对修复后的表结构（使用正确的列名和 enum 类型）
 */

import postgres from 'postgres';
import mysql from 'mysql2/promise';

// MySQL 配置
const MYSQL_CONFIG = {
  host: 'gateway03.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'vYSQoPEMjLoro3N.root',
  password: '1A2x8jzQ6lGubct47HOZ',
  database: 'W7xsTD72zLTLxKgC6bEdsv',
  ssl: { rejectUnauthorized: true },
};

// Neon PostgreSQL 配置
const NEON_URL = 'postgresql://neondb_owner:npg_jcfQPBL2FbR7@ep-proud-mountain-ahytouvq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  console.log('🚀 开始数据迁移: MySQL (TiDB) -> Neon PostgreSQL\n');

  const mysqlPool = mysql.createPool({
    ...MYSQL_CONFIG,
    waitForConnections: true,
    connectionLimit: 5,
  });

  const pgSql = postgres(NEON_URL, { prepare: false });

  try {
    // ====== 迁移 vocabulary ======
    console.log('📦 迁移 vocabulary 表...');

    const [vocabRows] = await mysqlPool.query<mysql.RowDataPacket[]>('SELECT * FROM vocabulary');
    console.log(`   MySQL 中有 ${vocabRows.length} 条记录`);

    // 清空现有数据
    await pgSql.unsafe('TRUNCATE TABLE vocabulary RESTART IDENTITY CASCADE');
    console.log('   已清空 PostgreSQL 表');

    let vocabSuccess = 0;
    for (const row of vocabRows) {
      try {
        let tagsJson = null;
        if (row.tags) {
          try { tagsJson = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags; } catch {}
        }

        await pgSql`
          INSERT INTO vocabulary (
            id, expression, reading, romaji, meaning, part_of_speech, jlpt_level,
            difficulty, tags, category, source, detailed_explanation,
            collocations, synonyms, antonyms, created_at, updated_at
          ) VALUES (
            ${row.id},
            ${row.expression || ''},
            ${row.reading || ''},
            ${row.romaji || null},
            ${row.meaning || ''},
            ${row.partOfSpeech || null},
            ${row.jlptLevel || 'N5'}::jlpt_level,
            ${row.difficulty || 1},
            ${tagsJson ? JSON.stringify(tagsJson) : null}::jsonb,
            ${row.category || 'standard'},
            ${row.source || null},
            ${row.detailedExplanation || null},
            ${row.collocations ? JSON.stringify(row.collocations) : null}::jsonb,
            ${row.synonyms ? JSON.stringify(row.synonyms) : null}::jsonb,
            ${row.antonyms ? JSON.stringify(row.antonyms) : null}::jsonb,
            ${row.createdAt || new Date()},
            ${row.updatedAt || new Date()}
          )
        `;
        vocabSuccess++;
        if (vocabSuccess % 500 === 0) {
          process.stdout.write(`\r   进度: ${vocabSuccess}/${vocabRows.length}`);
        }
      } catch (err: any) {
        // 静默跳过
      }
    }
    console.log(`\n   ✅ 迁移了 ${vocabSuccess}/${vocabRows.length} 条记录`);
    await pgSql.unsafe(`SELECT setval('vocabulary_id_seq', (SELECT COALESCE(MAX(id), 1) FROM vocabulary), true)`);

    // ====== 迁移 grammar ======
    console.log('\n📦 迁移 grammar 表...');

    const [grammarRows] = await mysqlPool.query<mysql.RowDataPacket[]>('SELECT * FROM grammar');
    console.log(`   MySQL 中有 ${grammarRows.length} 条记录`);

    await pgSql.unsafe('TRUNCATE TABLE grammar RESTART IDENTITY CASCADE');

    let grammarSuccess = 0;
    for (const row of grammarRows) {
      try {
        let tagsJson = null;
        if (row.tags) {
          try { tagsJson = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags; } catch {}
        }

        await pgSql`
          INSERT INTO grammar (id, pattern, meaning, usage, jlpt_level, difficulty, tags, created_at, updated_at)
          VALUES (
            ${row.id},
            ${row.pattern || ''},
            ${row.meaning || ''},
            ${row.usage || null},
            ${row.jlptLevel || 'N5'}::jlpt_level,
            ${row.difficulty || 1},
            ${tagsJson ? JSON.stringify(tagsJson) : null}::jsonb,
            ${row.createdAt || new Date()},
            ${row.updatedAt || new Date()}
          )
        `;
        grammarSuccess++;
      } catch (err: any) {}
    }
    console.log(`   ✅ 迁移了 ${grammarSuccess}/${grammarRows.length} 条记录`);
    await pgSql.unsafe(`SELECT setval('grammar_id_seq', (SELECT COALESCE(MAX(id), 1) FROM grammar), true)`);

    // ====== 迁移 sentences ======
    console.log('\n📦 迁移 sentences 表...');

    const [sentenceRows] = await mysqlPool.query<mysql.RowDataPacket[]>('SELECT * FROM sentences');
    console.log(`   MySQL 中有 ${sentenceRows.length} 条记录`);

    await pgSql.unsafe('TRUNCATE TABLE sentences RESTART IDENTITY CASCADE');

    let sentenceSuccess = 0;
    for (const row of sentenceRows) {
      try {
        await pgSql`
          INSERT INTO sentences (id, japanese, reading, romaji, chinese, source, difficulty, created_at)
          VALUES (
            ${row.id},
            ${row.japanese || ''},
            ${row.reading || null},
            ${row.romaji || null},
            ${row.chinese || ''},
            ${row.source || null},
            ${row.difficulty || 1},
            ${row.createdAt || new Date()}
          )
        `;
        sentenceSuccess++;
        if (sentenceSuccess % 1000 === 0) {
          process.stdout.write(`\r   进度: ${sentenceSuccess}/${sentenceRows.length}`);
        }
      } catch (err: any) {}
    }
    console.log(`\n   ✅ 迁移了 ${sentenceSuccess}/${sentenceRows.length} 条记录`);
    await pgSql.unsafe(`SELECT setval('sentences_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sentences), true)`);

    // ====== 迁移 learning_units ======
    console.log('\n📦 迁移 learning_units 表...');

    const [unitsRows] = await mysqlPool.query<mysql.RowDataPacket[]>('SELECT * FROM learning_units');
    console.log(`   MySQL 中有 ${unitsRows.length} 条记录`);

    if (unitsRows.length > 0) {
      await pgSql.unsafe('TRUNCATE TABLE learning_units RESTART IDENTITY CASCADE');

      let unitsSuccess = 0;
      for (const row of unitsRows) {
        try {
          await pgSql`
            INSERT INTO learning_units (
              id, unit_type, category, sub_category, title_ja, title_zh, description_ja,
              difficulty, jlpt_level, target_expressions, target_patterns, target_vocabulary_ids,
              target_grammar_ids, prerequisites, related_units, content, source_type, source_title,
              source_year, source_episode, source_url, order_index, is_published, created_at, updated_at
            ) VALUES (
              ${row.id},
              ${row.unitType || 'scene'}::unit_type,
              ${row.category || ''},
              ${row.subCategory || null},
              ${row.titleJa || ''},
              ${row.titleZh || null},
              ${row.descriptionJa || null},
              ${row.difficulty || 1},
              ${row.jlptLevel ? `${row.jlptLevel}` : null}::jlpt_level,
              ${row.targetExpressions ? JSON.stringify(row.targetExpressions) : null}::json,
              ${row.targetPatterns ? JSON.stringify(row.targetPatterns) : null}::json,
              ${row.targetVocabularyIds ? JSON.stringify(row.targetVocabularyIds) : null}::json,
              ${row.targetGrammarIds ? JSON.stringify(row.targetGrammarIds) : null}::json,
              ${row.prerequisites ? JSON.stringify(row.prerequisites) : null}::json,
              ${row.relatedUnits ? JSON.stringify(row.relatedUnits) : null}::json,
              ${row.content ? JSON.stringify(row.content) : null}::json,
              ${row.sourceType || null}::unit_source_type,
              ${row.sourceTitle || null},
              ${row.sourceYear || null},
              ${row.sourceEpisode || null},
              ${row.sourceUrl || null},
              ${row.orderIndex || 0},
              ${row.isPublished !== undefined ? row.isPublished : true},
              ${row.createdAt || new Date()},
              ${row.updatedAt || new Date()}
            )
          `;
          unitsSuccess++;
        } catch (err: any) {
          if (unitsSuccess < 3) console.log(`   ⚠️ 跳过 id=${row.id}: ${err.message.slice(0, 60)}`);
        }
      }
      console.log(`   ✅ 迁移了 ${unitsSuccess}/${unitsRows.length} 条记录`);
      await pgSql.unsafe(`SELECT setval('learning_units_id_seq', (SELECT COALESCE(MAX(id), 1) FROM learning_units), true)`);
    }

    // ====== 验证结果 ======
    console.log('\n📊 迁移结果:');
    const vocabCount = await pgSql`SELECT COUNT(*) as count FROM vocabulary`;
    const grammarCount = await pgSql`SELECT COUNT(*) as count FROM grammar`;
    const sentencesCount = await pgSql`SELECT COUNT(*) as count FROM sentences`;
    const unitsCount = await pgSql`SELECT COUNT(*) as count FROM learning_units`;

    console.log(`   vocabulary: ${vocabCount[0].count} 条`);
    console.log(`   grammar: ${grammarCount[0].count} 条`);
    console.log(`   sentences: ${sentencesCount[0].count} 条`);
    console.log(`   learning_units: ${unitsCount[0].count} 条`);

    console.log('\n🎉 迁移完成！');

  } finally {
    await mysqlPool.end();
    await pgSql.end();
  }
}

migrate().catch(err => {
  console.error('❌ 迁移失败:', err);
  process.exit(1);
});
