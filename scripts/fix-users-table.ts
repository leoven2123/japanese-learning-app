/**
 * 修复 users 表结构，支持账密登录
 * 运行: npx tsx scripts/fix-users-table.ts
 */

import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_jcfQPBL2FbR7@ep-proud-mountain-ahytouvq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function fixUsersTable() {
  const sql = postgres(NEON_URL);

  console.log('🔧 修复 users 表结构...\n');

  try {
    // 1. 删除依赖 users 表的外键约束
    console.log('1️⃣ 删除外键约束...');

    // 获取所有引用 users 表的外键
    const fks = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
    `;

    for (const fk of fks) {
      console.log(`   删除 ${fk.table_name}.${fk.constraint_name}`);
      await sql`ALTER TABLE ${sql(fk.table_name)} DROP CONSTRAINT IF EXISTS ${sql(fk.constraint_name)}`;
    }

    // 2. 删除旧的 users 表
    console.log('\n2️⃣ 删除旧 users 表...');
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // 3. 创建 user_role enum（如果不存在）
    console.log('\n3️⃣ 创建 enum 类型...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // 4. 创建新的 users 表（符合 schema.ts 定义）
    console.log('\n4️⃣ 创建新 users 表...');
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE,
        email VARCHAR(320) UNIQUE,
        password_hash VARCHAR(255),
        name TEXT,
        role user_role NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_signed_in TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // 5. 验证新表结构
    console.log('\n5️⃣ 验证新表结构...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 新 users 表结构:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ users 表修复完成！');
    console.log('   现在支持 username + password_hash 账密登录');

  } catch (err) {
    console.error('❌ 错误:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

fixUsersTable().catch(err => {
  console.error('修复失败:', err);
  process.exit(1);
});
