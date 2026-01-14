/**
 * 检查 PostgreSQL 表结构和数据统计
 */

import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_jcfQPBL2FbR7@ep-proud-mountain-ahytouvq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function checkSchema() {
  const sql = postgres(NEON_URL, { prepare: false });

  try {
    // 检查 learning_units 表是否存在
    console.log('=== learning_units 表结构 ===');
    const unitsCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'learning_units'
      ORDER BY ordinal_position
    `;

    if (unitsCols.length === 0) {
      console.log('  ⚠️ 表不存在!');
    } else {
      unitsCols.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

      // 检查数据量
      const count = await sql`SELECT COUNT(*) as count FROM learning_units`;
      console.log(`\n  数据量: ${count[0].count} 条`);
    }

    // 列出所有表
    console.log('\n=== 所有表 ===');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    tables.forEach(t => console.log(`  - ${t.table_name}`));

  } finally {
    await sql.end();
  }
}

checkSchema().catch(console.error);
