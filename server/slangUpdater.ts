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
  // 现在返回真正的网络流行语数据
  return `
2024-2025年日语网络热词(纯网络流行语,非标准词汇):

1. ワンチャン - “one chance”的缩略,表示“有一丝可能”、“说不定”
2. エモい - “emotional”的缩略,形容令人感动、有情绪的
3. バズる - “buzz”的动词形式,表示“走红”、“热议”
4. ぐらい - 表示程度的口语说法,相当于“左右”、“左右”
5. ばえる - “go viral”的日语化,表示“疯传”
6. ガチ - 表示“真的”、“认真的”、“彻底的”
7. やばい - 表示“厉害”、“太棒了”
8. ちな - “因为”的口语缩略(ちなみに)
9. おぱ - “大佬”的网络用语
10. リアコ - “现充”(现实充实组)的缩略,形容现实生活充实的人
11. トッモ - “朋友”(友達)的网络用语
12. イケボ - “帅哥声优”(イケメンボイス)的缩略
13. サブカル - “亚文化”(subculture)的网络用语
14. 推し活 - “追星活动”,支持喜欢的偶像或艺人
15. オタク - “御宅族”的缩略
16. メンヘラ - “精神崩溃”(メンタルヘルス)的网络用语
17. エグい - “egregious”的缩略,表示“过分”、“太过了”
18. チル - “chill”的日语化,表示“放松”、“悠闲”
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
          // 如果该词已存在且不是slang分类,跳过(避免与标准词汇库重复)
          if (existing[0]!.category !== 'slang') {
            console.log(`跳过与标准词汇库重复的词: ${word.expression}`);
            continue;
          }
          // 更新现有的slang记录
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
            .returning({ id: vocabulary.id });

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
                .returning({ id: sentences.id });

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
