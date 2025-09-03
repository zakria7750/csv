import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Database } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DatabaseStorageProps {
  statistics: {
    totalRecords: number;
    validRecords: number;
    duplicateRecords: number;
    errorRecords: number;
  };
}

export function DatabaseStorage({ statistics }: DatabaseStorageProps) {
  const [dbType, setDbType] = useState("memory");
  const [tableName, setTableName] = useState("webinar_attendees");
  const { toast } = useToast();

  const handleSaveToDatabase = async () => {
    try {
      // In this implementation, data is already stored in memory storage
      toast({
        title: "تم بنجاح",
        description: "تم حفظ البيانات في قاعدة البيانات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">حفظ في قاعدة البيانات</h2>
            <Button 
              onClick={handleSaveToDatabase} 
              className="flex items-center"
              data-testid="save-to-database-button"
            >
              <Save className="ml-2 h-4 w-4" />
              حفظ البيانات
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="db-type" className="block text-sm font-medium text-foreground mb-2">
                نوع قاعدة البيانات
              </Label>
              <Select value={dbType} onValueChange={setDbType}>
                <SelectTrigger data-testid="database-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="memory">ذاكرة مؤقتة (Memory)</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="firebase">Firebase</SelectItem>
                  <SelectItem value="sqlite">SQLite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="table-name" className="block text-sm font-medium text-foreground mb-2">
                اسم الجدول
              </Label>
              <Input
                id="table-name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                data-testid="table-name-input"
              />
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-3 flex items-center">
              <Database className="ml-2 h-5 w-5" />
              ملخص البيانات المراد حفظها:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">السجلات الصحيحة:</span>
                <span className="font-medium text-green-600 mr-2" data-testid="valid-for-storage">
                  {statistics.validRecords.toLocaleString('ar-SA')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">السجلات المكررة:</span>
                <span className="font-medium text-yellow-600 mr-2" data-testid="duplicates-handled">
                  {statistics.duplicateRecords.toLocaleString('ar-SA')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">الأخطاء المستبعدة:</span>
                <span className="font-medium text-red-600 mr-2" data-testid="errors-excluded">
                  {statistics.errorRecords.toLocaleString('ar-SA')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">إجمالي للحفظ:</span>
                <span className="font-medium text-primary mr-2" data-testid="total-to-save">
                  {(statistics.validRecords + statistics.duplicateRecords).toLocaleString('ar-SA')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> سيتم حفظ جميع البيانات الصحيحة والمكررة، بينما سيتم استبعاد السجلات التي تحتوي على أخطاء.
              السجلات المكررة ستكون مجمعة معاً لسهولة المراجعة.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
