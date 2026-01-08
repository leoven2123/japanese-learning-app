/**
 * 直接通过数据库导入JLPT数据
 * 绕过API认证,直接操作数据库
 */

import mysql from 'mysql2/promise';

// 从环境变量获取数据库连接
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 环境变量未设置');
  process.exit(1);
}

// N4词汇数据 (精选30个常用词)
const n4Vocabulary = [
  { expression: "会う", reading: "あう", meaning: "见面", jlptLevel: "N4" },
  { expression: "青い", reading: "あおい", meaning: "蓝色的", jlptLevel: "N4" },
  { expression: "赤い", reading: "あかい", meaning: "红色的", jlptLevel: "N4" },
  { expression: "秋", reading: "あき", meaning: "秋天", jlptLevel: "N4" },
  { expression: "開ける", reading: "あける", meaning: "打开", jlptLevel: "N4" },
  { expression: "上げる", reading: "あげる", meaning: "给予;举起", jlptLevel: "N4" },
  { expression: "朝", reading: "あさ", meaning: "早晨", jlptLevel: "N4" },
  { expression: "朝ご飯", reading: "あさごはん", meaning: "早饭", jlptLevel: "N4" },
  { expression: "明後日", reading: "あさって", meaning: "后天", jlptLevel: "N4" },
  { expression: "足", reading: "あし", meaning: "脚;腿", jlptLevel: "N4" },
  { expression: "遊ぶ", reading: "あそぶ", meaning: "玩", jlptLevel: "N4" },
  { expression: "暖かい", reading: "あたたかい", meaning: "温暖的", jlptLevel: "N4" },
  { expression: "頭", reading: "あたま", meaning: "头;头脑", jlptLevel: "N4" },
  { expression: "新しい", reading: "あたらしい", meaning: "新的", jlptLevel: "N4" },
  { expression: "暑い", reading: "あつい", meaning: "热的", jlptLevel: "N4" },
  { expression: "厚い", reading: "あつい", meaning: "厚的", jlptLevel: "N4" },
  { expression: "集まる", reading: "あつまる", meaning: "聚集", jlptLevel: "N4" },
  { expression: "集める", reading: "あつめる", meaning: "收集", jlptLevel: "N4" },
  { expression: "後", reading: "あと", meaning: "后面;之后", jlptLevel: "N4" },
  { expression: "兄", reading: "あに", meaning: "哥哥", jlptLevel: "N4" },
  { expression: "姉", reading: "あね", meaning: "姐姐", jlptLevel: "N4" },
  { expression: "アパート", reading: "あぱーと", meaning: "公寓", jlptLevel: "N4" },
  { expression: "危ない", reading: "あぶない", meaning: "危险的", jlptLevel: "N4" },
  { expression: "甘い", reading: "あまい", meaning: "甜的", jlptLevel: "N4" },
  { expression: "雨", reading: "あめ", meaning: "雨", jlptLevel: "N4" },
  { expression: "洗う", reading: "あらう", meaning: "洗", jlptLevel: "N4" },
  { expression: "歩く", reading: "あるく", meaning: "走;步行", jlptLevel: "N4" },
  { expression: "いくつ", reading: "いくつ", meaning: "几个;多少", jlptLevel: "N4" },
  { expression: "医者", reading: "いしゃ", meaning: "医生", jlptLevel: "N4" },
  { expression: "椅子", reading: "いす", meaning: "椅子", jlptLevel: "N4" },
];

// 语法数据 (精选35个语法点)
const grammarData = [
  // N4语法
  { pattern: "〜たことがある", meaning: "曾经做过...", jlptLevel: "N4", usage: "表示过去的经验" },
  { pattern: "〜たり〜たりする", meaning: "又...又...", jlptLevel: "N4", usage: "列举多个动作或状态" },
  { pattern: "〜ば", meaning: "如果...", jlptLevel: "N4", usage: "假定条件" },
  { pattern: "〜なければならない", meaning: "必须...", jlptLevel: "N4", usage: "表示义务" },
  { pattern: "〜てもいい", meaning: "可以...", jlptLevel: "N4", usage: "表示许可" },
  { pattern: "〜てはいけない", meaning: "不可以...", jlptLevel: "N4", usage: "表示禁止" },
  { pattern: "〜ようと思う", meaning: "打算...", jlptLevel: "N4", usage: "表示意志" },
  { pattern: "〜そうだ", meaning: "好像...", jlptLevel: "N4", usage: "表示样态" },
  { pattern: "〜ために", meaning: "为了...", jlptLevel: "N4", usage: "表示目的" },
  { pattern: "〜あいだに", meaning: "在...期间", jlptLevel: "N4", usage: "表示时间范围" },
  { pattern: "〜てしまう", meaning: "完全...了", jlptLevel: "N4", usage: "表示完了或遗憾" },
  { pattern: "〜やすい", meaning: "容易...", jlptLevel: "N4", usage: "表示容易程度" },
  { pattern: "〜にくい", meaning: "难以...", jlptLevel: "N4", usage: "表示困难程度" },
  { pattern: "〜ておく", meaning: "预先...", jlptLevel: "N4", usage: "表示准备" },
  { pattern: "〜てみる", meaning: "试着...", jlptLevel: "N4", usage: "表示尝试" },
  
  // N3语法
  { pattern: "〜ことになる", meaning: "决定...", jlptLevel: "N3", usage: "表示客观决定" },
  { pattern: "〜ことにする", meaning: "决定...", jlptLevel: "N3", usage: "表示主观决定" },
  { pattern: "〜ばかり", meaning: "总是...", jlptLevel: "N3", usage: "表示反复或过度" },
  { pattern: "〜はずだ", meaning: "应该...", jlptLevel: "N3", usage: "表示推测" },
  { pattern: "〜わけだ", meaning: "难怪...", jlptLevel: "N3", usage: "表示理所当然" },
  { pattern: "〜ところだ", meaning: "正在...", jlptLevel: "N3", usage: "表示动作的时间点" },
  { pattern: "〜うちに", meaning: "趁着...", jlptLevel: "N3", usage: "表示时机" },
  { pattern: "〜おかげで", meaning: "多亏...", jlptLevel: "N3", usage: "表示积极原因" },
  { pattern: "〜せいで", meaning: "因为...", jlptLevel: "N3", usage: "表示消极原因" },
  { pattern: "〜によって", meaning: "根据...", jlptLevel: "N3", usage: "表示依据或手段" },
  
  // N2语法
  { pattern: "〜にしては", meaning: "作为...来说", jlptLevel: "N2", usage: "表示意外或不相称" },
  { pattern: "〜にとって", meaning: "对于...来说", jlptLevel: "N2", usage: "表示立场" },
  { pattern: "〜わけではない", meaning: "并不是...", jlptLevel: "N2", usage: "表示部分否定" },
  { pattern: "〜わけにはいかない", meaning: "不能...", jlptLevel: "N2", usage: "表示不可能或不应该" },
  { pattern: "〜ものだ", meaning: "应该...", jlptLevel: "N2", usage: "表示忠告或感慨" },
  { pattern: "〜ことはない", meaning: "没必要...", jlptLevel: "N2", usage: "表示不必要" },
  { pattern: "〜に違いない", meaning: "一定...", jlptLevel: "N2", usage: "表示确信" },
  { pattern: "〜かもしれない", meaning: "也许...", jlptLevel: "N2", usage: "表示可能性" },
  { pattern: "〜に関して", meaning: "关于...", jlptLevel: "N2", usage: "表示话题" },
  { pattern: "〜について", meaning: "关于...", jlptLevel: "N2", usage: "表示对象" },
];

async function importData() {
  console.log('开始批量导入JLPT数据...\n');
  
  let connection;
  let vocabSuccess = 0;
  let vocabFailed = 0;
  let grammarSuccess = 0;
  let grammarFailed = 0;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection(DATABASE_URL);
    
    // 导入词汇
    console.log(`📚 正在导入 ${n4Vocabulary.length} 个N4词汇...`);
    for (const vocab of n4Vocabulary) {
      try {
        // 检查是否已存在
        const [existing] = await connection.execute(
          'SELECT id FROM vocabulary WHERE expression = ?',
          [vocab.expression]
        );
        
        if (existing.length > 0) {
          console.log(`  ⊘ 跳过已存在的词汇: ${vocab.expression}`);
          vocabFailed++;
          continue;
        }
        
        // 插入新词汇
        await connection.execute(
          'INSERT INTO vocabulary (expression, reading, meaning, jlptLevel) VALUES (?, ?, ?, ?)',
          [vocab.expression, vocab.reading, vocab.meaning, vocab.jlptLevel]
        );
        vocabSuccess++;
        console.log(`  ✓ 导入词汇: ${vocab.expression}`);
      } catch (error) {
        vocabFailed++;
        console.log(`  ✗ 导入失败: ${vocab.expression} - ${error.message}`);
      }
    }
    
    console.log(`\n词汇导入完成: 成功 ${vocabSuccess} 个, 跳过/失败 ${vocabFailed} 个\n`);
    
    // 导入语法
    console.log(`📖 正在导入 ${grammarData.length} 个语法点...`);
    for (const gram of grammarData) {
      try {
        // 检查是否已存在
        const [existing] = await connection.execute(
          'SELECT id FROM grammar WHERE pattern = ?',
          [gram.pattern]
        );
        
        if (existing.length > 0) {
          console.log(`  ⊘ 跳过已存在的语法: ${gram.pattern}`);
          grammarFailed++;
          continue;
        }
        
        // 插入新语法
        await connection.execute(
          'INSERT INTO grammar (pattern, meaning, jlptLevel, `usage`) VALUES (?, ?, ?, ?)',
          [gram.pattern, gram.meaning, gram.jlptLevel, gram.usage]
        );
        grammarSuccess++;
        console.log(`  ✓ 导入语法: ${gram.pattern}`);
      } catch (error) {
        grammarFailed++;
        console.log(`  ✗ 导入失败: ${gram.pattern} - ${error.message}`);
      }
    }
    
    console.log(`\n语法导入完成: 成功 ${grammarSuccess} 个, 跳过/失败 ${grammarFailed} 个\n`);
    console.log('✅ 所有数据导入完成!');
    console.log(`\n总计: 词汇 ${vocabSuccess}/${n4Vocabulary.length}, 语法 ${grammarSuccess}/${grammarData.length}`);
    
  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行导入
importData();
