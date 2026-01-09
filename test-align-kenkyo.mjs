// 复制alignKanjiWithReading函数
function isKanji(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

function isHiragana(char) {
  const code = char.charCodeAt(0);
  return code >= 0x3040 && code <= 0x309f;
}

function isKatakana(char) {
  const code = char.charCodeAt(0);
  return code >= 0x30a0 && code <= 0x30ff;
}

function isPunctuation(char) {
  return /[、。！？「」『』（）【】…・〜～]/.test(char);
}

function alignKanjiWithReading(text, reading) {
  const result = [];
  
  // 按标点符号分段
  const textSegments = [];
  const readingSegments = [];
  
  let currentTextSeg = '';
  let currentReadingSeg = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isPunctuation(char)) {
      if (currentTextSeg) {
        textSegments.push(currentTextSeg);
        currentTextSeg = '';
      }
      textSegments.push(char); // 标点作为独立段落
    } else {
      currentTextSeg += char;
    }
  }
  if (currentTextSeg) textSegments.push(currentTextSeg);
  
  // 同样处理reading
  for (let i = 0; i < reading.length; i++) {
    const char = reading[i];
    if (isPunctuation(char)) {
      if (currentReadingSeg) {
        readingSegments.push(currentReadingSeg);
        currentReadingSeg = '';
      }
      readingSegments.push(char);
    } else {
      currentReadingSeg += char;
    }
  }
  if (currentReadingSeg) readingSegments.push(currentReadingSeg);
  
  console.log('Text segments:', textSegments);
  console.log('Reading segments:', readingSegments);
  
  // 处理每个段落
  for (let segIdx = 0; segIdx < textSegments.length; segIdx++) {
    const textSeg = textSegments[segIdx];
    
    // 如果是标点,直接添加
    if (isPunctuation(textSeg)) {
      result.push({ type: 'text', content: textSeg });
      continue;
    }
    
    // 找到对应的reading段落
    const readingSeg = readingSegments[segIdx] || '';
    
    // 在段落内部处理注音
    let textPos = 0;
    let readingPos = 0;
    
    while (textPos < textSeg.length) {
      const char = textSeg[textPos];
      
      // 假名直接添加
      if (isHiragana(char) || isKatakana(char)) {
        result.push({ type: 'text', content: char });
        readingPos += char.length;
        textPos++;
        continue;
      }
      
      // 汉字需要添加注音
      if (isKanji(char)) {
        let kanjiBlock = char;
        let tempPos = textPos + 1;
        
        // 收集连续的汉字
        while (tempPos < textSeg.length && isKanji(textSeg[tempPos])) {
          kanjiBlock += textSeg[tempPos];
          tempPos++;
        }
        
        // 查找下一个假名在reading中的位置
        let nextKana = '';
        let nextKanaPos = tempPos;
        while (nextKanaPos < textSeg.length) {
          const c = textSeg[nextKanaPos];
          if (isHiragana(c) || isKatakana(c)) {
            nextKana = c;
            break;
          }
          nextKanaPos++;
        }
        
        let kanjiReading = '';
        if (nextKana) {
          // 在reading中查找这个假名
          const kanaIdx = readingSeg.indexOf(nextKana, readingPos);
          if (kanaIdx !== -1) {
            kanjiReading = readingSeg.substring(readingPos, kanaIdx);
            readingPos = kanaIdx;
          } else {
            // 找不到假名,取剩余的reading
            kanjiReading = readingSeg.substring(readingPos);
            readingPos = readingSeg.length;
          }
        } else {
          // 没有后续假名,取剩余的reading
          kanjiReading = readingSeg.substring(readingPos);
          readingPos = readingSeg.length;
        }
        
        result.push({
          type: 'ruby',
          content: kanjiBlock,
          reading: kanjiReading
        });
        
        textPos = tempPos;
        continue;
      }
      
      // 其他字符直接添加
      result.push({ type: 'text', content: char });
      textPos++;
    }
  }
  
  return result;
}

// 测试
const text = '謙虚な姿勢を示す表現を覚える';
const reading = 'けんきょなしせいをしめすひょうげんをおぼえる';

console.log('\n原文:', text);
console.log('Reading:', reading);
console.log('\n结果:');

const result = alignKanjiWithReading(text, reading);
result.forEach(item => {
  if (item.type === 'ruby') {
    console.log(`${item.content}(${item.reading})`);
  } else {
    console.log(item.content);
  }
});
