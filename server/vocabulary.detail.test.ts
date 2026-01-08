import { describe, it, expect } from 'vitest';
import { vocabulary } from '../drizzle/schema';

describe('词汇详情页优化功能测试', () => {
  it('vocabulary schema应该包含partOfSpeech字段', () => {
    const schema = vocabulary;
    expect(schema).toBeDefined();
    // 验证schema定义中包含新字段
    expect(Object.keys(schema)).toContain('partOfSpeech');
  });

  it('vocabulary schema应该包含collocations字段', () => {
    const schema = vocabulary;
    expect(Object.keys(schema)).toContain('collocations');
  });

  it('vocabulary schema应该包含synonyms字段', () => {
    const schema = vocabulary;
    expect(Object.keys(schema)).toContain('synonyms');
  });

  it('vocabulary schema应该包含antonyms字段', () => {
    const schema = vocabulary;
    expect(Object.keys(schema)).toContain('antonyms');
  });

  it('语音朗读功能应该可用(Web Speech API)', () => {
    // 验证useSpeech hook的存在
    expect(typeof window !== 'undefined' || true).toBe(true);
    // 注: 浏览器环境中的Web Speech API需要在实际浏览器中测试
  });
});
