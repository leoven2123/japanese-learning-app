# 日语学习应用 - 数据库设计文档

## 设计原则

1. **清晰的命名**: 所有表名和字段名使用英文,见名知意
2. **完善的注释**: 每个表和字段都有详细的中英文注释
3. **合理的索引**: 为常用查询字段建立索引
4. **AI友好**: 结构清晰,便于大模型理解和操作
5. **易于维护**: 遵循数据库设计规范,便于后期扩展

## 核心表结构

### 1. users - 用户表
存储用户基本信息和认证数据
- id: 主键
- openId: Manus OAuth标识
- name, email: 用户信息
- role: 用户角色(admin/user)
- createdAt, updatedAt, lastSignedIn: 时间戳

### 2. vocabulary - 词汇表
存储日语词汇的完整信息
- id: 主键
- expression: 日文表达(汉字+假名)
- reading: 假名读音
- romaji: 罗马音
- meaning: 中文释义
- partOfSpeech: 词性
- jlptLevel: JLPT等级(N5-N1)
- difficulty: 难度级别
- tags: 标签(JSON数组)
- 索引: jlptLevel, expression, reading

### 3. grammar - 语法表
存储日语语法点信息
- id: 主键
- pattern: 语法句型
- meaning: 中文解释
- usage: 使用说明
- jlptLevel: JLPT等级
- difficulty: 难度级别
- tags: 标签
- 索引: jlptLevel, pattern

### 4. sentences - 例句表
存储日语例句和翻译
- id: 主键
- japanese: 日文例句
- reading: 假名标注
- romaji: 罗马音
- chinese: 中文翻译
- source: 来源(动漫/日剧/文学等)
- difficulty: 难度级别
- tags: 标签
- 索引: japanese, source

### 5. scenes - 学习场景表
存储场景化学习内容
- id: 主键
- title: 场景标题
- description: 场景描述
- category: 场景分类(日常/商务/旅游等)
- difficulty: 难度级别
- orderIndex: 排序顺序
- content: 场景详细内容(JSON)

### 6. learning_progress - 学习进度表
记录用户的学习进度
- id: 主键
- userId: 用户ID(外键)
- itemType: 学习项类型(vocabulary/grammar/scene)
- itemId: 学习项ID
- masteryLevel: 掌握程度(learning/familiar/mastered)
- reviewCount: 复习次数
- lastReviewedAt: 最后复习时间
- nextReviewAt: 下次复习时间
- 索引: userId, itemType, itemId
- 复合索引: (userId, nextReviewAt) 用于复习查询

### 7. review_schedule - 复习计划表
基于艾宾浩斯曲线的复习计划
- id: 主键
- userId: 用户ID
- itemType: 学习项类型
- itemId: 学习项ID
- scheduledAt: 计划复习时间
- completed: 是否已完成
- completedAt: 完成时间
- 索引: userId, scheduledAt, completed

### 8. learning_resources - 学习资源库表 (新增)
存储可靠的日语学习资源
- id: 主键
- title: 资源标题
- url: 资源链接
- type: 资源类型(website/api/dataset/dictionary)
- category: 资源分类(vocabulary/grammar/listening/reading)
- description: 资源描述
- reliability: 可靠性评分(1-10)
- lastUpdatedAt: 最后更新时间
- isActive: 是否启用
- metadata: 元数据(JSON,存储API密钥、爬取规则等)
- 索引: type, category, isActive

### 9. learning_curriculum - 学习大纲表 (新增)
存储完整的学习路径和阶段
- id: 主键
- level: 学习等级(N5/N4/N3/N2/N1)
- stage: 阶段序号
- title: 阶段标题
- description: 阶段描述
- objectives: 学习目标(JSON数组)
- requiredVocabularyCount: 需掌握词汇数
- requiredGrammarCount: 需掌握语法数
- estimatedHours: 预计学习时长
- prerequisites: 前置要求(JSON,引用其他阶段ID)
- orderIndex: 排序顺序
- 索引: level, orderIndex

### 10. ai_generated_content - AI生成内容表 (新增)
记录AI生成的学习内容,避免重复
- id: 主键
- userId: 用户ID
- contentType: 内容类型(vocabulary/grammar/exercise/explanation)
- prompt: 生成时使用的提示词
- generatedContent: 生成的内容(JSON)
- curriculumStageId: 关联的学习阶段ID
- isApproved: 是否已审核通过
- createdAt: 生成时间
- 索引: userId, contentType, curriculumStageId

### 11. user_learning_path - 用户学习路径表 (新增)
记录用户的个性化学习路径
- id: 主键
- userId: 用户ID
- currentCurriculumStageId: 当前学习阶段ID
- completedStages: 已完成阶段(JSON数组)
- startedAt: 开始学习时间
- lastActiveAt: 最后活跃时间
- totalStudyHours: 累计学习时长
- 索引: userId

## 关联关系图

```
users (1) ----< (N) learning_progress
users (1) ----< (N) review_schedule
users (1) ----< (N) ai_generated_content
users (1) ----< (1) user_learning_path

vocabulary (1) ----< (N) learning_progress
grammar (1) ----< (N) learning_progress
scenes (1) ----< (N) learning_progress

learning_curriculum (1) ----< (N) user_learning_path
learning_curriculum (1) ----< (N) ai_generated_content

learning_resources (N) ----< (N) learning_curriculum (通过JSON引用)
```

## AI助手使用说明

当AI助手需要生成新内容时:
1. 查询 `user_learning_path` 获取用户当前学习阶段
2. 查询 `learning_curriculum` 获取阶段目标和要求
3. 查询 `learning_resources` 获取可用的学习资源
4. 查询 `ai_generated_content` 检查是否已生成过类似内容
5. 根据以上信息生成个性化内容
6. 将生成结果保存到 `ai_generated_content` 表

## 数据更新策略

1. **词汇和语法**: 每周从JLPT官方资源和开源词库更新
2. **例句**: 每月从Tatoeba等开源例句库更新
3. **学习资源**: 每季度审核和更新资源链接
4. **学习大纲**: 根据用户反馈和教学研究定期优化
