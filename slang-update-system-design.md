# 网络热词自动更新系统设计

## 系统目标
实现一个灵活的日语网络热词自动更新系统,支持定时自动更新和用户手动触发更新。

## 核心功能

### 1. 数据存储
利用现有的vocabulary表,通过category字段区分:
- `category = "slang"`: 标识为网络热词
- `source`: 记录热词来源(如"ネット流行語100"、"Twitter"等)
- `detailedExplanation`: 存储详细解释和用法说明
- `updatedAt`: 记录最后更新时间

### 2. 热词搜索与抓取
**搜索策略**:
- 使用search API搜索"日本 ネット流行語 2025"、"Japanese internet slang 2025"等关键词
- 从搜索结果中提取热词信息
- 使用LLM解析和结构化热词数据

**数据提取**:
- 热词表达(日文)
- 读音(假名)
- 罗马音
- 中文释义
- 详细解释
- 来源
- 使用场景

### 3. 更新逻辑
**去重机制**:
- 检查expression是否已存在
- 如果存在且category="slang",更新内容
- 如果不存在,插入新记录

**更新策略**:
- 每次更新获取10-15个最新热词
- 保留历史热词,只更新内容
- 记录更新时间和来源

### 4. API设计

#### 4.1 手动更新API
```
POST /api/trpc/slang.updateSlangWords
输入: 无
输出: {
  success: boolean,
  addedCount: number,
  updatedCount: number,
  words: Array<{expression, meaning, source}>
}
```

#### 4.2 获取热词列表API
```
GET /api/trpc/vocabulary.list
输入: { category: "slang", limit: 50 }
输出: Array<Vocabulary>
```

#### 4.3 获取更新状态API
```
GET /api/trpc/slang.getUpdateStatus
输出: {
  lastUpdateTime: Date,
  totalSlangCount: number,
  isUpdating: boolean
}
```

### 5. 前端界面

#### 5.1 词汇库页面增强
- 添加"网络热词"筛选标签
- 显示最后更新时间
- 添加"更新热词"按钮

#### 5.2 更新按钮功能
- 点击触发更新API
- 显示加载状态(loading spinner)
- 更新完成后显示toast通知
- 显示新增和更新的热词数量

#### 5.3 词汇详情页
- 展示热词来源
- 显示详细解释
- 标注例句来源类型(网络/AI生成)

### 6. 定时任务

#### 6.1 实现方式
使用Node.js的cron或schedule库:
```javascript
// 每周日凌晨2点自动更新
schedule.scheduleJob('0 2 * * 0', async () => {
  await updateSlangWords();
});
```

#### 6.2 任务配置
- 频率: 每周一次(可配置)
- 时间: 凌晨2点(服务器负载低)
- 失败重试: 最多3次
- 日志记录: 记录每次更新结果

### 7. 例句生成

#### 7.1 AI生成例句
使用LLM为每个热词生成2-3个例句:
```
prompt: "为日语网络热词'{expression}'生成2个真实的使用例句,
包含日文、假名、罗马音和中文翻译"
```

#### 7.2 例句标注
- sourceType: "ai" 标识为AI生成
- source: "AI Generated" 显示来源

## 技术栈
- **后端**: tRPC + Drizzle ORM
- **搜索**: Manus Search API
- **AI**: Manus LLM API
- **定时任务**: node-schedule
- **前端**: React + TanStack Query

## 实施步骤
1. 更新数据库schema(已完成)
2. 开发后端热词搜索和更新API
3. 开发前端更新按钮和状态显示
4. 集成定时任务
5. 测试和优化
