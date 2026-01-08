import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析CSV文件
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index].trim();
      });
      data.push(row);
    }
  }
  return data;
}

// 解析CSV行(处理引号内的逗号)
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

// 提取词性
function extractPartOfSpeech(meaning) {
  const posPatterns = {
    noun: /\b(noun|n\.)\b/i,
    verb: /\b(verb|v\.)\b/i,
    adjective: /\b(adjective|adj\.)\b/i,
    adverb: /\b(adverb|adv\.)\b/i,
    particle: /\b(particle)\b/i,
    conjunction: /\b(conjunction)\b/i,
    interjection: /\b(interjection)\b/i,
  };

  for (const [pos, pattern] of Object.entries(posPatterns)) {
    if (pattern.test(meaning)) {
      return pos;
    }
  }
  return "other";
}

// 导入词汇数据
async function importVocabulary(connection, level, csvPath) {
  console.log(`\n开始导入${level}级别词汇...`);
  const data = parseCSV(csvPath);
  console.log(`读取到${data.length}个词汇`);

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    try {
      const kanji = row.expression || "";
      const hiragana = row.reading || "";
      const meaning = row.meaning || "";
      const chineseMeaning = meaning; // 暂时使用英文,后续可批量翻译
      const partOfSpeech = extractPartOfSpeech(meaning);

      // 使用原生SQL插入
      const sql = `
        INSERT INTO vocabulary (expression, reading, romaji, meaning, partOfSpeech, jlptLevel, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          reading = VALUES(reading),
          meaning = VALUES(meaning),
          jlptLevel = VALUES(jlptLevel),
          updatedAt = NOW()
      `;

      await connection.execute(sql, [
        kanji,
        hiragana,
        "", // romaji暂时为空
        chineseMeaning,
        partOfSpeech,
        level,
      ]);

      imported++;
      if (imported % 100 === 0) {
        console.log(`已导入${imported}个词汇...`);
      }
    } catch (error) {
      console.error(`导入词汇失败: ${row.expression}`, error.message);
      skipped++;
    }
  }

  console.log(`${level}级别词汇导入完成: 成功${imported}个, 跳过${skipped}个`);
  return { imported, skipped };
}

// 主函数
async function main() {
  let connection;
  try {
    console.log("=== 开始批量导入JLPT词汇 ===");

    // 创建数据库连接
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("数据库连接成功");

    const dataDir = "/home/ubuntu/jlpt-data";
    const levels = [
      { level: "N3", file: "n3.csv" },
      { level: "N2", file: "n2.csv" },
      { level: "N1", file: "n1.csv" },
    ];

    let totalImported = 0;
    let totalSkipped = 0;

    for (const { level, file } of levels) {
      const csvPath = path.join(dataDir, file);
      if (fs.existsSync(csvPath)) {
        const result = await importVocabulary(connection, level, csvPath);
        totalImported += result.imported;
        totalSkipped += result.skipped;
      } else {
        console.error(`文件不存在: ${csvPath}`);
      }
    }

    console.log("\n=== 导入完成 ===");
    console.log(`总计: 成功${totalImported}个, 跳过${totalSkipped}个`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("导入失败:", error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

main();
