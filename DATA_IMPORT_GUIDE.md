# 批量导入词汇和语法数据指南

本指南介绍如何将爬取的大量日语词汇和语法数据导入到数据库中。

---

## 方法一: 通过Web界面导入 (推荐,适合中小批量)

### 步骤:

1. **准备数据文件**
   
   将爬取的数据整理为JSON或CSV格式:

   **词汇数据格式 (vocabulary.json)**:
   ```json
   [
     {
       "expression": "会う",
       "reading": "あう",
       "meaning": "见面",
       "level": "N4"
     },
     {
       "expression": "青い",
       "reading": "あおい", 
       "meaning": "蓝色的",
       "level": "N4"
     }
   ]
   ```

   **语法数据格式 (grammar.json)**:
   ```json
   [
     {
       "pattern": "〜たことがある",
       "meaning": "曾经做过...",
       "level": "N4",
       "explanation": "表示过去的经验"
     }
   ]
   ```

2. **访问导入页面**
   - 打开应用: `https://your-domain.com/admin/import`
   - 选择数据类型(词汇或语法)
   - 上传JSON/CSV文件
   - 点击"开始导入"

3. **查看导入结果**
   - 系统会显示成功/失败数量
   - 自动跳过重复数据
   - 显示错误详情

---

## 方法二: 通过命令行脚本导入 (推荐,适合大批量)

### 步骤:

1. **准备数据文件**

   将数据保存为 `/home/ubuntu/japanese-learning-app/data/import-data.mjs`:

   ```javascript
   // 词汇数据
   export const vocabularyData = [
     { expression: "会う", reading: "あう", meaning: "见面", jlptLevel: "N4" },
     { expression: "青い", reading: "あおい", meaning: "蓝色的", jlptLevel: "N4" },
     // ... 更多数据
   ];

   // 语法数据
   export const grammarData = [
     { pattern: "〜たことがある", meaning: "曾经做过...", jlptLevel: "N4", usage: "表示过去的经验" },
     // ... 更多数据
   ];
   ```

2. **创建导入脚本**

   复制并修改 `/home/ubuntu/japanese-learning-app/scripts/direct-import-jlpt-data.mjs`:

   ```javascript
   import mysql from 'mysql2/promise';
   import { vocabularyData, grammarData } from '../data/import-data.mjs';

   const DATABASE_URL = process.env.DATABASE_URL;

   async function importData() {
     const connection = await mysql.createConnection(DATABASE_URL);
     
     console.log(`开始导入 ${vocabularyData.length} 个词汇...`);
     
     for (const vocab of vocabularyData) {
       try {
         // 检查是否已存在
         const [existing] = await connection.execute(
           'SELECT id FROM vocabulary WHERE expression = ?',
           [vocab.expression]
         );
         
         if (existing.length > 0) {
           console.log(`跳过已存在: ${vocab.expression}`);
           continue;
         }
         
         // 插入新词汇
         await connection.execute(
           'INSERT INTO vocabulary (expression, reading, meaning, jlptLevel) VALUES (?, ?, ?, ?)',
           [vocab.expression, vocab.reading, vocab.meaning, vocab.jlptLevel]
         );
         
         console.log(`✓ 导入: ${vocab.expression}`);
       } catch (error) {
         console.error(`✗ 失败: ${vocab.expression} - ${error.message}`);
       }
     }
     
     await connection.end();
     console.log('导入完成!');
   }

   importData();
   ```

3. **运行导入**

   ```bash
   cd /home/ubuntu/japanese-learning-app
   node scripts/your-import-script.mjs
   ```

---

## 方法三: 直接SQL导入 (最快,适合超大批量)

### 步骤:

1. **生成SQL文件**

   使用Python脚本将爬取数据转换为SQL:

   ```python
   import json

   with open('vocabulary.json', 'r', encoding='utf-8') as f:
       data = json.load(f)

   with open('import.sql', 'w', encoding='utf-8') as f:
       for item in data:
           sql = f"""INSERT INTO vocabulary (expression, reading, meaning, jlptLevel) 
                     VALUES ('{item['expression']}', '{item['reading']}', '{item['meaning']}', '{item['level']}')
                     ON DUPLICATE KEY UPDATE reading=VALUES(reading), meaning=VALUES(meaning);\\n"""
           f.write(sql)
   ```

2. **执行SQL导入**

   ```bash
   # 方式1: 通过webdev_execute_sql工具(小批量)
   # 在Manus对话中请求执行SQL

   # 方式2: 直接连接数据库(大批量)
   mysql -h gateway03.us-east-1.prod.aws.tidbcloud.com -P 4000 \\
         -u your_user -p your_db < import.sql
   ```

---

## 数据格式要求

### 词汇表 (vocabulary)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| expression | string | ✓ | 日文表达(汉字/假名) |
| reading | string | ✓ | 假名读音 |
| meaning | string | ✓ | 中文释义 |
| jlptLevel | enum | ✓ | JLPT等级: N5/N4/N3/N2/N1 |
| romaji | string | ✗ | 罗马音 |
| partOfSpeech | string | ✗ | 词性 |
| detailedExplanation | text | ✗ | 详细解释 |
| category | string | ✗ | 分类(默认standard,网络热词用slang) |

### 语法表 (grammar)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pattern | string | ✓ | 语法句型 |
| meaning | string | ✓ | 中文释义 |
| jlptLevel | enum | ✓ | JLPT等级: N5/N4/N3/N2/N1 |
| usage | text | ✗ | 用法说明 |
| formation | string | ✗ | 接续方法 |

---

## 性能优化建议

### 大批量导入(10万+条数据)

1. **分批导入**: 每批1000-5000条
   ```javascript
   const BATCH_SIZE = 1000;
   for (let i = 0; i < data.length; i += BATCH_SIZE) {
     const batch = data.slice(i, i + BATCH_SIZE);
     await importBatch(batch);
   }
   ```

2. **使用事务**: 提高导入速度
   ```javascript
   await connection.beginTransaction();
   try {
     // 批量插入
     await connection.commit();
   } catch (error) {
     await connection.rollback();
   }
   ```

3. **批量INSERT**: 使用单条SQL插入多行
   ```sql
   INSERT INTO vocabulary (expression, reading, meaning, jlptLevel) VALUES
   ('会う', 'あう', '见面', 'N4'),
   ('青い', 'あおい', '蓝色的', 'N4'),
   ('赤い', 'あかい', '红色的', 'N4');
   ```

---

## 常见问题

### Q: 如何避免重复数据?
A: 脚本会自动检查`expression`字段,跳过已存在的词汇。或使用SQL的`ON DUPLICATE KEY UPDATE`。

### Q: 导入失败怎么办?
A: 检查错误日志,常见问题:
- 字段名拼写错误
- 数据类型不匹配
- 缺少必填字段
- 字符编码问题(确保UTF-8)

### Q: 可以导入多少数据?
A: 当前数据库支持5-10GB,理论上可存储100万+条词汇。

### Q: 如何验证导入成功?
A: 运行查询:
```sql
SELECT jlptLevel, COUNT(*) as count 
FROM vocabulary 
GROUP BY jlptLevel;
```

---

## 示例: 完整导入流程

```bash
# 1. 准备数据
cd /home/ubuntu/japanese-learning-app
mkdir -p data

# 2. 将爬取的数据保存为JSON
cat > data/n5-vocabulary.json << 'EOF'
[
  {"expression": "会う", "reading": "あう", "meaning": "见面", "level": "N5"},
  {"expression": "青い", "reading": "あおい", "meaning": "蓝色的", "level": "N5"}
]
EOF

# 3. 运行导入脚本
node scripts/direct-import-jlpt-data.mjs

# 4. 验证导入
# 在应用中访问 /vocabulary 查看新数据
```

---

## 需要帮助?

如果遇到问题,可以:
1. 查看应用日志: `pnpm dev` 的输出
2. 检查数据库: 访问 Database 面板
3. 运行测试: `pnpm test`

---

**提示**: 建议先用小批量数据(10-100条)测试导入流程,确认无误后再导入全部数据。
