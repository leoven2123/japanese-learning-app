#!/usr/bin/env python3
"""
JLPT N5-N1 词汇数据爬虫
从Jisho.org API获取词汇数据
"""

import requests
import json
import time
from typing import List, Dict

# JLPT各等级的常用词汇列表(种子词汇)
JLPT_SEED_WORDS = {
    'N5': [
        '会う', '青い', '赤い', '秋', '開ける', '朝', '足', '明日', '頭', '新しい',
        '暑い', '厚い', '兄', '姉', '暖かい', 'あなた', 'あの', 'アパート', 'あまり', 'あめ',
        '洗う', 'ある', '歩く', 'いい', '言う', '家', 'いくつ', 'いくら', '池', '医者',
        '忙しい', '痛い', '一', '五日', '一緒', 'いつ', '五つ', 'いつも', '犬', '今',
        '意味', '妹', 'いや', '入口', 'いる', '色', '上', '後ろ', '薄い', '歌',
        '生まれる', '海', '売る', '上着', 'うるさい', '絵', '映画', '英語', '駅', 'エレベーター',
        '鉛筆', 'おいしい', '多い', '大きい', 'お金', '起きる', '奥さん', '教える', '押す', 'お茶',
        '弟', '男', '同じ', 'おなか', 'お兄さん', 'お姉さん', 'おばあさん', 'おじいさん', 'おじさん', 'おばさん',
        '覚える', '終わる', '降りる', '音楽', '女', '泳ぐ', '外国', '会社', '階段', '買う',
        '返す', '掛かる', '書く', '学生', '傘', '貸す', '風', '家族', '方', '学校',
    ],
    'N4': [
        '合う', '相手', '上がる', '上げる', '朝ご飯', '味', '集まる', '集める', '厚い', '暑い',
        '後', '熱い', '兄', '姉', '油', '危ない', '甘い', '余り', '謝る', '洗う',
        '表す', '現れる', '泡', '合わせる', '慌てる', '案内', '安心', '以上', '以下', '医学',
        '意見', '以外', '生きる', '行く', '幾ら', '池', '意志', '石', '以下', '医者',
        '忙しい', '一度', '一緒に', '何時も', '田舎', '祈る', '今', '意味', '嫌', '妹',
        '入口', '色', '祝う', '岩', '植える', '上', '動く', '失う', '薄い', '歌う',
        '生まれる', '売る', '嬉しい', '上着', '煩い', '運転', '絵', '選ぶ', '得る', '遠慮',
        '終える', '追う', '応援', '多い', '大きな', '起こる', '起こす', '送る', '怒る', '遅れる',
        '教える', '落ちる', '落とす', '音', '踊る', '驚く', '思い出す', '思う', '重い', '主に',
        '泳ぐ', '親', '終わる', '下りる', '卸す', '音楽', '女の子', '男の子', '会', '会議',
    ],
    'N3': [
        '空き', '諦める', '上がる', '明かり', '赤ちゃん', '空く', '開く', '握る', '朝寝坊', '味わう',
        '預かる', '与える', '暖まる', '暖める', '余る', '現す', '荒れる', '合わせる', '慌てる', '泡',
        '哀れ', '案外', '安全', '案内', '以後', '意義', '生き物', '勢い', '以降', '意志',
        '維持', '以上', '以前', '板', '一部', '一方', '一瞬', '一生', '一致', '一般',
        '移動', '祈る', '意欲', '嫌がる', '否定', '以来', '入れ物', '祝い', '岩', '印',
        '印象', '引用', '受け取る', '受付', '動かす', '失う', '疑う', '薄める', '打つ', '美しい',
        '訴える', '移る', '写る', '映る', '生まれつき', '産む', '梅', '埋める', '裏', '売り場',
        '上回る', '嬉しがる', '運', '運送', '運動', '映す', '栄える', '液', '駅員', '枝',
        '選挙', '演じる', '延期', '遠慮', '追い付く', '追い越す', '応じる', '応接', '応用', '大いに',
        '大型', '大勢', '大抵', '大家', '起き上がる', '屋上', '抑える', '怒り', '遅らせる', '贈る',
    ],
    'N2': [
        '空き缶', '飽きる', '憧れ', '扱う', '預ける', '与える', '改めて', '怪しい', '誤り', '荒らす',
        '争う', '現れる', '表れる', '有難い', '改まる', '改める', '慌ただしい', '泡立つ', '哀れむ', '憐れむ',
        '案の定', '安易', '暗記', '安定', '案内所', '以後', '意義', '生き生き', '勢い', '異議',
        '意向', '以降', '意識', '維持', '異常', '以上', '以前', '板挟み', '一部', '一方',
        '一斉', '一瞬', '一生懸命', '一致', '一般的', '一流', '移転', '移動', '祈り', '意欲',
        '嫌がらせ', '否応なし', '以来', '入れ替える', '祝う', '岩石', '印刷', '印象的', '引用', '受け入れる',
        '受け止める', '受付', '動き出す', '失われる', '疑わしい', '薄暗い', '打ち明ける', '美しさ', '訴え', '移り変わる',
        '写し', '映し出す', '生まれ育つ', '産み出す', '梅雨', '埋め立てる', '裏切る', '売り上げ', '上回り', '嬉しさ',
        '運営', '運送業', '運動会', '映し出す', '栄養', '液体', '駅前', '枝分かれ', '選挙権', '演技',
        '延長', '遠慮がち', '追い込む', '追い抜く', '応援団', '応接室', '応用問題', '大いなる', '大型化', '大勢',
    ],
    'N1': [
        '空き地', '飽き飽き', '憧れる', '扱い', '預け入れる', '与党', '改めまして', '怪しげ', '誤る', '荒廃',
        '争い事', '現れ方', '表れ方', '有難がる', '改まった', '改め直す', '慌ただしさ', '泡沫', '哀れみ', '憐憫',
        '案ずる', '安易さ', '暗記力', '安定感', '案内役', '以後', '意義深い', '生き様', '勢い込む', '異議申し立て',
        '意向調査', '以降', '意識調査', '維持費', '異常気象', '以上述べる', '以前から', '板挟み状態', '一部始終', '一方的',
        '一斉に', '一瞬にして', '一生涯', '一致団結', '一般論', '一流品', '移転先', '移動手段', '祈り続ける', '意欲的',
        '嫌がらせ行為', '否応なしに', '以来ずっと', '入れ替え作業', '祝賀会', '岩盤', '印刷物', '印象深い', '引用文', '受け入れ態勢',
        '受け止め方', '受付係', '動き回る', '失われつつある', '疑わしげ', '薄暗がり', '打ち明け話', '美しき', '訴え続ける', '移り変わり',
        '写し取る', '映し出され方', '生まれ故郷', '産み落とす', '梅雨入り', '埋め尽くす', '裏切り者', '売り上げ高', '上回る勢い', '嬉しげ',
        '運営方針', '運送会社', '運動不足', '映し出す様', '栄養価', '液状化', '駅周辺', '枝葉末節', '選挙活動', '演技力',
        '延長戦', '遠慮深い', '追い詰める', '追い越し車線', '応援歌', '応接間', '応用力', '大いに期待', '大型店', '大勢の人',
    ]
}

def scrape_jisho_api(word: str) -> Dict:
    """从Jisho.org API获取词汇信息"""
    url = f"https://jisho.org/api/v1/search/words?keyword={word}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  ✗ 获取失败: {word} - {str(e)}")
        return None

def parse_jisho_data(data: Dict, level: str) -> Dict:
    """解析Jisho API返回的数据"""
    if not data or not data.get('data'):
        return None
    
    entry = data['data'][0]
    japanese = entry.get('japanese', [{}])[0]
    senses = entry.get('senses', [{}])[0]
    
    # 提取词汇信息
    expression = japanese.get('word', japanese.get('reading', ''))
    reading = japanese.get('reading', '')
    
    # 提取释义
    meanings = senses.get('english_definitions', [])
    meaning = '; '.join(meanings[:3]) if meanings else ''
    
    # 提取词性
    parts_of_speech = senses.get('parts_of_speech', [])
    part_of_speech = ', '.join(parts_of_speech[:2]) if parts_of_speech else ''
    
    if not expression or not reading or not meaning:
        return None
    
    return {
        'expression': expression,
        'reading': reading,
        'meaning': meaning,
        'jlptLevel': level,
        'partOfSpeech': part_of_speech,
        'romaji': '',  # Jisho API不直接提供罗马音
        'category': 'standard'
    }

def scrape_vocabulary_by_level(level: str, words: List[str]) -> List[Dict]:
    """爬取指定等级的词汇"""
    print(f"\n开始爬取 {level} 词汇...")
    results = []
    
    for i, word in enumerate(words, 1):
        print(f"  [{i}/{len(words)}] 正在爬取: {word}")
        
        data = scrape_jisho_api(word)
        if data:
            parsed = parse_jisho_data(data, level)
            if parsed:
                results.append(parsed)
                print(f"    ✓ 成功: {parsed['expression']} - {parsed['meaning'][:30]}...")
        
        # 控制请求频率,避免被封
        time.sleep(1)
    
    print(f"  完成! 成功爬取 {len(results)}/{len(words)} 个词汇")
    return results

def main():
    """主函数"""
    print("=" * 60)
    print("JLPT N5-N1 词汇数据爬虫")
    print("=" * 60)
    
    all_vocabulary = []
    
    # 爬取各等级词汇
    for level in ['N5', 'N4', 'N3', 'N2', 'N1']:
        words = JLPT_SEED_WORDS.get(level, [])
        if words:
            vocab_list = scrape_vocabulary_by_level(level, words)
            all_vocabulary.extend(vocab_list)
    
    # 保存为JSON
    output_file = '/home/ubuntu/japanese-learning-app/data/scraped_vocabulary.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_vocabulary, f, ensure_ascii=False, indent=2)
    
    print(f"\n" + "=" * 60)
    print(f"爬取完成!")
    print(f"总共爬取: {len(all_vocabulary)} 个词汇")
    print(f"保存位置: {output_file}")
    print("=" * 60)
    
    # 统计各等级数量
    level_counts = {}
    for vocab in all_vocabulary:
        level = vocab['jlptLevel']
        level_counts[level] = level_counts.get(level, 0) + 1
    
    print("\n各等级词汇数量:")
    for level in ['N5', 'N4', 'N3', 'N2', 'N1']:
        count = level_counts.get(level, 0)
        print(f"  {level}: {count} 个")

if __name__ == '__main__':
    # 创建数据目录
    import os
    os.makedirs('/home/ubuntu/japanese-learning-app/data', exist_ok=True)
    
    main()
