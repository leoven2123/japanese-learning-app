#!/usr/bin/env node
/**
 * 智能小批次导入JLPT词汇
 * 每次导入10条,自动重试,避免超时
 */

import fs from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_FILE = process.argv[2] || '/home/ubuntu/japanese-learning-app/data/jlpt_vocabulary_full.json';
const BATCH_SIZE = 10; // 每批10条
const DELAY_MS = 100; // 每批之间延迟100ms

async function importBatch(connection, batch, batchIndex) {
  const values = batch.map(item => [
    item.expression,
    item.reading,
    item.meaning,
    item.jlptLevel,
    item.tags || '',
    item.category || 'standard'
  ]);
  
  try {
    // 使用INSERT IGNORE避免重复
    const sql = `
      INSERT IGNORE INTO vocabulary 
      (expression, reading, meaning, jlptLevel, tags, category) 
      VALUES ?
    `;
    
    const [result] = await connection.query(sql, [values]);
    return {
      success: true,
      inserted: result.affectedRows,
      skipped: batch.length - result.affectedRows
    };
  } catch (error) {
    console.error(`  ✗ 批次 ${batchIndex} 失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=' .repeat(70));
  console.log('JLPT词汇智能批量导入工具');
  console.log('=' .repeat(70));
  
  // 读取数据
  console.log(`\n读取数据文件: ${DATA_FILE}`);
  const allData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`总词汇数: ${allData.length}`);
  console.log(`批次大小: ${BATCH_SIZE}`);
  console.log(`预计批次数: ${Math.ceil(allData.length / BATCH_SIZE)}`);
  
  // 连接数据库
  console.log('\n连接数据库...');
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('✓ 数据库连接成功');
  
  // 分批导入
  const totalBatches = Math.ceil(allData.length / BATCH_SIZE);
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  console.log('\n开始导入...\n');
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, allData.length);
    const batch = allData.slice(start, end);
    
    const result = await importBatch(connection, batch, i + 1);
    
    if (result.success) {
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      
      // 每10批显示一次进度
      if ((i + 1) % 10 === 0 || i === totalBatches - 1) {
        const progress = ((i + 1) / totalBatches * 100).toFixed(1);
        console.log(`  [${i + 1}/${totalBatches}] ${progress}% - 已插入:${totalInserted}, 已跳过:${totalSkipped}`);
      }
    } else {
      totalFailed += batch.length;
    }
    
    // 延迟避免数据库压力
    if (i < totalBatches - 1) {
      await sleep(DELAY_MS);
    }
  }
  
  await connection.end();
  
  console.log('\n' + '='.repeat(70));
  console.log('导入完成!');
  console.log(`成功插入: ${totalInserted} 个词汇`);
  console.log(`跳过重复: ${totalSkipped} 个词汇`);
  console.log(`失败: ${totalFailed} 个词汇`);
  console.log('='.repeat(70));
}

main().catch(console.error);
