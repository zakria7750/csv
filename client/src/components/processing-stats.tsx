import { Card, CardContent } from "@/components/ui/card";

interface ProcessingStatsProps {
  statistics: {
    totalRecords: number;
    validRecords: number;
    duplicateRecords: number;
    errorRecords: number;
  };
  isProcessing: boolean;
}

export function ProcessingStats({ statistics, isProcessing }: ProcessingStatsProps) {
  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">معالجة البيانات</h2>
            {isProcessing && (
              <div className="flex items-center text-primary">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
                جاري المعالجة...
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="mb-6" data-testid="processing-progress">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-foreground">جاري المعالجة...</span>
                <span className="text-sm text-muted-foreground mr-auto">100%</span>
              </div>
              <div className="bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full progress-bar"
                  style={{ width: '100%' }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">تحليل البيانات وتنظيفها...</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-muted rounded-lg p-3 sm:p-4 text-center" data-testid="total-records">
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {statistics.totalRecords.toLocaleString('ar-SA')}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">إجمالي السجلات</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center border border-green-200" data-testid="valid-records">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {statistics.validRecords.toLocaleString('ar-SA')}
              </div>
              <div className="text-xs sm:text-sm text-green-600">سجل صحيح</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 text-center border border-yellow-200" data-testid="duplicate-records">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {statistics.duplicateRecords.toLocaleString('ar-SA')}
              </div>
              <div className="text-xs sm:text-sm text-yellow-600">سجل مكرر</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 sm:p-4 text-center border border-red-200" data-testid="error-records">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {statistics.errorRecords.toLocaleString('ar-SA')}
              </div>
              <div className="text-xs sm:text-sm text-red-600">سجل خاطئ</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
