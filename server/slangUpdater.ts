import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { vocabulary, sentences, vocabularySentences } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * 热词更新器
 * 负责搜索、解析和更新日语网络热词
 */

interface SlangWord {
  expression: string;
  reading: string;
  romaji: string;
  meaning: string;
  detailedExplanation: string;
  source: string;
  partOfSpeech: string;
  examples: Array<{
    japanese: string;
    reading: string;
    romaji: string;
    chinese: string;
  }>;
}

/**
 * 使用LLM从搜索结果中提取和结构化热词数据
 */
async function extractSlangWordsFromText(searchResults: string): Promise<SlangWord[]> {
  const prompt = `你是一个日语网络热词专家。请从以下搜索结果中提取10-15个2024-2025年最新的日语网络热词。

搜索结果:
${searchResults}

要求:
1. 只提取真实存在的网络热词,不要编造
2. 确保返回的热词列表中没有重复的expression
3. 每个热词必须包含:
   - expression: 日文表达
   - reading: 假名读音
   - romaji: 罗马音
   - meaning: 简短的中文释义(20字以内)
   - detailedExplanation: 详细解释,包括来源、用法、使用场景(100-200字)
   - source: 来源(如"Twitter"、"ニコニコ動画"、"2ch"等)
   - partOfSpeech: 词性(名词/动词/形容词/感叹词/网络用语)
   - examples: 2-3个真实的使用例句,每个例句包含japanese、reading、romaji、chinese

请以JSON数组格式返回,确保所有字段都填写完整。`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "你是一个专业的日语网络热词分析专家,擅长从网络资料中提取和整理流行语信息。" },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "slang_words",
          strict: true,
          schema: {
            type: "object",
            properties: {
              words: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    expression: { type: "string" },
                    reading: { type: "string" },
                    romaji: { type: "string" },
                    meaning: { type: "string" },
                    detailedExplanation: { type: "string" },
                    source: { type: "string" },
                    partOfSpeech: { type: "string" },
                    examples: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          japanese: { type: "string" },
                          reading: { type: "string" },
                          romaji: { type: "string" },
                          chinese: { type: "string" }
                        },
                        required: ["japanese", "reading", "romaji", "chinese"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["expression", "reading", "romaji", "meaning", "detailedExplanation", "source", "partOfSpeech", "examples"],
                  additionalProperties: false
                }
              }
            },
            required: ["words"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("LLM返回空内容或格式错误");
    }

    const parsed = JSON.parse(content);
    return parsed.words || [];
  } catch (error) {
    console.error("提取热词失败:", error);
    return [];
  }
}

/**
 * 搜索最新的日语网络热词
 * 注意: 这个函数需要在实际环境中调用search API
 * 由于当前环境限制,我们返回模拟数据
 */
async function searchLatestSlang(): Promise<string> {
  // 在实际实现中,这里应该调用search API
  // 现在返回我们之前调研的数据作为示例
  return `
2024-2025年日语网络热词:

1. ふてほど - 来自日剧《不適切にもほどがある》,表示"极度不妥"
2. きゃぱい - キャパシティーオーバー的缩略,表示"超出承受能力"
3. SAN値 - 源自TRPG游戏,表示"理智值"
4. ダンパ - Dance Party的缩略,表示"舞会"
5. 暗黒微笑 - 一种带有诡异感的微笑
6. シコい - 形容某物性感、诱人
7. ヌクモリティ - 温もり+Quality,表示温暖舒适的感觉
8. もう付き合っちゃえよ - "你们俩干脆交往算了"
9. 建国顔 - 形容极其英俊的外貌
10. 花吐き病 - 虚构疾病,因单恋而吐出花瓣
11. けばい - 形容过于华丽、俗气
12. 月曜が近いよ - "星期一要来了"的悲伤提醒
`;
}

/**
 * 更新热词到数据库
 */
export async function updateSlangWords(): Promise<{
  success: boolean;
  addedCount: number;
  updatedCount: number;
  words: Array<{ expression: string; meaning: string; source: string }>;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("数据库连接失败");
    }

    // 1. 搜索最新热词
    const searchResults = await searchLatestSlang();

    // 2. 使用LLM提取和结构化数据
    const slangWords = await extractSlangWordsFromText(searchResults);

    if (slangWords.length === 0) {
      return {
        success: false,
        addedCount: 0,
        updatedCount: 0,
        words: [],
        error: "未能提取到热词数据"
      };
    }

    let addedCount = 0;
    let updatedCount = 0;
    const processedWords: Array<{ expression: string; meaning: string; source: string }> = [];

    // 3. 去重:移除批次内重复的热词
    const uniqueWords = new Map<string, SlangWord>();
    for (const word of slangWords) {
      if (!uniqueWords.has(word.expression)) {
        uniqueWords.set(word.expression, word);
      }
    }
    const uniqueWordsList = Array.from(uniqueWords.values());

    // 4. 逐个处理热词
    for (const word of uniqueWordsList) {
      try {
        // 检查是否已存在(检查所有词汇,不仅限于slang分类)
        const existing = await db
          .select()
          .from(vocabulary)
          .where(eq(vocabulary.expression, word.expression))
          .limit(1);

        if (existing.length > 0) {
          // 更新现有记录
          await db
            .update(vocabulary)
            .set({
              reading: word.reading,
              romaji: word.romaji,
              meaning: word.meaning,
              detailedExplanation: word.detailedExplanation,
              source: word.source,
              partOfSpeech: word.partOfSpeech,
              updatedAt: new Date()
            })
            .where(eq(vocabulary.id, existing[0]!.id));

          updatedCount++;
        } else {
          // 插入新记录
          const [inserted] = await db
            .insert(vocabulary)
            .values({
              expression: word.expression,
              reading: word.reading,
              romaji: word.romaji,
              meaning: word.meaning,
              detailedExplanation: word.detailedExplanation,
              source: word.source,
              partOfSpeech: word.partOfSpeech,
              jlptLevel: "N5", // 网络热词默认N5
              category: "slang",
              difficulty: 3
            })
            .$returningId();

          // 插入例句
          if (inserted && word.examples && word.examples.length > 0) {
            for (const example of word.examples) {
              const [sentenceInserted] = await db
                .insert(sentences)
                .values({
                  japanese: example.japanese,
                  reading: example.reading,
                  romaji: example.romaji,
                  chinese: example.chinese,
                  source: word.source,
                  sourceType: "web",
                  difficulty: 3
                })
                .$returningId();

              if (sentenceInserted) {
                await db.insert(vocabularySentences).values({
                  vocabularyId: inserted.id,
                  sentenceId: sentenceInserted.id
                });
              }
            }
          }

          addedCount++;
        }

        processedWords.push({
          expression: word.expression,
          meaning: word.meaning,
          source: word.source
        });
      } catch (error) {
        console.error(`处理热词 ${word.expression} 失败:`, error);
      }
    }

    return {
      success: true,
      addedCount,
      updatedCount,
      words: processedWords
    };
  } catch (error) {
    console.error("更新热词失败:", error);
    return {
      success: false,
      addedCount: 0,
      updatedCount: 0,
      words: [],
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 获取热词更新状态
 */
export async function getSlangUpdateStatus(): Promise<{
  lastUpdateTime: Date | null;
  totalSlangCount: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        lastUpdateTime: null,
        totalSlangCount: 0
      };
    }

    // 获取最新的热词更新时间
    const latestSlang = await db
      .select()
      .from(vocabulary)
      .where(eq(vocabulary.category, "slang"))
      .orderBy(vocabulary.updatedAt)
      .limit(1);

    // 获取热词总数
    const allSlang = await db
      .select()
      .from(vocabulary)
      .where(eq(vocabulary.category, "slang"));

    return {
      lastUpdateTime: latestSlang[0]?.updatedAt || null,
      totalSlangCount: allSlang.length
    };
  } catch (error) {
    console.error("获取热词状态失败:", error);
    return {
      lastUpdateTime: null,
      totalSlangCount: 0
    };
  }
}
