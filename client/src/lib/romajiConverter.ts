/**
 * 罗马音转假名转换工具
 * 支持平假名和片假名转换
 */

// 罗马音到平假名映射表
const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  // 基础五十音
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wi': 'ゐ', 'we': 'ゑ', 'wo': 'を',
  'n': 'ん',
  
  // 拗音
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  
  // 其他常见组合
  'si': 'し', 'ti': 'ち', 'tu': 'つ', 'hu': 'ふ',
  'zi': 'じ', 'dzi': 'ぢ', 'dzu': 'づ',
  'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
  'tya': 'ちゃ', 'tyu': 'ちゅ', 'tyo': 'ちょ',
  'zya': 'じゃ', 'zyu': 'じゅ', 'zyo': 'じょ',
  'dya': 'ぢゃ', 'dyu': 'ぢゅ', 'dyo': 'ぢょ',
  
  // 长音符号
  '-': 'ー',
};

// 平假名到片假名映射表
const HIRAGANA_TO_KATAKANA: Record<string, string> = {
  'あ': 'ア', 'い': 'イ', 'う': 'ウ', 'え': 'エ', 'お': 'オ',
  'か': 'カ', 'き': 'キ', 'く': 'ク', 'け': 'ケ', 'こ': 'コ',
  'が': 'ガ', 'ぎ': 'ギ', 'ぐ': 'グ', 'げ': 'ゲ', 'ご': 'ゴ',
  'さ': 'サ', 'し': 'シ', 'す': 'ス', 'せ': 'セ', 'そ': 'ソ',
  'ざ': 'ザ', 'じ': 'ジ', 'ず': 'ズ', 'ぜ': 'ゼ', 'ぞ': 'ゾ',
  'た': 'タ', 'ち': 'チ', 'つ': 'ツ', 'て': 'テ', 'と': 'ト',
  'だ': 'ダ', 'ぢ': 'ヂ', 'づ': 'ヅ', 'で': 'デ', 'ど': 'ド',
  'な': 'ナ', 'に': 'ニ', 'ぬ': 'ヌ', 'ね': 'ネ', 'の': 'ノ',
  'は': 'ハ', 'ひ': 'ヒ', 'ふ': 'フ', 'へ': 'ヘ', 'ほ': 'ホ',
  'ば': 'バ', 'び': 'ビ', 'ぶ': 'ブ', 'べ': 'ベ', 'ぼ': 'ボ',
  'ぱ': 'パ', 'ぴ': 'ピ', 'ぷ': 'プ', 'ぺ': 'ペ', 'ぽ': 'ポ',
  'ま': 'マ', 'み': 'ミ', 'む': 'ム', 'め': 'メ', 'も': 'モ',
  'や': 'ヤ', 'ゆ': 'ユ', 'よ': 'ヨ',
  'ら': 'ラ', 'り': 'リ', 'る': 'ル', 'れ': 'レ', 'ろ': 'ロ',
  'わ': 'ワ', 'ゐ': 'ヰ', 'ゑ': 'ヱ', 'を': 'ヲ',
  'ん': 'ン',
  'きゃ': 'キャ', 'きゅ': 'キュ', 'きょ': 'キョ',
  'ぎゃ': 'ギャ', 'ぎゅ': 'ギュ', 'ぎょ': 'ギョ',
  'しゃ': 'シャ', 'しゅ': 'シュ', 'しょ': 'ショ',
  'じゃ': 'ジャ', 'じゅ': 'ジュ', 'じょ': 'ジョ',
  'ちゃ': 'チャ', 'ちゅ': 'チュ', 'ちょ': 'チョ',
  'にゃ': 'ニャ', 'にゅ': 'ニュ', 'にょ': 'ニョ',
  'ひゃ': 'ヒャ', 'ひゅ': 'ヒュ', 'ひょ': 'ヒョ',
  'びゃ': 'ビャ', 'びゅ': 'ビュ', 'びょ': 'ビョ',
  'ぴゃ': 'ピャ', 'ぴゅ': 'ピュ', 'ぴょ': 'ピョ',
  'みゃ': 'ミャ', 'みゅ': 'ミュ', 'みょ': 'ミョ',
  'りゃ': 'リャ', 'りゅ': 'リュ', 'りょ': 'リョ',
  'っ': 'ッ',
  'ー': 'ー',
};

export interface ConversionCandidate {
  hiragana: string;
  katakana: string;
  romaji: string;
}

/**
 * 将罗马音转换为假名
 */
export function convertRomajiToKana(romaji: string): ConversionCandidate[] {
  const candidates: ConversionCandidate[] = [];
  const lowerRomaji = romaji.toLowerCase().trim();
  
  if (!lowerRomaji) return candidates;
  
  let result = '';
  let i = 0;
  
  while (i < lowerRomaji.length) {
    let matched = false;
    
    // 处理促音(双辅音)
    if (i < lowerRomaji.length - 1 && 
        lowerRomaji[i] === lowerRomaji[i + 1] && 
        /[kstpgzdbh]/.test(lowerRomaji[i])) {
      result += 'っ';
      i++;
      continue;
    }
    
    // 尝试匹配3个字符
    if (i <= lowerRomaji.length - 3) {
      const three = lowerRomaji.substring(i, i + 3);
      if (ROMAJI_TO_HIRAGANA[three]) {
        result += ROMAJI_TO_HIRAGANA[three];
        i += 3;
        matched = true;
      }
    }
    
    // 尝试匹配2个字符
    if (!matched && i <= lowerRomaji.length - 2) {
      const two = lowerRomaji.substring(i, i + 2);
      if (ROMAJI_TO_HIRAGANA[two]) {
        result += ROMAJI_TO_HIRAGANA[two];
        i += 2;
        matched = true;
      }
    }
    
    // 尝试匹配1个字符
    if (!matched) {
      const one = lowerRomaji[i];
      if (ROMAJI_TO_HIRAGANA[one]) {
        result += ROMAJI_TO_HIRAGANA[one];
        i++;
        matched = true;
      } else {
        // 保留无法转换的字符
        result += one;
        i++;
      }
    }
  }
  
  if (result) {
    // 转换为片假名
    const katakana = Array.from(result)
      .map(char => HIRAGANA_TO_KATAKANA[char] || char)
      .join('');
    
    candidates.push({
      hiragana: result,
      katakana: katakana,
      romaji: lowerRomaji,
    });
  }
  
  return candidates;
}

/**
 * 获取当前输入的罗马音候选
 * 从光标位置向前查找未转换的罗马音
 */
export function getCurrentRomajiInput(text: string, cursorPosition: number): {
  romaji: string;
  startPos: number;
  endPos: number;
} | null {
  if (cursorPosition === 0) return null;
  
  // 向前查找到空格、标点或开头
  let startPos = cursorPosition - 1;
  while (startPos > 0 && /[a-zA-Z-]/.test(text[startPos - 1])) {
    startPos--;
  }
  
  const romaji = text.substring(startPos, cursorPosition);
  
  if (romaji && /^[a-zA-Z-]+$/.test(romaji)) {
    return {
      romaji,
      startPos,
      endPos: cursorPosition,
    };
  }
  
  return null;
}
