// 最终版本：按标点分词后数组一一对应

function isKanjiChar(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

function hasKanji(text) {
  for (const char of text) {
    if (isKanjiChar(char)) return true;
  }
  return false;
}

function isKana(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff);
}

function toHiragana(text) {
  let result = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) {
      result += String.fromCharCode(code - 0x60);
    } else {
      result += char;
    }
  }
  return result;
}

function findKanaInReading(reading, target, startPos) {
  const targetHiragana = toHiragana(target);
  
  for (let i = startPos; i <= reading.length - target.length; i++) {
    const readingHiragana = toHiragana(reading.substring(i, i + target.length));
    if (readingHiragana === targetHiragana) {
      return i;
    }
  }
  
  return -1;
}

function isValidReading(reading) {
  for (const char of reading) {
    if (!isKana(char) && char !== 'ー' && char !== '・') {
      return false;
    }
  }
  return reading.length > 0;
}

// 按标点符号分词
function splitByPunctuation(text) {
  const segments = [];
  let current = '';
  
  for (const char of text) {
    if (isKana(char) || isKanjiChar(char)) {
      current += char;
    } else {
      if (current) {
        segments.push(current);
        current = '';
      }
      segments.push(char); // 标点单独作为一个元素
    }
  }
  if (current) {
    segments.push(current);
  }
  
  return segments;
}

// 处理单个段落的注音
function processSegment(originalSeg, readingSeg) {
  if (!hasKanji(originalSeg)) {
    // 纯假名，不需要注音
    return originalSeg;
  }
  
  let result = '';
  let readingPos = 0;
  let i = 0;
  
  while (i < originalSeg.length) {
    const char = originalSeg[i];
    
    if (isKana(char)) {
      // 假名：在reading中找到对应位置并跳过
      const kanaPos = findKanaInReading(readingSeg, char, readingPos);
      if (kanaPos !== -1) {
        readingPos = kanaPos + 1;
      }
      result += char;
      i++;
    } else if (isKanjiChar(char)) {
      // 汉字：收集连续的汉字块
      let kanjiBlock = char;
      let j = i + 1;
      while (j < originalSeg.length && isKanjiChar(originalSeg[j])) {
        kanjiBlock += originalSeg[j];
        j++;
      }
      
      // 查找下一个假名作为边界
      let nextKana = '';
      let nextKanaPos = j;
      while (nextKanaPos < originalSeg.length && !isKana(originalSeg[nextKanaPos])) {
        nextKanaPos++;
      }
      if (nextKanaPos < originalSeg.length) {
        nextKana = originalSeg[nextKanaPos];
      }
      
      let kanjiReading = '';
      if (nextKana) {
        // 有下一个假名，找到它在reading中的位置
        const nextPos = findKanaInReading(readingSeg, nextKana, readingPos);
        if (nextPos !== -1 && nextPos > readingPos) {
          kanjiReading = readingSeg.substring(readingPos, nextPos);
          readingPos = nextPos;
        }
      } else {
        // 没有下一个假名，取剩余的reading
        kanjiReading = readingSeg.substring(readingPos);
        readingPos = readingSeg.length;
      }
      
      if (kanjiReading && isValidReading(kanjiReading)) {
        result += kanjiBlock + '(' + kanjiReading + ')';
      } else {
        result += kanjiBlock;
      }
      
      i = j;
    } else {
      result += char;
      i++;
    }
  }
  
  return result;
}

// 主函数：按标点分词后一一对应处理
function buildRubyTextFinal(original, reading) {
  if (!hasKanji(original)) {
    return original;
  }
  
  // 按标点分词
  const originalSegments = splitByPunctuation(original);
  const readingSegments = splitByPunctuation(reading);
  
  console.log('Original segments:', originalSegments);
  console.log('Reading segments:', readingSegments);
  
  // 数组一一对应处理
  let result = '';
  for (let i = 0; i < originalSegments.length; i++) {
    const origSeg = originalSegments[i];
    const readSeg = readingSegments[i] || '';
    
    // 判断是否是标点
    if (origSeg.length === 1 && !isKana(origSeg) && !isKanjiChar(origSeg)) {
      // 标点直接添加
      result += origSeg;
    } else {
      // 非标点，处理注音
      result += processSegment(origSeg, readSeg);
    }
  }
  
  return result;
}

// 测试
const testCases = [
  { 
    original: "ねえ、今週の土曜日、暇？", 
    reading: "ねえ、こんしゅうのどようび、ひま？",
    expected: "ねえ、今週(こんしゅう)の土曜日(どようび)、暇(ひま)？"
  },
  { 
    original: "新しいカフェができたんだって。一緒に行こうよ！", 
    reading: "あたらしいかふぇができたんだって。いっしょにいこうよ！",
    expected: "新(あたら)しいカフェができたんだって。一緒(いっしょ)に行(い)こうよ！"
  },
];

testCases.forEach(({ original, reading, expected }) => {
  console.log('\n=== Test Case ===');
  console.log('Original:', original);
  console.log('Reading:', reading);
  const result = buildRubyTextFinal(original, reading);
  console.log('Result:', result);
  console.log('Expected:', expected);
  console.log('Match:', result === expected ? '✓' : '✗');
});
