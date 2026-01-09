// 测试改进的对齐算法

// 检查字符是否是汉字
function isKanjiChar(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

// 检查文本是否包含汉字
function hasKanji(text) {
  for (const char of text) {
    if (isKanjiChar(char)) return true;
  }
  return false;
}

// 检查字符是否是假名
function isKana(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff);
}

// 将片假名转换为平假名
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

// 在reading中查找假名序列
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

// 检查是否是有效的假名读音
function isValidReading(reading) {
  for (const char of reading) {
    if (!isKana(char) && char !== 'ー' && char !== '・') {
      return false;
    }
  }
  return reading.length > 0;
}

// 改进的对齐算法
function buildRubyText(original, reading) {
  if (!hasKanji(original)) {
    return original;
  }

  const parts = [];
  let currentText = '';
  let currentType = null;
  
  for (const char of original) {
    let charType;
    if (isKanjiChar(char)) {
      charType = 'kanji';
    } else if (isKana(char)) {
      charType = 'kana';
    } else {
      charType = 'punct';
    }
    
    if (currentType === null) {
      currentText = char;
      currentType = charType;
    } else if (charType === currentType) {
      currentText += char;
    } else {
      parts.push({ text: currentText, type: currentType });
      currentText = char;
      currentType = charType;
    }
  }
  if (currentText && currentType) {
    parts.push({ text: currentText, type: currentType });
  }

  console.log('Parts:', parts);

  let result = '';
  let readingPos = 0;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.type === 'punct') {
      result += part.text;
    } else if (part.type === 'kana') {
      const kanaInReading = findKanaInReading(reading, part.text, readingPos);
      if (kanaInReading !== -1) {
        readingPos = kanaInReading + part.text.length;
      }
      result += part.text;
    } else {
      let nextKanaPart = null;
      for (let j = i + 1; j < parts.length; j++) {
        if (parts[j].type === 'kana') {
          nextKanaPart = parts[j];
          break;
        }
      }
      
      let kanjiReading = '';
      
      if (nextKanaPart) {
        const nextPos = findKanaInReading(reading, nextKanaPart.text, readingPos);
        if (nextPos !== -1 && nextPos > readingPos) {
          kanjiReading = reading.substring(readingPos, nextPos);
          readingPos = nextPos;
        }
      } else {
        kanjiReading = reading.substring(readingPos);
        readingPos = reading.length;
      }
      
      if (kanjiReading && isValidReading(kanjiReading)) {
        result += part.text + '(' + kanjiReading + ')';
      } else {
        result += part.text;
      }
    }
  }
  
  return result;
}

// 测试用例
const testCases = [
  { original: '「と申します」は丁寧な自己紹介の表現です', reading: 'ともうしますはていねいなじこしょうかいのひょうげんです' },
  { original: '初対面では「はじめまして」を使う', reading: 'しょたいめんでははじめましてをつかう' },
  { original: '田中と申します', reading: 'たなかともうします' },
  { original: '日本語を学ぶ', reading: 'にほんごをまなぶ' },
];

testCases.forEach(({ original, reading }) => {
  console.log('Original:', original);
  console.log('Reading:', reading);
  console.log('Result:', buildRubyText(original, reading));
  console.log('---');
});
