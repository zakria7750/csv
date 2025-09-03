import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, X, FileText } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileUpload, isProcessing }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].name.endsWith('.csv')) {
        const file = files[0];
        setUploadedFile(file);
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        setUploadedFile(file);
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">رفع ملف CSV</h2>

          {!uploadedFile ? (
            <div
              className={`upload-zone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              data-testid="file-upload-zone"
            >
              <div className="mb-4">
                <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg text-foreground mb-2">اسحب وأفلت ملف CSV هنا</p>
              <p className="text-sm text-muted-foreground mb-4">أو انقر لاختيار ملف</p>
              <button
                type="button"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                data-testid="select-file-button"
              >
                اختيار ملف
              </button>
              <input
                id="file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="file-input"
              />
            </div>
          ) : (
            <div className="fade-in" data-testid="file-info">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-primary ml-3" />
                    <div>
                      <p className="font-medium text-foreground" data-testid="file-name">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid="file-size">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-destructive hover:text-destructive/80 p-2 rounded-md hover:bg-destructive/10 transition-colors"
                    data-testid="remove-file-button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
                جاري معالجة الملف...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
