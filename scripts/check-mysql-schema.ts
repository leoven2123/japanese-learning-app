/**
 * 检查 MySQL 表结构
 */

import mysql from 'mysql2/promise';

const MYSQL_CONFIG = {
  host: 'gateway03.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'vYSQoPEMjLoro3N.root',
  password: '1A2x8jzQ6lGubct47HOZ',
  database: 'W7xsTD72zLTLxKgC6bEdsv',
  ssl: {
    rejectUnauthorized: true
  }
};

async function checkSchema() {
  const conn = await mysql.createConnection(MYSQL_CONFIG);

  // 检查 vocabulary 表结构
  console.log('=== vocabulary 表结构 ===');
  const [vocabCols] = await conn.query(`DESCRIBE vocabulary`);
  console.log(vocabCols);

  // 查看 vocabulary 示例数据
  console.log('\n=== vocabulary 示例数据 ===');
  const [vocabData] = await conn.query(`SELECT * FROM vocabulary LIMIT 2`);
  console.log(vocabData);

  // 检查 users 表结构
  console.log('\n=== users 表结构 ===');
  const [userCols] = await conn.query(`DESCRIBE users`);
  console.log(userCols);

  // 查看 users 示例数据
  console.log('\n=== users 示例数据 ===');
  const [userData] = await conn.query(`SELECT * FROM users LIMIT 2`);
  console.log(userData);

  // 检查 grammar 表结构
  console.log('\n=== grammar 表结构 ===');
  const [grammarCols] = await conn.query(`DESCRIBE grammar`);
  console.log(grammarCols);

  await conn.end();
}

checkSchema().catch(console.error);
