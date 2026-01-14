import mysql from 'mysql2/promise';

const MYSQL_CONFIG = {
  host: 'gateway03.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'vYSQoPEMjLoro3N.root',
  password: '1A2x8jzQ6lGubct47HOZ',
  database: 'W7xsTD72zLTLxKgC6bEdsv',
  ssl: { rejectUnauthorized: true }
};

async function check() {
  const conn = await mysql.createConnection(MYSQL_CONFIG);

  console.log('=== sentences 表结构 ===');
  const [cols] = await conn.query(`DESCRIBE sentences`);
  console.log(cols);

  console.log('\n=== sentences 示例数据 ===');
  const [data] = await conn.query(`SELECT * FROM sentences LIMIT 3`);
  console.log(data);

  await conn.end();
}

check().catch(console.error);
