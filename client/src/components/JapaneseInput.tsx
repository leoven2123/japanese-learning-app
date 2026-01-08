import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { convertRomajiToKana, getCurrentRomajiInput, type ConversionCandidate } from "@/lib/romajiConverter";

interface JapaneseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * 支持罗马音转假名的Input组件
 * 可以作为普通Input的替代品使用
 */
export function JapaneseInput({ value, onChange, ...props }: JapaneseInputProps) {
  const [candidates, setCandidates] = useState<ConversionCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCandidates, setShowCandidates] = useState(false);
  const [romajiRange, setRomajiRange] = useState<{ start: number; end: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 检测输入并显示候选
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(e);
    
    // 检查当前光标位置的罗马音
    const romajiInput = getCurrentRomajiInput(newValue, cursorPos);
    
    if (romajiInput && romajiInput.romaji.length > 0) {
      const results = convertRomajiToKana(romajiInput.romaji);
      if (results.length > 0) {
        setCandidates(results);
        setRomajiRange({ start: romajiInput.startPos, end: romajiInput.endPos });
        setShowCandidates(true);
        setSelectedIndex(0);
      } else {
        setShowCandidates(false);
      }
    } else {
      setShowCandidates(false);
    }
  };

  // 选择候选
  const selectCandidate = (candidate: ConversionCandidate) => {
    if (!romajiRange || !inputRef.current) return;
    
    const before = value.substring(0, romajiRange.start);
    const after = value.substring(romajiRange.end);
    const newValue = before + candidate.hiragana + after;
    
    // 创建合成事件
    const syntheticEvent = {
      target: { value: newValue },
      currentTarget: { value: newValue },
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    setShowCandidates(false);
    
    // 恢复焦点并设置光标位置
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = romajiRange.start + candidate.hiragana.length;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCandidates || candidates.length === 0) {
      if (props.onKeyDown) props.onKeyDown(e);
      return;
    }

    switch (e.key) {
      case "Tab":
      case "Enter":
        e.preventDefault();
        selectCandidate(candidates[selectedIndex]);
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % candidates.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + candidates.length) % candidates.length);
        break;
      case "Escape":
        e.preventDefault();
        setShowCandidates(false);
        break;
      case "1":
      case "2":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const index = parseInt(e.key) - 1;
          if (index < candidates.length) {
            selectCandidate(candidates[index]);
          }
        }
        break;
      default:
        if (props.onKeyDown) props.onKeyDown(e);
    }
  };

  // 点击外部关闭候选框
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCandidates(false);
    };

    if (showCandidates) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showCandidates]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
      
      {showCandidates && candidates.length > 0 && (
        <Card className="absolute z-50 mt-1 p-2 shadow-lg">
          <div className="flex gap-2">
            {candidates.map((candidate, index) => (
              <button
                key={index}
                onClick={() => selectCandidate(candidate)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {candidate.hiragana}
                <span className="ml-1 text-xs opacity-70">平</span>
                <span className="ml-1">{candidate.katakana}</span>
                <span className="ml-1 text-xs opacity-70">片</span>
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Tab/Enter选择 · ↑↓切换 · Ctrl+数字快选
          </div>
        </Card>
      )}
    </div>
  );
}
