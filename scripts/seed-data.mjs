import { drizzle } from "drizzle-orm/mysql2";
import { vocabulary, grammar, examples, scenes, sceneVocabulary, sceneGrammar } from "../drizzle/schema.js";
import "dotenv/config";

async function seedData() {
  console.log("Connecting to database...");
  const db = drizzle(process.env.DATABASE_URL);

  try {
    console.log("\n📚 Seeding vocabulary data (N5 level)...");
    
    // Insert basic N5 vocabulary
    const vocabData = [
      { expression: "こんにちは", reading: "こんにちは", romaji: "konnichiwa", meaning: "你好", partOfSpeech: "感叹词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "ありがとう", reading: "ありがとう", romaji: "arigatou", meaning: "谢谢", partOfSpeech: "感叹词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "すみません", reading: "すみません", romaji: "sumimasen", meaning: "对不起/不好意思", partOfSpeech: "感叹词", jlptLevel: "N5", formalityLevel: "formal" },
      { expression: "食べる", reading: "たべる", romaji: "taberu", meaning: "吃", partOfSpeech: "动词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "飲む", reading: "のむ", romaji: "nomu", meaning: "喝", partOfSpeech: "动词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "買う", reading: "かう", romaji: "kau", meaning: "买", partOfSpeech: "动词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "レストラン", reading: "レストラン", romaji: "resutoran", meaning: "餐厅", partOfSpeech: "名词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "水", reading: "みず", romaji: "mizu", meaning: "水", partOfSpeech: "名词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "お金", reading: "おかね", romaji: "okane", meaning: "钱", partOfSpeech: "名词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "美味しい", reading: "おいしい", romaji: "oishii", meaning: "好吃的", partOfSpeech: "形容词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "高い", reading: "たかい", romaji: "takai", meaning: "贵的/高的", partOfSpeech: "形容词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "安い", reading: "やすい", romaji: "yasui", meaning: "便宜的", partOfSpeech: "形容词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "いくら", reading: "いくら", romaji: "ikura", meaning: "多少钱", partOfSpeech: "疑问词", jlptLevel: "N5", formalityLevel: "casual" },
      { expression: "ください", reading: "ください", romaji: "kudasai", meaning: "请给我", partOfSpeech: "动词", jlptLevel: "N5", formalityLevel: "formal" },
      { expression: "行く", reading: "いく", romaji: "iku", meaning: "去", partOfSpeech: "动词", jlptLevel: "N5", formalityLevel: "casual" },
    ];

    const insertedVocab = await db.insert(vocabulary).values(vocabData).$returningId();
    console.log(`✓ Inserted ${insertedVocab.length} vocabulary items`);

    console.log("\n📖 Seeding grammar data (N5 level)...");
    
    // Insert basic N5 grammar
    const grammarData = [
      { 
        grammarPoint: "です", 
        meaning: "是(礼貌体)", 
        structure: "名词 + です", 
        jlptLevel: "N5", 
        category: "基础句型",
        formalityLevel: "formal",
        usageNotes: "用于礼貌地陈述事实或状态,是日语最基本的句型之一"
      },
      { 
        grammarPoint: "ます", 
        meaning: "动词礼貌体", 
        structure: "动词词干 + ます", 
        jlptLevel: "N5", 
        category: "动词变形",
        formalityLevel: "formal",
        usageNotes: "将动词变为礼貌体,用于正式场合或对长辈说话"
      },
      { 
        grammarPoint: "を", 
        meaning: "宾格助词", 
        structure: "名词 + を + 动词", 
        jlptLevel: "N5", 
        category: "助词",
        formalityLevel: "both",
        usageNotes: "标记动作的直接对象"
      },
      { 
        grammarPoint: "に", 
        meaning: "方向/时间助词", 
        structure: "名词 + に", 
        jlptLevel: "N5", 
        category: "助词",
        formalityLevel: "both",
        usageNotes: "表示动作的方向、时间或存在的位置"
      },
      { 
        grammarPoint: "で", 
        meaning: "地点/方式助词", 
        structure: "名词 + で", 
        jlptLevel: "N5", 
        category: "助词",
        formalityLevel: "both",
        usageNotes: "表示动作发生的地点或方式手段"
      },
    ];

    const insertedGrammar = await db.insert(grammar).values(grammarData).$returningId();
    console.log(`✓ Inserted ${insertedGrammar.length} grammar points`);

    console.log("\n🎬 Seeding scenes data...");
    
    // Insert learning scenes
    const sceneData = [
      { 
        title: "餐厅点餐", 
        description: "学习在餐厅点餐的常用表达", 
        category: "餐饮", 
        difficulty: "beginner",
        order: 1
      },
      { 
        title: "购物", 
        description: "学习购物时的基本对话", 
        category: "购物", 
        difficulty: "beginner",
        order: 2
      },
      { 
        title: "打招呼与自我介绍", 
        description: "学习日常打招呼和自我介绍的表达", 
        category: "日常交流", 
        difficulty: "beginner",
        order: 3
      },
    ];

    const insertedScenes = await db.insert(scenes).values(sceneData).$returningId();
    console.log(`✓ Inserted ${insertedScenes.length} scenes`);

    console.log("\n💬 Seeding example sentences...");
    
    // Insert example sentences
    const exampleData = [
      {
        japanese: "これをください。",
        reading: "これをください。",
        chinese: "请给我这个。",
        romaji: "kore wo kudasai.",
        source: "日常对话",
        sourceType: "daily",
        vocabularyId: insertedVocab[13].id, // ください
        difficulty: "beginner",
        sceneId: insertedScenes[1].id // 购物
      },
      {
        japanese: "水を飲みます。",
        reading: "みずをのみます。",
        chinese: "喝水。",
        romaji: "mizu wo nomimasu.",
        source: "日常对话",
        sourceType: "daily",
        vocabularyId: insertedVocab[4].id, // 飲む
        grammarId: insertedGrammar[2].id, // を
        difficulty: "beginner"
      },
      {
        japanese: "レストランで食べます。",
        reading: "レストランでたべます。",
        chinese: "在餐厅吃饭。",
        romaji: "resutoran de tabemasu.",
        source: "日常对话",
        sourceType: "daily",
        vocabularyId: insertedVocab[3].id, // 食べる
        grammarId: insertedGrammar[4].id, // で
        difficulty: "beginner",
        sceneId: insertedScenes[0].id // 餐厅点餐
      },
      {
        japanese: "これはいくらですか。",
        reading: "これはいくらですか。",
        chinese: "这个多少钱?",
        romaji: "kore wa ikura desu ka.",
        source: "日常对话",
        sourceType: "daily",
        vocabularyId: insertedVocab[12].id, // いくら
        grammarId: insertedGrammar[0].id, // です
        difficulty: "beginner",
        sceneId: insertedScenes[1].id // 购物
      },
      {
        japanese: "ありがとうございます。",
        reading: "ありがとうございます。",
        chinese: "非常感谢。",
        romaji: "arigatou gozaimasu.",
        source: "日常对话",
        sourceType: "daily",
        vocabularyId: insertedVocab[1].id, // ありがとう
        difficulty: "beginner"
      },
    ];

    await db.insert(examples).values(exampleData);
    console.log(`✓ Inserted ${exampleData.length} example sentences`);

    console.log("\n🔗 Linking vocabulary to scenes...");
    
    // Link vocabulary to scenes
    const sceneVocabLinks = [
      { sceneId: insertedScenes[0].id, vocabularyId: insertedVocab[3].id, importance: "core" }, // 餐厅 - 食べる
      { sceneId: insertedScenes[0].id, vocabularyId: insertedVocab[4].id, importance: "core" }, // 餐厅 - 飲む
      { sceneId: insertedScenes[0].id, vocabularyId: insertedVocab[6].id, importance: "core" }, // 餐厅 - レストラン
      { sceneId: insertedScenes[0].id, vocabularyId: insertedVocab[9].id, importance: "supplementary" }, // 餐厅 - 美味しい
      { sceneId: insertedScenes[1].id, vocabularyId: insertedVocab[5].id, importance: "core" }, // 购物 - 買う
      { sceneId: insertedScenes[1].id, vocabularyId: insertedVocab[8].id, importance: "core" }, // 购物 - お金
      { sceneId: insertedScenes[1].id, vocabularyId: insertedVocab[12].id, importance: "core" }, // 购物 - いくら
      { sceneId: insertedScenes[1].id, vocabularyId: insertedVocab[13].id, importance: "core" }, // 购物 - ください
      { sceneId: insertedScenes[2].id, vocabularyId: insertedVocab[0].id, importance: "core" }, // 打招呼 - こんにちは
      { sceneId: insertedScenes[2].id, vocabularyId: insertedVocab[1].id, importance: "core" }, // 打招呼 - ありがとう
    ];

    await db.insert(sceneVocabulary).values(sceneVocabLinks);
    console.log(`✓ Linked ${sceneVocabLinks.length} vocabulary items to scenes`);

    console.log("\n🔗 Linking grammar to scenes...");
    
    // Link grammar to scenes
    const sceneGrammarLinks = [
      { sceneId: insertedScenes[0].id, grammarId: insertedGrammar[1].id, importance: "core" }, // 餐厅 - ます
      { sceneId: insertedScenes[0].id, grammarId: insertedGrammar[4].id, importance: "core" }, // 餐厅 - で
      { sceneId: insertedScenes[1].id, grammarId: insertedGrammar[0].id, importance: "core" }, // 购物 - です
      { sceneId: insertedScenes[1].id, grammarId: insertedGrammar[2].id, importance: "supplementary" }, // 购物 - を
      { sceneId: insertedScenes[2].id, grammarId: insertedGrammar[0].id, importance: "core" }, // 打招呼 - です
    ];

    await db.insert(sceneGrammar).values(sceneGrammarLinks);
    console.log(`✓ Linked ${sceneGrammarLinks.length} grammar points to scenes`);

    console.log("\n✅ Database seeding complete!");
    console.log("\nSummary:");
    console.log(`  - ${vocabData.length} vocabulary items`);
    console.log(`  - ${grammarData.length} grammar points`);
    console.log(`  - ${sceneData.length} learning scenes`);
    console.log(`  - ${exampleData.length} example sentences`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedData();
