import { AutoRuby } from "@/components/Ruby";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function TestAutoRuby() {
  const [test1Result, setTest1Result] = useState<string>("");
  const [test2Result, setTest2Result] = useState<string>("");
  const [test3Result, setTest3Result] = useState<string>("");
  
  const getReadingMutation = trpc.ai.getReading.useMutation();

  const testAPI = (text: string, setResult: (r: string) => void) => {
    getReadingMutation.mutate(
      { text },
      {
        onSuccess: (data) => {
          setResult(`Reading: ${data.reading}`);
        },
        onError: (error) => {
          setResult(`Error: ${error.message}`);
        }
      }
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">AutoRuby组件测试</h1>
      
      <div className="space-y-6">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">测试1: 謙虚な姿勢を示す表現を覚える</h2>
          <AutoRuby text="謙虚な姿勢を示す表現を覚える" className="text-xl" />
          <button 
            onClick={() => testAPI("謙虚な姿勢を示す表現を覚える", setTest1Result)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            测试API
          </button>
          {test1Result && <div className="mt-2 text-sm text-gray-600">{test1Result}</div>}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">测试2: 田中と申します</h2>
          <AutoRuby text="田中と申します" className="text-xl" />
          <button 
            onClick={() => testAPI("田中と申します", setTest2Result)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            测试API
          </button>
          {test2Result && <div className="mt-2 text-sm text-gray-600">{test2Result}</div>}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">测试3: 今週の土曜日、暇？</h2>
          <AutoRuby text="今週の土曜日、暇？" className="text-xl" />
          <button 
            onClick={() => testAPI("今週の土曜日、暇？", setTest3Result)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            测试API
          </button>
          {test3Result && <div className="mt-2 text-sm text-gray-600">{test3Result}</div>}
        </div>
      </div>
    </div>
  );
}
