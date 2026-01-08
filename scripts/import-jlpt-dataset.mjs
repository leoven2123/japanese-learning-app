#!/usr/bin/env node
/**
 * 导入JLPT词汇数据集到数据库
 * 从CSV文件读取并批量插入
 */

import fs from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const CSV_DIR = '/home/ubuntu/jlpt-word-list/src';

// 解析CSV文件
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= 3) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index] ? values[index].trim() : '';
      });
      data.push(obj);
    }
  }
  
  return data;
}

// 解析CSV行(处理引号)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// 导入词汇到数据库
async function importVocabulary(connection, level, data) {
  console.log(`\n开始导入 ${level} 词汇...`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const item of data) {
    try {
      // 检查是否已存在
      const [existing] = await connection.execute(
        'SELECT id FROM vocabulary WHERE expression = ? AND jlptLevel = ?',
        [item.expression, level]
      );
      
      if (existing.length > 0) {
        skipCount++;
        continue;
      }
      
      // 插入新词汇
      await connection.execute(
        `INSERT INTO vocabulary (expression, reading, meaning, jlptLevel, tags, category) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.expression,
          item.reading,
          item.meaning,
          level,
          item.tags || '',
          'standard'
        ]
      );
      
      successCount++;
      
      if (successCount % 100 === 0) {
        console.log(`  已导入 ${successCount} 个...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ✗ 失败: ${item.expression} - ${error.message}`);
    }
  }
  
  console.log(`  完成! 成功:${successCount}, 跳过:${skipCount}, 失败:${errorCount}`);
  return { successCount, skipCount, errorCount };
}

async function main() {
  console.log('=' .repeat(60));
  console.log('JLPT词汇数据集导入工具');
  console.log('=' .repeat(60));
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const totalStats = { successCount: 0, skipCount: 0, errorCount: 0 };
  
  for (const level of levels) {
    const csvFile = `${CSV_DIR}/${level.toLowerCase()}.csv`;
    
    if (!fs.existsSync(csvFile)) {
      console.log(`  跳过 ${level} (文件不存在)`);
      continue;
    }
    
    const data = parseCSV(csvFile);
    console.log(`  读取 ${level}: ${data.length} 个词汇`);
    
    const stats = await importVocabulary(connection, level, data);
    totalStats.successCount += stats.successCount;
    totalStats.skipCount += stats.skipCount;
    totalStats.errorCount += stats.errorCount;
  }
  
  await connection.end();
  
  console.log('\n' + '='.repeat(60));
  console.log('导入完成!');
  console.log(`总计: 成功${totalStats.successCount}, 跳过${totalStats.skipCount}, 失败${totalStats.errorCount}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
