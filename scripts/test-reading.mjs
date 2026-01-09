import { invokeLLM } from '../server/_core/llm.ts';

const text = '謙虚な姿勢を示す表現を覚える';

const response = await invokeLLM({
  messages: [
    {
      role: 'system',
      content: `你是一个日语注音助手。请为用户提供的日语文本标注读音(振り仮名)。

规则:
1. 只为汉字标注平假名读音
2. 保留原文中的所有标点符号(包括、。？！等)
3. 平假名、片假名保持原样
4. 输出格式: 纯平假名+标点,不要有空格
5. 所有汉字都必须转换为假名,不要遗漏任何汉字

示例:
输入: 今日は良い天気ですね。
输出: きょうはいいてんきですね。

输入: 田中と申します。
输出: たなかともうします。

输入: ねえ、今週の土曜日、暇？
输出: ねえ、こんしゅうのどようび、ひま？`
    },
    {
      role: 'user',
      content: text
    }
  ]
});

const reading = response.choices[0].message.content.trim();
console.log('原文:', text);
console.log('Reading:', reading);
process.exit(0);
