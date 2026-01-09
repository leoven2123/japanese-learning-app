// 测试按标点分段的新算法

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

// 按标点分段的新算法
function buildRubyTextSegmented(original, reading) {
  if (!hasKanji(original)) {
    return original;
  }

  // 第一步：将原文按标点分段
  const segments = [];
  let currentSegment = '';
  
  for (const char of original) {
    if (isKana(char) || isKanjiChar(char)) {
      currentSegment += char;
    } else {
      // 遇到标点或其他字符
      if (currentSegment) {
        segments.push({ text: currentSegment, isPunct: false });
        currentSegment = '';
      }
      segments.push({ text: char, isPunct: true });
    }
  }
  if (currentSegment) {
    segments.push({ text: currentSegment, isPunct: false });
  }
  
  console.log('Segments:', segments);
  
  // 第二步：为每个非标点段落分配reading
  const segmentReadings = [];
  let readingPos = 0;
  
  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const segment = segments[segIdx];
    if (segment.isPunct) {
      segmentReadings.push('');
      continue;
    }
    
    // 提取段落中的假名
    let segmentKana = '';
    for (const char of segment.text) {
      if (isKana(char)) {
        segmentKana += char;
      }
    }
    
    if (segmentKana) {
      // 检查段落是否包含汉字
      const hasKanjiInSegment = Array.from(segment.text).some(isKanjiChar);
      
      if (!hasKanjiInSegment) {
        // 纯假名段落，直接使用假名本身作为reading
        const kanaPos = findKanaInReading(reading, segmentKana, readingPos);
        if (kanaPos !== -1) {
          segmentReadings.push(reading.substring(kanaPos, kanaPos + segmentKana.length));
          readingPos = kanaPos + segmentKana.length;
        } else {
          segmentReadings.push(segmentKana);
        }
      } else {
        // 包含汉字的段落，需要查找下一个段落的假名作为边界
        const kanaPos = findKanaInReading(reading, segmentKana, readingPos);
        if (kanaPos !== -1) {
          // 查找下一个段落的假名
          let nextSegmentKana = '';
          for (let nextSegIdx = segIdx + 1; nextSegIdx < segments.length; nextSegIdx++) {
            const nextSeg = segments[nextSegIdx];
            if (nextSeg.isPunct) continue;
            for (const char of nextSeg.text) {
              if (isKana(char)) {
                nextSegmentKana += char;
              }
            }
            if (nextSegmentKana) break;
          }
          
          let segmentEndPos;
          if (nextSegmentKana) {
            const nextKanaPos = findKanaInReading(reading, nextSegmentKana, kanaPos + segmentKana.length);
            segmentEndPos = nextKanaPos !== -1 ? nextKanaPos : reading.length;
          } else {
            segmentEndPos = reading.length;
          }
          
          segmentReadings.push(reading.substring(readingPos, segmentEndPos));
          readingPos = segmentEndPos;
        } else {
          segmentReadings.push(reading.substring(readingPos));
          readingPos = reading.length;
        }
      }
    } else {
      // 没有假名，全是汉字，估算reading长度（汉字数 * 2）
      const kanjiCount = Array.from(segment.text).filter(isKanjiChar).length;
      const estimatedLength = Math.min(kanjiCount * 2, reading.length - readingPos);
      segmentReadings.push(reading.substring(readingPos, readingPos + estimatedLength));
      readingPos += estimatedLength;
    }
  }
  
  console.log('Segment readings:', segmentReadings);
  
  // 第三步：在每个段落内部分配注音
  let result = '';
  
  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const segment = segments[segIdx];
    const segReading = segmentReadings[segIdx];
    
    if (segment.isPunct) {
      result += segment.text;
      continue;
    }
    
    // 在段落内部分配注音
    let segReadingPos = 0;
    let i = 0;
    
    while (i < segment.text.length) {
      const char = segment.text[i];
      
      if (isKana(char)) {
        // 假名：在段落reading中找到对应位置并跳过
        const kanaInReading = findKanaInReading(segReading, char, segReadingPos);
        if (kanaInReading !== -1) {
          segReadingPos = kanaInReading + 1;
        }
        result += char;
        i++;
      } else if (isKanjiChar(char)) {
        // 汉字：收集连续的汉字块
        let kanjiBlock = char;
        let j = i + 1;
        while (j < segment.text.length && isKanjiChar(segment.text[j])) {
          kanjiBlock += segment.text[j];
          j++;
        }
        
        // 查找下一个假名作为边界
        let nextKana = '';
        let nextKanaPos = j;
        while (nextKanaPos < segment.text.length && !isKana(segment.text[nextKanaPos])) {
          nextKanaPos++;
        }
        if (nextKanaPos < segment.text.length) {
          nextKana = segment.text[nextKanaPos];
        }
        
        let kanjiReading = '';
        if (nextKana) {
          // 有下一个假名，找到它在reading中的位置
          const nextPos = findKanaInReading(segReading, nextKana, segReadingPos);
          if (nextPos !== -1 && nextPos > segReadingPos) {
            kanjiReading = segReading.substring(segReadingPos, nextPos);
            segReadingPos = nextPos;
          }
        } else {
          // 没有下一个假名，取剩余的reading
          kanjiReading = segReading.substring(segReadingPos);
          segReadingPos = segReading.length;
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
  }
  
  return result;
}

// 测试
const testCases = [
  { original: "ねえ、今週の土曜日、暇？", reading: "ねえこんしゅうのどようびひま" },
  { original: "新しいカフェができたんだって。一緒に行こうよ！", reading: "あたらしいかふぇができたんだっていっしょにいこうよ" },
];

testCases.forEach(({ original, reading }) => {
  console.log('\n=== Test Case ===');
  console.log('Original:', original);
  console.log('Reading:', reading);
  console.log('Result:', buildRubyTextSegmented(original, reading));
  console.log('Expected: ねえ、今週(こんしゅう)の土曜日(どようび)、暇(ひま)？');
});
