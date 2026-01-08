#!/usr/bin/env node
/**
 * 通过tRPC API批量导入词汇数据
 */

import fs from 'fs';
// Node.js 18+ has built-in fetch

const API_URL = 'http://localhost:3000/api/trpc';
const DATA_FILE = process.argv[2] || '/home/ubuntu/japanese-learning-app/data/jlpt_vocabulary_test.json';

async function importVocabulary(data) {
  console.log(`开始导入 ${data.length} 个词汇...`);
  
  const response = await fetch(`${API_URL}/admin.importVocabulary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      json: { data }
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  return result.result.data.json;
}

async function main() {
  console.log('=' .repeat(60));
  console.log('JLPT词汇数据导入工具 (via tRPC API)');
  console.log('=' .repeat(60));
  
  // 读取数据
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  console.log(`读取数据文件: ${DATA_FILE}`);
  console.log(`词汇数量: ${data.length}`);
  
  // 批量导入
  const result = await importVocabulary(data);
  
  console.log('\n' + '='.repeat(60));
  console.log('导入完成!');
  console.log(`成功: ${result.successCount}`);
  console.log(`跳过: ${result.skippedCount}`);
  console.log(`失败: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n错误详情:');
    result.errors.slice(0, 10).forEach(err => {
      console.log(`  - ${err}`);
    });
    if (result.errors.length > 10) {
      console.log(`  ... 还有 ${result.errors.length - 10} 个错误`);
    }
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
