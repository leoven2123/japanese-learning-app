import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { convertRomajiToKana, getCurrentRomajiInput, type ConversionCandidate } from "@/lib/romajiConverter";

interface RomajiInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 罗马音输入组件
 * 支持实时转换罗马音为假名,并提供候选选择
 */
export function RomajiInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  className = "",
  disabled = false,
}: RomajiInputProps) {
  const [candidates, setCandidates] = useState<ConversionCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCandidates, setShowCandidates] = useState(false);
  const [romajiRange, setRomajiRange] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 检测输入并显示候选
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    
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

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showCandidates || candidates.length === 0) {
      // 如果没有候选,Enter键提交
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
      }
      return;
    }

    switch (e.key) {
      case "Tab":
        e.preventDefault();
        // Tab键选择下一个候选
        setSelectedIndex((prev) => (prev + 1) % (candidates.length * 2));
        break;
        
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, candidates.length * 2 - 1));
        break;
        
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
        
      case "Enter":
        if (!e.shiftKey) {
          e.preventDefault();
          selectCandidate(selectedIndex);
        }
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
          if (index < candidates.length * 2) {
            selectCandidate(index);
          }
        }
        break;
    }
  };

  // 选择候选
  const selectCandidate = (index: number) => {
    if (!romajiRange || candidates.length === 0) return;
    
    const candidateIndex = Math.floor(index / 2);
    const isKatakana = index % 2 === 1;
    const candidate = candidates[candidateIndex];
    
    if (!candidate) return;
    
    const selectedText = isKatakana ? candidate.katakana : candidate.hiragana;
    const newValue = 
      value.substring(0, romajiRange.start) + 
      selectedText + 
      value.substring(romajiRange.end);
    
    onChange(newValue);
    setShowCandidates(false);
    
    // 将光标移到插入文本之后
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = romajiRange.start + selectedText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // 点击候选项
  const handleCandidateClick = (index: number) => {
    selectCandidate(index);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        rows={3}
      />
      
      {/* 候选词列表 */}
      {showCandidates && candidates.length > 0 && (
        <Card className="absolute z-10 mt-1 p-2 shadow-lg max-w-md">
          <div className="text-xs text-muted-foreground mb-2">
            罗马音: {candidates[0]?.romaji} (使用↑↓或Tab选择,Enter确认)
          </div>
          <div className="flex flex-wrap gap-2">
            {candidates.map((candidate, idx) => (
              <div key={idx} className="flex gap-1">
                <button
                  onClick={() => handleCandidateClick(idx * 2)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    selectedIndex === idx * 2
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <span className="font-medium">{candidate.hiragana}</span>
                  <span className="text-xs ml-1 opacity-70">平</span>
                </button>
                <button
                  onClick={() => handleCandidateClick(idx * 2 + 1)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    selectedIndex === idx * 2 + 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <span className="font-medium">{candidate.katakana}</span>
                  <span className="text-xs ml-1 opacity-70">片</span>
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
