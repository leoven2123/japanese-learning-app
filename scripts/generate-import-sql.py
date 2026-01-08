#!/usr/bin/env python3
"""
生成JLPT词汇导入SQL语句
"""

import csv
import json

CSV_DIR = '/home/ubuntu/jlpt-word-list/src'

def escape_sql(text):
    """转义SQL字符串"""
    if not text:
        return ''
    return text.replace("'", "''").replace('\\', '\\\\')

def generate_vocabulary_json(level):
    """生成词汇JSON数据"""
    csv_file = f'{CSV_DIR}/{level.lower()}.csv'
    
    data = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append({
                'expression': row['expression'],
                'reading': row['reading'],
                'meaning': row['meaning'],
                'jlptLevel': level,
                'tags': row.get('tags', ''),
                'category': 'standard'
            })
    
    return data

# 生成所有等级的数据
all_data = []
for level in ['N5', 'N4', 'N3', 'N2', 'N1']:
    print(f'处理 {level}...')
    level_data = generate_vocabulary_json(level)
    all_data.extend(level_data)
    print(f'  {level}: {len(level_data)} 个词汇')

# 保存为JSON
output_file = '/home/ubuntu/japanese-learning-app/data/jlpt_vocabulary_full.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print(f'\n总计: {len(all_data)} 个词汇')
print(f'保存到: {output_file}')
