import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

console.log('开始导入增强数据...\n');

// 1. 导入学习资源
console.log('1. 导入学习资源...');
const resources = [
  {
    title: 'JLPT官方词汇列表',
    url: 'https://github.com/elzup/jlpt-word-list',
    type: 'dataset',
    category: 'vocabulary',
    description: 'GitHub开源JLPT N5-N1完整词汇列表,包含约6000个词汇',
    reliability: 10,
    isActive: true,
    metadata: { format: 'CSV', levels: ['N5', 'N4', 'N3', 'N2', 'N1'] }
  },
  {
    title: 'JLPTsensei语法大全',
    url: 'https://jlptsensei.com/complete-jlpt-grammar-list/',
    type: 'website',
    category: 'grammar',
    description: '完整的JLPT语法点列表,包含约800个语法点及详细解释',
    reliability: 9,
    isActive: true,
    metadata: { levels: ['N5', 'N4', 'N3', 'N2', 'N1'] }
  },
  {
    title: 'Tatoeba例句数据库',
    url: 'https://tatoeba.org/en/downloads',
    type: 'dataset',
    category: 'comprehensive',
    description: '开源日英对照例句数据库,包含数十万个真实例句',
    reliability: 9,
    isActive: true,
    metadata: { license: 'CC BY 2.0', format: 'TSV' }
  },
  {
    title: 'NHK News Web Easy',
    url: 'https://www3.nhk.or.jp/news/easy/',
    type: 'website',
    category: 'reading',
    description: 'NHK简明日语新闻,适合日语学习者阅读',
    reliability: 10,
    isActive: true,
    metadata: { level: 'N4-N3', updateFrequency: 'daily' }
  },
  {
    title: 'Jisho日语词典',
    url: 'https://jisho.org/',
    type: 'dictionary',
    category: 'vocabulary',
    description: '强大的在线日语词典,支持多种查询方式',
    reliability: 10,
    isActive: true,
    metadata: { features: ['词汇查询', '例句', '汉字查询', '语法查询'] }
  },
  {
    title: 'Weblio日语词典',
    url: 'https://www.weblio.jp/',
    type: 'dictionary',
    category: 'comprehensive',
    description: '日本本土权威在线词典',
    reliability: 10,
    isActive: true,
    metadata: { language: 'Japanese', type: 'native dictionary' }
  },
];

for (const resource of resources) {
  await db.insert(schema.learningResources).values(resource);
}
console.log(`✓ 已导入 ${resources.length} 个学习资源\n`);

// 2. 导入学习大纲
console.log('2. 导入学习大纲...');
const curriculum = [
  // N5阶段
  {
    level: 'N5',
    stage: 1,
    title: '五十音图与基础发音',
    description: '掌握平假名、片假名的读写,学习基本发音规则',
    objectives: ['掌握平假名46个字符', '掌握片假名46个字符', '学会基本发音规则', '认识浊音、半浊音、拗音'],
    requiredVocabularyCount: 0,
    requiredGrammarCount: 0,
    estimatedHours: 20,
    prerequisites: [],
    orderIndex: 1
  },
  {
    level: 'N5',
    stage: 2,
    title: '日常问候与自我介绍',
    description: '学习基本问候语和自我介绍的表达方式',
    objectives: ['掌握基本问候用语', '学会自我介绍', '了解日本礼仪文化', '掌握30个基础词汇'],
    requiredVocabularyCount: 30,
    requiredGrammarCount: 5,
    estimatedHours: 15,
    prerequisites: [1],
    orderIndex: 2
  },
  {
    level: 'N5',
    stage: 3,
    title: '数字、时间与日期',
    description: '学习数字的表达,时间和日期的说法',
    objectives: ['掌握1-10000的数字表达', '学会时间的表达', '学会日期的表达', '掌握50个相关词汇'],
    requiredVocabularyCount: 50,
    requiredGrammarCount: 8,
    estimatedHours: 20,
    prerequisites: [2],
    orderIndex: 3
  },
  {
    level: 'N5',
    stage: 4,
    title: '基础动词与句型',
    description: '学习常用动词及其基本活用,掌握简单句型',
    objectives: ['掌握30个常用动词', '学会动词ます形', '学会基本肯定否定句', '掌握疑问句的构成'],
    requiredVocabularyCount: 80,
    requiredGrammarCount: 15,
    estimatedHours: 30,
    prerequisites: [3],
    orderIndex: 4
  },
  {
    level: 'N5',
    stage: 5,
    title: '日常生活场景',
    description: '学习购物、餐厅、交通等日常场景的表达',
    objectives: ['掌握购物相关表达', '掌握餐厅点餐用语', '掌握交通出行用语', '掌握100个场景词汇'],
    requiredVocabularyCount: 100,
    requiredGrammarCount: 20,
    estimatedHours: 35,
    prerequisites: [4],
    orderIndex: 5
  },

  // N4阶段
  {
    level: 'N4',
    stage: 1,
    title: '动词时态与体',
    description: '深入学习动词的各种时态和体的表达',
    objectives: ['掌握动词て形', '掌握动词た形', '学会进行时表达', '学会完成时表达'],
    requiredVocabularyCount: 150,
    requiredGrammarCount: 30,
    estimatedHours: 40,
    prerequisites: [5],
    orderIndex: 6
  },
  {
    level: 'N4',
    stage: 2,
    title: '形容词与副词',
    description: '学习形容词和副词的用法及活用',
    objectives: ['掌握い形容词活用', '掌握な形容词活用', '学会副词的使用', '掌握80个形容词和副词'],
    requiredVocabularyCount: 80,
    requiredGrammarCount: 25,
    estimatedHours: 35,
    prerequisites: [6],
    orderIndex: 7
  },
  {
    level: 'N4',
    stage: 3,
    title: '授受动词与敬语入门',
    description: '学习授受关系的表达和基本敬语',
    objectives: ['掌握あげる、くれる、もらう的用法', '学会基本敬语表达', '了解日本敬语文化', '掌握相关词汇50个'],
    requiredVocabularyCount: 50,
    requiredGrammarCount: 20,
    estimatedHours: 30,
    prerequisites: [7],
    orderIndex: 8
  },
];

for (const item of curriculum) {
  await db.insert(schema.learningCurriculum).values(item);
}
console.log(`✓ 已导入 ${curriculum.length} 个学习阶段\n`);

// 3. 导入N5词汇
console.log('3. 导入N5词汇...');
const vocabularyData = [
  { expression: 'こんにちは', reading: 'こんにちは', romaji: 'konnichiwa', meaning: '你好(白天)', partOfSpeech: '感叹词', jlptLevel: 'N5', difficulty: 1, tags: ['问候', '日常'] },
  { expression: 'ありがとう', reading: 'ありがとう', romaji: 'arigatou', meaning: '谢谢', partOfSpeech: '感叹词', jlptLevel: 'N5', difficulty: 1, tags: ['感谢', '日常'] },
  { expression: 'すみません', reading: 'すみません', romaji: 'sumimasen', meaning: '对不起/不好意思', partOfSpeech: '感叹词', jlptLevel: 'N5', difficulty: 1, tags: ['道歉', '日常'] },
  { expression: '私', reading: 'わたし', romaji: 'watashi', meaning: '我', partOfSpeech: '代词', jlptLevel: 'N5', difficulty: 1, tags: ['代词', '基础'] },
  { expression: 'あなた', reading: 'あなた', romaji: 'anata', meaning: '你', partOfSpeech: '代词', jlptLevel: 'N5', difficulty: 1, tags: ['代词', '基础'] },
  { expression: '学生', reading: 'がくせい', romaji: 'gakusei', meaning: '学生', partOfSpeech: '名词', jlptLevel: 'N5', difficulty: 1, tags: ['身份', '学校'] },
  { expression: '先生', reading: 'せんせい', romaji: 'sensei', meaning: '老师', partOfSpeech: '名词', jlptLevel: 'N5', difficulty: 1, tags: ['身份', '学校'] },
  { expression: '食べる', reading: 'たべる', romaji: 'taberu', meaning: '吃', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '饮食'] },
  { expression: '飲む', reading: 'のむ', romaji: 'nomu', meaning: '喝', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '饮食'] },
  { expression: '行く', reading: 'いく', romaji: 'iku', meaning: '去', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '移动'] },
  { expression: '来る', reading: 'くる', romaji: 'kuru', meaning: '来', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '移动'] },
  { expression: '見る', reading: 'みる', romaji: 'miru', meaning: '看', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '感知'] },
  { expression: '聞く', reading: 'きく', romaji: 'kiku', meaning: '听/问', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '感知'] },
  { expression: '話す', reading: 'はなす', romaji: 'hanasu', meaning: '说话', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '交流'] },
  { expression: '書く', reading: 'かく', romaji: 'kaku', meaning: '写', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '学习'] },
  { expression: '読む', reading: 'よむ', romaji: 'yomu', meaning: '读', partOfSpeech: '动词', jlptLevel: 'N5', difficulty: 1, tags: ['动作', '学习'] },
  { expression: '大きい', reading: 'おおきい', romaji: 'ookii', meaning: '大的', partOfSpeech: 'い形容词', jlptLevel: 'N5', difficulty: 1, tags: ['形容词', '大小'] },
  { expression: '小さい', reading: 'ちいさい', romaji: 'chiisai', meaning: '小的', partOfSpeech: 'い形容词', jlptLevel: 'N5', difficulty: 1, tags: ['形容词', '大小'] },
  { expression: '新しい', reading: 'あたらしい', romaji: 'atarashii', meaning: '新的', partOfSpeech: 'い形容词', jlptLevel: 'N5', difficulty: 1, tags: ['形容词', '状态'] },
  { expression: '古い', reading: 'ふるい', romaji: 'furui', meaning: '旧的', partOfSpeech: 'い形容词', jlptLevel: 'N5', difficulty: 1, tags: ['形容词', '状态'] },
];

for (const vocab of vocabularyData) {
  await db.insert(schema.vocabulary).values(vocab);
}
console.log(`✓ 已导入 ${vocabularyData.length} 个N5词汇\n`);

// 4. 导入语法点
console.log('4. 导入语法点...');
const grammarData = [
  { pattern: 'は', meaning: '提示主题', usage: '用于提示句子的主题或对比。例如:私は学生です。', jlptLevel: 'N5', difficulty: 1, tags: ['助词', '基础'] },
  { pattern: 'です/だ', meaning: '判断句', usage: '表示"是"的意思,用于判断句。です是礼貌体,だ是普通体。', jlptLevel: 'N5', difficulty: 1, tags: ['判断', '基础'] },
  { pattern: 'を', meaning: '宾语标记', usage: '标记动作的对象。例如:ご飯を食べます。', jlptLevel: 'N5', difficulty: 1, tags: ['助词', '基础'] },
  { pattern: 'に', meaning: '时间/地点/方向', usage: '表示时间、存在地点、移动方向等。例如:学校に行きます。', jlptLevel: 'N5', difficulty: 1, tags: ['助词', '基础'] },
  { pattern: 'で', meaning: '地点/方法/材料', usage: '表示动作发生的地点、方法、材料等。例如:図書館で勉強します。', jlptLevel: 'N5', difficulty: 1, tags: ['助词', '基础'] },
  { pattern: 'ます形', meaning: '礼貌体现在将来时', usage: '动词的礼貌体,表示现在或将来的动作。例如:食べます、行きます。', jlptLevel: 'N5', difficulty: 1, tags: ['动词', '时态'] },
  { pattern: 'ません', meaning: '礼貌体否定', usage: '动词礼貌体的否定形式。例如:食べません、行きません。', jlptLevel: 'N5', difficulty: 1, tags: ['动词', '否定'] },
  { pattern: 'ました', meaning: '礼貌体过去时', usage: '动词礼貌体的过去式。例如:食べました、行きました。', jlptLevel: 'N5', difficulty: 1, tags: ['动词', '时态'] },
];

for (const grammar of grammarData) {
  await db.insert(schema.grammar).values(grammar);
}
console.log(`✓ 已导入 ${grammarData.length} 个语法点\n`);

// 5. 导入例句
console.log('5. 导入例句...');
const sentencesData = [
  { japanese: '私は学生です。', reading: 'わたしはがくせいです。', romaji: 'watashi wa gakusei desu.', chinese: '我是学生。', source: '教材', difficulty: 1, tags: ['自我介绍', 'N5'] },
  { japanese: 'これは本です。', reading: 'これはほんです。', romaji: 'kore wa hon desu.', chinese: '这是书。', source: '教材', difficulty: 1, tags: ['指示', 'N5'] },
  { japanese: '毎日ご飯を食べます。', reading: 'まいにちごはんをたべます。', romaji: 'mainichi gohan wo tabemasu.', chinese: '每天吃饭。', source: '教材', difficulty: 1, tags: ['日常', 'N5'] },
  { japanese: '学校に行きます。', reading: 'がっこうにいきます。', romaji: 'gakkou ni ikimasu.', chinese: '去学校。', source: '教材', difficulty: 1, tags: ['移动', 'N5'] },
  { japanese: '図書館で勉強します。', reading: 'としょかんでべんきょうします。', romaji: 'toshokan de benkyou shimasu.', chinese: '在图书馆学习。', source: '教材', difficulty: 1, tags: ['学习', 'N5'] },
];

for (const sentence of sentencesData) {
  await db.insert(schema.sentences).values(sentence);
}
console.log(`✓ 已导入 ${sentencesData.length} 个例句\n`);

// 6. 导入学习场景
console.log('6. 导入学习场景...');
const scenesData = [
  {
    title: '自我介绍',
    description: '学习如何用日语进行自我介绍',
    category: '社交',
    difficulty: 'beginner',
    orderIndex: 1,
    content: {
      vocabularyIds: [4, 5, 6, 7],
      grammarIds: [1, 2],
      dialogues: [
        { speaker: 'A', text: 'はじめまして。私は田中です。', translation: '初次见面。我是田中。' },
        { speaker: 'B', text: 'はじめまして。私は李です。中国人です。', translation: '初次见面。我是小李。是中国人。' },
        { speaker: 'A', text: 'よろしくお願いします。', translation: '请多关照。' },
      ]
    }
  },
  {
    title: '餐厅点餐',
    description: '学习在餐厅点餐的常用表达',
    category: '饮食',
    difficulty: 'beginner',
    orderIndex: 2,
    content: {
      vocabularyIds: [8, 9],
      grammarIds: [3, 6],
      dialogues: [
        { speaker: '店员', text: 'いらっしゃいませ。ご注文は?', translation: '欢迎光临。您要点什么?' },
        { speaker: '客人', text: 'ラーメンをください。', translation: '请给我拉面。' },
        { speaker: '店员', text: 'かしこまりました。', translation: '好的,明白了。' },
      ]
    }
  },
  {
    title: '问路',
    description: '学习如何用日语问路和指路',
    category: '交通',
    difficulty: 'beginner',
    orderIndex: 3,
    content: {
      vocabularyIds: [10, 11],
      grammarIds: [4, 5],
      dialogues: [
        { speaker: 'A', text: 'すみません、駅はどこですか?', translation: '不好意思,车站在哪里?' },
        { speaker: 'B', text: 'まっすぐ行って、右に曲がってください。', translation: '一直走,然后右转。' },
        { speaker: 'A', text: 'ありがとうございます。', translation: '谢谢。' },
      ]
    }
  },
];

for (const scene of scenesData) {
  await db.insert(schema.scenes).values(scene);
}
console.log(`✓ 已导入 ${scenesData.length} 个学习场景\n`);

console.log('✅ 所有数据导入完成!');
process.exit(0);
