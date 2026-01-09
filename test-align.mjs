// 测试对齐算法
function hasKanji(text) {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

function isKana(char) {
  return /[\u3040-\u309F\u30A0-\u30FF]/.test(char);
}

function alignKanjiWithReading(text, reading) {
  const result = [];
  
  if (!hasKanji(text)) {
    return [{ type: 'text', content: text }];
  }
  
  if (!reading) {
    return [{ type: 'text', content: text }];
  }
  
  let textIndex = 0;
  let readingIndex = 0;
  
  while (textIndex < text.length) {
    const char = text[textIndex];
    
    // 如果是假名,直接添加
    if (isKana(char)) {
      if (readingIndex < reading.length && reading[readingIndex] === char) {
        readingIndex++;
      }
      result.push({ type: 'kana', content: char });
      textIndex++;
      continue;
    }
    
    // 如果是汉字,找到连续的汉字块
    let kanjiBlock = '';
    while (textIndex < text.length && !isKana(text[textIndex]) && hasKanji(text[textIndex])) {
      kanjiBlock += text[textIndex];
      textIndex++;
    }
    
    if (kanjiBlock) {
      let nextKanaInText = '';
      if (textIndex < text.length && isKana(text[textIndex])) {
        nextKanaInText = text[textIndex];
      }
      
      let kanjiReading = '';
      if (nextKanaInText) {
        const nextKanaPos = reading.indexOf(nextKanaInText, readingIndex);
        if (nextKanaPos > readingIndex) {
          kanjiReading = reading.substring(readingIndex, nextKanaPos);
          readingIndex = nextKanaPos;
        } else {
          kanjiReading = reading.substring(readingIndex);
          readingIndex = reading.length;
        }
      } else {
        kanjiReading = reading.substring(readingIndex);
        readingIndex = reading.length;
      }
      
      result.push({ type: 'ruby', kanji: kanjiBlock, reading: kanjiReading });
    }
    
    // 处理其他字符(标点、数字等)
    if (textIndex < text.length && !isKana(text[textIndex]) && !hasKanji(text[textIndex])) {
      result.push({ type: 'other', content: text[textIndex] });
      textIndex++;
    }
  }
  
  return result;
}

// 测试
const text = 'はじめまして。田中と申します。';
const reading = 'はじめまして。たなかともうします。';
console.log('原文:', text);
console.log('读音:', reading);
console.log('对齐结果:', JSON.stringify(alignKanjiWithReading(text, reading), null, 2));
