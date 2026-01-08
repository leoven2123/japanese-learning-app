import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DataImport() {
  const [vocabularyFile, setVocabularyFile] = useState<File | null>(null);
  const [grammarFile, setGrammarFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const importVocabularyMutation = trpc.admin.importVocabulary.useMutation({
    onSuccess: (data: any) => {
      setImportResult(data);
      toast.success(`成功导入${data.success}个词汇`);
      setVocabularyFile(null);
    },
    onError: (error: any) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  const importGrammarMutation = trpc.admin.importGrammar.useMutation({
    onSuccess: (data: any) => {
      setImportResult(data);
      toast.success(`成功导入${data.success}个语法点`);
      setGrammarFile(null);
    },
    onError: (error: any) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  const handleVocabularyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/json', 'text/csv', 'text/plain'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        toast.error('请上传CSV或JSON格式的文件');
        return;
      }
      setVocabularyFile(file);
      setImportResult(null);
    }
  };

  const handleGrammarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/json', 'text/csv', 'text/plain'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
        toast.error('请上传CSV或JSON格式的文件');
        return;
      }
      setGrammarFile(file);
      setImportResult(null);
    }
  };

  const handleVocabularyImport = async () => {
    if (!vocabularyFile) {
      toast.error('请先选择文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let data: any[];

        if (vocabularyFile.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else {
          // Parse CSV
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index];
            });
            return obj;
          });
        }

        importVocabularyMutation.mutate({ data });
      } catch (error) {
        toast.error('文件解析失败,请检查格式');
      }
    };
    reader.readAsText(vocabularyFile);
  };

  const handleGrammarImport = async () => {
    if (!grammarFile) {
      toast.error('请先选择文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let data: any[];

        if (grammarFile.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else {
          // Parse CSV
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index];
            });
            return obj;
          });
        }

        importGrammarMutation.mutate({ data });
      } catch (error) {
        toast.error('文件解析失败,请检查格式');
      }
    };
    reader.readAsText(grammarFile);
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">数据导入管理</h1>
        <p className="text-muted-foreground mt-2">批量导入词汇和语法数据到数据库</p>
      </div>

      <Tabs defaultValue="vocabulary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vocabulary">词汇导入</TabsTrigger>
          <TabsTrigger value="grammar">语法导入</TabsTrigger>
        </TabsList>

        <TabsContent value="vocabulary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>词汇数据导入</CardTitle>
              <CardDescription>
                支持CSV和JSON格式。CSV格式需包含以下列: expression, reading, meaning, level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>数据格式说明</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>JSON格式示例:</strong></p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`[
  {
    "expression": "日本語",
    "reading": "にほんご",
    "meaning": "日语",
    "level": "N5"
  }
]`}
                    </pre>
                    <p className="mt-2"><strong>CSV格式示例:</strong></p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`expression,reading,meaning,level
日本語,にほんご,日语,N5
勉強,べんきょう,学习,N5`}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleVocabularyFileChange}
                    className="hidden"
                    id="vocabulary-file"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('vocabulary-file')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {vocabularyFile ? vocabularyFile.name : '选择文件'}
                  </Button>
                </label>
                <Button
                  onClick={handleVocabularyImport}
                  disabled={!vocabularyFile || importVocabularyMutation.isPending}
                >
                  {importVocabularyMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  开始导入
                </Button>
              </div>

              {vocabularyFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>已选择: {vocabularyFile.name} ({(vocabularyFile.size / 1024).toFixed(2)} KB)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grammar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>语法数据导入</CardTitle>
              <CardDescription>
                支持CSV和JSON格式。CSV格式需包含以下列: pattern, meaning, level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>数据格式说明</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>JSON格式示例:</strong></p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`[
  {
    "pattern": "〜は〜です",
    "meaning": "...是...",
    "level": "N5",
    "explanation": "基本句型"
  }
]`}
                    </pre>
                    <p className="mt-2"><strong>CSV格式示例:</strong></p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`pattern,meaning,level,explanation
〜は〜です,...是...,N5,基本句型
〜を〜ます,...做...,N5,动词句型`}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleGrammarFileChange}
                    className="hidden"
                    id="grammar-file"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('grammar-file')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {grammarFile ? grammarFile.name : '选择文件'}
                  </Button>
                </label>
                <Button
                  onClick={handleGrammarImport}
                  disabled={!grammarFile || importGrammarMutation.isPending}
                >
                  {importGrammarMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  开始导入
                </Button>
              </div>

              {grammarFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>已选择: {grammarFile.name} ({(grammarFile.size / 1024).toFixed(2)} KB)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>导入结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">成功: <strong>{importResult.success}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm">失败: <strong>{importResult.failed}</strong></span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">错误详情:</p>
                <div className="bg-muted p-3 rounded max-h-60 overflow-y-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
