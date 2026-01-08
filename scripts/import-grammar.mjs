import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从环境变量读取数据库连接
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function importGrammar() {
  const connection = await mysql.createConnection(DATABASE_URL);

  console.log('Starting grammar import...');

  // 读取SQL文件
  const sqlFile = path.join(__dirname, '../../jlpt-data/grammar_all.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
  
  // 分割成单独的SQL语句
  const statements = sqlContent.split(';').filter(s => s.trim());
  
  console.log(`Found ${statements.length} SQL statements`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    
    try {
      await connection.query(stmt);
      successCount++;
      
      if ((i + 1) % 100 === 0) {
        console.log(`Processed ${i + 1}/${statements.length} statements...`);
      }
    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {  // 只显示前5个错误
        console.error(`Error in statement ${i + 1}:`, error.message);
      }
    }
  }
  
  console.log(`\nImport completed:`);
  console.log(`- Success: ${successCount}`);
  console.log(`- Errors: ${errorCount}`);
  
  await connection.end();
}

importGrammar().catch(console.error);
