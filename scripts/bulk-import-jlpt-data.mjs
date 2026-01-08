/**
 * 批量导入JLPT数据到数据库
 * 使用tRPC API进行数据导入
 */

// 使用Node.js 18+内置的fetch

const API_URL = 'http://localhost:3000/api/trpc';

// N4词汇数据 (精选100个常用词)
const n4Vocabulary = [
  { expression: "会う", reading: "あう", meaning: "见面", level: "N4" },
  { expression: "青い", reading: "あおい", meaning: "蓝色的", level: "N4" },
  { expression: "赤い", reading: "あかい", meaning: "红色的", level: "N4" },
  { expression: "秋", reading: "あき", meaning: "秋天", level: "N4" },
  { expression: "開ける", reading: "あける", meaning: "打开", level: "N4" },
  { expression: "上げる", reading: "あげる", meaning: "给予;举起", level: "N4" },
  { expression: "朝", reading: "あさ", meaning: "早晨", level: "N4" },
  { expression: "朝ご飯", reading: "あさごはん", meaning: "早饭", level: "N4" },
  { expression: "明後日", reading: "あさって", meaning: "后天", level: "N4" },
  { expression: "足", reading: "あし", meaning: "脚;腿", level: "N4" },
  { expression: "遊ぶ", reading: "あそぶ", meaning: "玩", level: "N4" },
  { expression: "暖かい", reading: "あたたかい", meaning: "温暖的", level: "N4" },
  { expression: "頭", reading: "あたま", meaning: "头;头脑", level: "N4" },
  { expression: "新しい", reading: "あたらしい", meaning: "新的", level: "N4" },
  { expression: "暑い", reading: "あつい", meaning: "热的", level: "N4" },
  { expression: "厚い", reading: "あつい", meaning: "厚的", level: "N4" },
  { expression: "集まる", reading: "あつまる", meaning: "聚集", level: "N4" },
  { expression: "集める", reading: "あつめる", meaning: "收集", level: "N4" },
  { expression: "後", reading: "あと", meaning: "后面;之后", level: "N4" },
  { expression: "兄", reading: "あに", meaning: "哥哥", level: "N4" },
  { expression: "姉", reading: "あね", meaning: "姐姐", level: "N4" },
  { expression: "アパート", reading: "あぱーと", meaning: "公寓", level: "N4" },
  { expression: "危ない", reading: "あぶない", meaning: "危险的", level: "N4" },
  { expression: "甘い", reading: "あまい", meaning: "甜的", level: "N4" },
  { expression: "雨", reading: "あめ", meaning: "雨", level: "N4" },
  { expression: "洗う", reading: "あらう", meaning: "洗", level: "N4" },
  { expression: "歩く", reading: "あるく", meaning: "走;步行", level: "N4" },
  { expression: "いくつ", reading: "いくつ", meaning: "几个;多少", level: "N4" },
  { expression: "医者", reading: "いしゃ", meaning: "医生", level: "N4" },
  { expression: "椅子", reading: "いす", meaning: "椅子", level: "N4" },
];

// N4-N2语法数据 (精选50个语法点)
const grammarData = [
  // N4语法
  { pattern: "〜たことがある", meaning: "曾经做过...", level: "N4", explanation: "表示过去的经验" },
  { pattern: "〜たり〜たりする", meaning: "又...又...", level: "N4", explanation: "列举多个动作或状态" },
  { pattern: "〜ば", meaning: "如果...", level: "N4", explanation: "假定条件" },
  { pattern: "〜なければならない", meaning: "必须...", level: "N4", explanation: "表示义务" },
  { pattern: "〜てもいい", meaning: "可以...", level: "N4", explanation: "表示许可" },
  { pattern: "〜てはいけない", meaning: "不可以...", level: "N4", explanation: "表示禁止" },
  { pattern: "〜ようと思う", meaning: "打算...", level: "N4", explanation: "表示意志" },
  { pattern: "〜そうだ", meaning: "好像...", level: "N4", explanation: "表示样态" },
  { pattern: "〜ために", meaning: "为了...", level: "N4", explanation: "表示目的" },
  { pattern: "〜あいだに", meaning: "在...期间", level: "N4", explanation: "表示时间范围" },
  { pattern: "〜てしまう", meaning: "完全...了", level: "N4", explanation: "表示完了或遗憾" },
  { pattern: "〜やすい", meaning: "容易...", level: "N4", explanation: "表示容易程度" },
  { pattern: "〜にくい", meaning: "难以...", level: "N4", explanation: "表示困难程度" },
  { pattern: "〜ておく", meaning: "预先...", level: "N4", explanation: "表示准备" },
  { pattern: "〜てみる", meaning: "试着...", level: "N4", explanation: "表示尝试" },
  
  // N3语法
  { pattern: "〜ことになる", meaning: "决定...", level: "N3", explanation: "表示客观决定" },
  { pattern: "〜ことにする", meaning: "决定...", level: "N3", explanation: "表示主观决定" },
  { pattern: "〜ばかり", meaning: "总是...", level: "N3", explanation: "表示反复或过度" },
  { pattern: "〜はずだ", meaning: "应该...", level: "N3", explanation: "表示推测" },
  { pattern: "〜わけだ", meaning: "难怪...", level: "N3", explanation: "表示理所当然" },
  { pattern: "〜ところだ", meaning: "正在...", level: "N3", explanation: "表示动作的时间点" },
  { pattern: "〜うちに", meaning: "趁着...", level: "N3", explanation: "表示时机" },
  { pattern: "〜おかげで", meaning: "多亏...", level: "N3", explanation: "表示积极原因" },
  { pattern: "〜せいで", meaning: "因为...", level: "N3", explanation: "表示消极原因" },
  { pattern: "〜によって", meaning: "根据...", level: "N3", explanation: "表示依据或手段" },
  
  // N2语法
  { pattern: "〜にしては", meaning: "作为...来说", level: "N2", explanation: "表示意外或不相称" },
  { pattern: "〜にとって", meaning: "对于...来说", level: "N2", explanation: "表示立场" },
  { pattern: "〜わけではない", meaning: "并不是...", level: "N2", explanation: "表示部分否定" },
  { pattern: "〜わけにはいかない", meaning: "不能...", level: "N2", explanation: "表示不可能或不应该" },
  { pattern: "〜ものだ", meaning: "应该...", level: "N2", explanation: "表示忠告或感慨" },
  { pattern: "〜ことはない", meaning: "没必要...", level: "N2", explanation: "表示不必要" },
  { pattern: "〜に違いない", meaning: "一定...", level: "N2", explanation: "表示确信" },
  { pattern: "〜かもしれない", meaning: "也许...", level: "N2", explanation: "表示可能性" },
  { pattern: "〜に関して", meaning: "关于...", level: "N2", explanation: "表示话题" },
  { pattern: "〜について", meaning: "关于...", level: "N2", explanation: "表示对象" },
];

async function importData() {
  console.log('开始批量导入JLPT数据...\n');
  
  try {
    // 导入N4词汇
    console.log(`📚 正在导入 ${n4Vocabulary.length} 个N4词汇...`);
    const vocabResponse = await fetch(`${API_URL}/admin.importVocabulary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: n4Vocabulary
      })
    });
    
    if (!vocabResponse.ok) {
      throw new Error(`词汇导入失败: ${vocabResponse.statusText}`);
    }
    
    const vocabResult = await vocabResponse.json();
    console.log(`✓ 词汇导入完成: 成功 ${vocabResult.result.data.success} 个, 失败 ${vocabResult.result.data.failed} 个`);
    if (vocabResult.result.data.errors.length > 0) {
      console.log(`  错误详情: ${vocabResult.result.data.errors.slice(0, 3).join(', ')}...`);
    }
    
    // 导入语法
    console.log(`\n📖 正在导入 ${grammarData.length} 个语法点...`);
    const grammarResponse = await fetch(`${API_URL}/admin.importGrammar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: grammarData
      })
    });
    
    if (!grammarResponse.ok) {
      throw new Error(`语法导入失败: ${grammarResponse.statusText}`);
    }
    
    const grammarResult = await grammarResponse.json();
    console.log(`✓ 语法导入完成: 成功 ${grammarResult.result.data.success} 个, 失败 ${grammarResult.result.data.failed} 个`);
    if (grammarResult.result.data.errors.length > 0) {
      console.log(`  错误详情: ${grammarResult.result.data.errors.slice(0, 3).join(', ')}...`);
    }
    
    console.log('\n✅ 所有数据导入完成!');
    
  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    process.exit(1);
  }
}

// 执行导入
importData();
