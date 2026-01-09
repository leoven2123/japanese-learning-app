import { useState } from "react";
import Layout from "@/components/Layout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function TestSwitch() {
  const [showTranslation, setShowTranslation] = useState(false);
  
  console.log("showTranslation state:", showTranslation);
  
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Switch测试页面</h1>
        
        <div className="flex items-center gap-2 mb-4">
          <Switch
            id="test-switch"
            checked={showTranslation}
            onCheckedChange={(checked) => {
              console.log("Switch changed to:", checked);
              setShowTranslation(checked);
            }}
          />
          <Label htmlFor="test-switch">显示翻译</Label>
        </div>
        
        <div className="p-4 border rounded">
          <p>Switch状态: {showTranslation ? "开启" : "关闭"}</p>
          
          {showTranslation && (
            <p className="mt-2 text-green-600">翻译已显示！</p>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="font-medium">日语原文：はじめまして</p>
          {showTranslation && (
            <p className="text-sm text-muted-foreground mt-2 pl-3 border-l-2 border-primary/30">
              初次见面
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
