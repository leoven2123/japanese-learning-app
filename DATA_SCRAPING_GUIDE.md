# 日语词汇和语法数据爬取指南

本指南介绍如何获取大量日语学习数据,包括词汇、语法、例句等。

---

## 📚 方法一: 使用现成的开源数据集 (最简单,推荐)

### 优点:
- ✅ 无需编程
- ✅ 数据质量高
- ✅ 合法合规
- ✅ 立即可用

### 推荐数据源:

#### 1. **JMdict (日英词典项目)**
- **网址**: https://www.edrdg.org/jmdict/j_jmdict.html
- **内容**: 18万+日语词汇,包含读音、释义、词性
- **格式**: XML/JSON
- **下载**: 
  ```bash
  wget http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz
  gunzip JMdict_e.gz
  ```

#### 2. **JLPT词汇表 (GitHub)**
- **网址**: https://github.com/stephenmk/JMdictDB
- **内容**: 按JLPT等级分类的词汇
- **格式**: JSON/CSV
- **下载**: 直接克隆仓库

#### 3. **Tatoeba (例句数据库)**
- **网址**: https://tatoeba.org/zh-hans/downloads
- **内容**: 100万+日语例句,带中文翻译
- **格式**: TSV
- **下载**:
  ```bash
  wget https://downloads.tatoeba.org/exports/sentences.tar.bz2
  ```

#### 4. **日本語文法辞典 (语法数据)**
- **网址**: https://github.com/asdfjkl/jgram
- **内容**: N5-N1语法点,带例句
- **格式**: JSON

---

## 🕷️ 方法二: 爬取在线词典网站 (需要编程)

### ⚠️ 注意事项:
- 遵守网站的robots.txt
- 控制爬取速度,避免给服务器造成压力
- 仅用于个人学习,不用于商业用途

### 推荐爬取目标:

#### 1. **Jisho.org (日英词典)**
- **网址**: https://jisho.org/
- **特点**: 有API,合法调用
- **API文档**: https://jisho.org/forum/54fefc1f6e73340b1f160000-is-there-any-kind-of-search-api

**Python示例**:
```python
import requests
import json
import time

def scrape_jisho(word):
    url = f"https://jisho.org/api/v1/search/words?keyword={word}"
    response = requests.get(url)
    return response.json()

# 爬取JLPT N5词汇
n5_words = ["会う", "青い", "赤い", "秋", "開ける"]
results = []

for word in n5_words:
    print(f"正在爬取: {word}")
    data = scrape_jisho(word)
    
    if data['data']:
        entry = data['data'][0]
        results.append({
            'expression': entry['japanese'][0]['word'],
            'reading': entry['japanese'][0]['reading'],
            'meaning': '; '.join(entry['senses'][0]['english_definitions']),
            'level': 'N5'
        })
    
    time.sleep(1)  # 避免请求过快

# 保存为JSON
with open('vocabulary.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"爬取完成!共{len(results)}个词汇")
```

#### 2. **JLPT Sensei (JLPT学习网站)**
- **网址**: https://jlptsensei.com/
- **内容**: 按等级分类的词汇和语法

**Python爬虫示例**:
```python
import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_jlpt_sensei_vocab(level='n5'):
    url = f"https://jlptsensei.com/jlpt-{level}-vocabulary-list/"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    vocab_list = []
    
    # 找到词汇表格
    table = soup.find('table', class_='jl-table')
    if table:
        rows = table.find_all('tr')[1:]  # 跳过表头
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 3:
                vocab_list.append({
                    'expression': cols[0].text.strip(),
                    'reading': cols[1].text.strip(),
                    'meaning': cols[2].text.strip(),
                    'level': level.upper()
                })
    
    return vocab_list

# 爬取N5-N1词汇
all_vocab = []
for level in ['n5', 'n4', 'n3', 'n2', 'n1']:
    print(f"正在爬取 {level.upper()} 词汇...")
    vocab = scrape_jlpt_sensei_vocab(level)
    all_vocab.extend(vocab)
    print(f"  完成! 获取{len(vocab)}个词汇")
    time.sleep(2)

# 保存
with open('jlpt_vocabulary.json', 'w', encoding='utf-8') as f:
    json.dump(all_vocab, f, ensure_ascii=False, indent=2)

print(f"总共爬取 {len(all_vocab)} 个词汇")
```

#### 3. **日本語の例文 (例句网站)**
- **网址**: https://yourei.jp/
- **内容**: 大量真实例句

---

## 🤖 方法三: 使用AI生成数据 (最灵活)

### 使用场景:
- 补充缺失的数据
- 生成例句
- 扩展释义

### 示例: 使用OpenAI API生成词汇数据

**Python示例**:
```python
import openai
import json

openai.api_key = 'your-api-key'

def generate_vocabulary_data(word_list, level):
    prompt = f"""
    请为以下{level}级别的日语词汇生成详细信息,返回JSON格式:
    
    词汇列表: {', '.join(word_list)}
    
    每个词汇需要包含:
    - expression: 日文表达
    - reading: 假名读音
    - romaji: 罗马音
    - meaning: 中文释义
    - partOfSpeech: 词性
    - examples: 2个例句(日文、假名、中文)
    
    返回JSON数组格式。
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是日语教学专家"},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)

# 使用
words = ["会う", "青い", "赤い"]
data = generate_vocabulary_data(words, "N5")

with open('ai_generated_vocab.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

---

## 🛠️ 方法四: 完整爬虫项目 (专业级)

### 使用Scrapy框架

**安装**:
```bash
pip install scrapy
```

**创建项目**:
```bash
scrapy startproject jlpt_scraper
cd jlpt_scraper
```

**创建爬虫** (`spiders/vocabulary_spider.py`):
```python
import scrapy
import json

class VocabularySpider(scrapy.Spider):
    name = 'vocabulary'
    start_urls = [
        'https://jlptsensei.com/jlpt-n5-vocabulary-list/',
        'https://jlptsensei.com/jlpt-n4-vocabulary-list/',
    ]
    
    def parse(self, response):
        # 提取JLPT等级
        level = response.url.split('jlpt-')[1].split('-')[0].upper()
        
        # 解析表格
        for row in response.css('table.jl-table tr')[1:]:
            cols = row.css('td::text').getall()
            if len(cols) >= 3:
                yield {
                    'expression': cols[0].strip(),
                    'reading': cols[1].strip(),
                    'meaning': cols[2].strip(),
                    'level': level
                }

# 运行爬虫
# scrapy crawl vocabulary -o vocabulary.json
```

---

## 📊 数据处理和清洗

爬取到数据后,需要清洗和标准化:

**Python清洗脚本**:
```python
import json
import re

def clean_vocabulary_data(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    cleaned_data = []
    seen = set()
    
    for item in data:
        # 去重
        if item['expression'] in seen:
            continue
        seen.add(item['expression'])
        
        # 清洗数据
        cleaned_item = {
            'expression': item['expression'].strip(),
            'reading': re.sub(r'[^\u3040-\u309F]', '', item['reading']),  # 只保留平假名
            'meaning': item['meaning'].strip(),
            'level': item.get('level', 'N5').upper()
        }
        
        # 验证必填字段
        if all([cleaned_item['expression'], 
                cleaned_item['reading'], 
                cleaned_item['meaning']]):
            cleaned_data.append(cleaned_item)
    
    # 保存
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
    
    print(f"清洗完成! 原始: {len(data)}, 清洗后: {len(cleaned_data)}")

# 使用
clean_vocabulary_data('raw_vocabulary.json', 'cleaned_vocabulary.json')
```

---

## 🎯 推荐方案

### 对于非程序员:
1. **下载现成数据集** (JMdict, GitHub开源项目)
2. **使用在线转换工具** 将XML转为JSON
3. **上传到应用** 通过 `/admin/import` 导入

### 对于初学者程序员:
1. **使用Jisho.org API** (有官方API,合法)
2. **编写简单Python脚本** 调用API获取数据
3. **保存为JSON** 然后导入应用

### 对于有经验的程序员:
1. **使用Scrapy框架** 爬取多个网站
2. **数据清洗和去重**
3. **批量导入数据库**

---

## 📝 完整工作流程示例

### 场景: 获取N5-N1全部词汇

**第1步: 下载JMdict数据**
```bash
wget http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz
gunzip JMdict_e.gz
```

**第2步: 解析XML并筛选JLPT词汇**
```python
import xml.etree.ElementTree as ET
import json

def parse_jmdict(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    vocab_list = []
    
    for entry in root.findall('entry'):
        # 提取日文
        kanji = entry.find('.//keb')
        reading = entry.find('.//reb')
        
        # 提取释义
        senses = entry.findall('.//sense')
        meanings = []
        for sense in senses:
            glosses = sense.findall('gloss')
            meanings.extend([g.text for g in glosses if g.text])
        
        # 提取JLPT等级
        misc = entry.find('.//misc')
        level = None
        if misc is not None and 'jlpt' in misc.text.lower():
            level = misc.text
        
        if kanji is not None and reading is not None and meanings:
            vocab_list.append({
                'expression': kanji.text,
                'reading': reading.text,
                'meaning': '; '.join(meanings[:3]),
                'level': level or 'N5'
            })
    
    return vocab_list

# 解析并保存
vocab = parse_jmdict('JMdict_e')
with open('jmdict_vocabulary.json', 'w', encoding='utf-8') as f:
    json.dump(vocab, f, ensure_ascii=False, indent=2)
```

**第3步: 导入到应用**
- 方式1: 通过 `/admin/import` 上传JSON
- 方式2: 运行导入脚本
- 方式3: 在Manus对话中请求导入

---

## ⚖️ 法律和道德考虑

### ✅ 合法的数据来源:
- 开源数据集 (JMdict, Tatoeba等)
- 有公开API的网站 (Jisho.org)
- 自己创建的数据
- AI生成的数据

### ⚠️ 需要注意:
- 遵守网站的robots.txt
- 不要过度请求,避免DDoS
- 标注数据来源
- 仅用于个人学习,不商用

### ❌ 不推荐:
- 爬取明确禁止的网站
- 商业化使用他人数据
- 不标注来源

---

## 🚀 快速开始

**如果您想立即获取数据**:

### 方案A: 我帮您爬取 (最快)
直接告诉我:
```
"帮我爬取N5-N1的词汇数据"
```
我会立即执行爬虫并导入数据库!

### 方案B: 使用现成数据 (最简单)
1. 访问 https://github.com/stephenmk/JMdictDB
2. 下载JSON文件
3. 上传到 `/admin/import`

### 方案C: 自己编写爬虫 (最灵活)
1. 选择上面的Python示例
2. 修改目标网站和字段
3. 运行脚本获取数据

---

## 💡 推荐资源

### 数据源:
- JMdict: http://www.edrdg.org/jmdict/j_jmdict.html
- Tatoeba: https://tatoeba.org/zh-hans/downloads
- JLPT词汇: https://github.com/topics/jlpt-vocabulary

### 工具:
- Python + Requests + BeautifulSoup (简单爬虫)
- Scrapy (专业爬虫框架)
- Jisho.org API (官方接口)

### 学习资源:
- Python爬虫教程: https://realpython.com/python-web-scraping-practical-introduction/
- Scrapy文档: https://docs.scrapy.org/

---

需要我现在帮您爬取数据吗?或者您想自己尝试编写爬虫?
