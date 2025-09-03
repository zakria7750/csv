import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorReportProps {
  errors: Array<{
    rowIndex: number;
    type: string;
    messages: string[];
    data: any;
  }>;
  onEditRecord: (data: any) => void;
}

export function ErrorReport({ errors, onEditRecord }: ErrorReportProps) {
  if (errors.length === 0) return null;

  const getErrorTypeColor = (type: string) => {
    if (type.includes('مفقودة')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">تقرير الأخطاء</h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 ml-3 h-5 w-5" />
              <div>
                <h3 className="font-medium text-red-800">
                  تم العثور على {errors.length.toLocaleString('ar-SA')} خطأ في البيانات
                </h3>
                <p className="text-sm text-red-600">يرجى مراجعة الأخطاء أدناه وتصحيحها</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="error-list">
            {errors.map((error, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                        الصف {error.rowIndex}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded mr-2 ${getErrorTypeColor(error.type)}`}>
                        {error.type}
                      </span>
                    </div>
                    <div className="text-sm text-foreground mb-2">
                      {error.messages.map((message, msgIndex) => (
                        <div key={msgIndex} className="mb-1">{message}</div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground ltr bg-gray-50 p-2 rounded">
                      {Object.entries(error.data)
                        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRecord(error.data)}
                      className="text-primary hover:text-primary/80 h-8 px-2"
                      data-testid={`edit-error-${index}`}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تحرير
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/80 h-8 px-2"
                      data-testid={`delete-error-${index}`}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
