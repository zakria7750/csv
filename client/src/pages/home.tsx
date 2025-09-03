import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/file-upload";
import { ProcessingStats } from "@/components/processing-stats";
import { ErrorReport } from "@/components/error-report";
import { DataTable } from "@/components/data-table";
import { DatabaseStorage } from "@/components/database-storage";
import { EditRecordModal } from "@/components/edit-record-modal";
import { Database, Settings, Download } from "lucide-react";
import type { Attendee } from "@shared/schema";

interface ProcessingResult {
  fileId: string;
  statistics: {
    totalRecords: number;
    validRecords: number;
    duplicateRecords: number;
    errorRecords: number;
  };
  errors: Array<{
    rowIndex: number;
    type: string;
    messages: string[];
    data: any;
  }>;
  message: string;
}

export default function Home() {
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "duplicate" | "error">("all");
  const { toast } = useToast();

  // Fetch attendees
  const { data: attendees = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/attendees", searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`/api/attendees?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch attendees");
      return response.json() as Promise<Attendee[]>;
    },
    enabled: !!processingResult,
  });

  // Upload and process CSV
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest("POST", "/api/upload-csv", formData);
      return response.json() as Promise<ProcessingResult>;
    },
    onSuccess: (result) => {
      setProcessingResult(result);
      refetch();
      toast({
        title: "تم بنجاح",
        description: result.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في المعالجة",
        description: error.message || "حدث خطأ أثناء معالجة الملف",
        variant: "destructive",
      });
    },
  });

  // Update attendee
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Attendee> }) => {
      const response = await apiRequest("PUT", `/api/attendees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendees"] });
      setEditingRecord(null);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث السجل بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ أثناء تحديث السجل",
        variant: "destructive",
      });
    },
  });

  // Delete attendee
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/attendees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendees"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف السجل بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف السجل",
        variant: "destructive",
      });
    },
  });

  // Export to Excel
  const exportToExcel = useCallback(async () => {
    try {
      const response = await fetch("/api/export-excel");
      if (!response.ok) throw new Error("Failed to export");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'webinar_attendees_cleaned.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "تم بنجاح",
        description: "تم تصدير الملف بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الملف",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileUpload = useCallback((file: File) => {
    setIsProcessing(true);
    uploadMutation.mutate(file, {
      onSettled: () => setIsProcessing(false),
    });
  }, [uploadMutation]);

  const handleEditRecord = useCallback((record: Attendee) => {
    setEditingRecord(record);
  }, []);

  const handleDeleteRecord = useCallback((id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا السجل؟")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleUpdateRecord = useCallback((data: Partial<Attendee>) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data });
    }
  }, [editingRecord, updateMutation]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Database className="text-primary text-2xl ml-3" />
                <span className="text-lg sm:text-xl font-bold text-foreground">معالج ملفات CSV</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse">
              <button className="hidden sm:flex bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors items-center">
                <Settings className="ml-2 h-4 w-4" />
                الإعدادات
              </button>
              <button
                onClick={exportToExcel}
                disabled={!processingResult}
                className="bg-secondary text-secondary-foreground px-2 sm:px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                data-testid="export-excel-button"
              >
                <Download className="ml-1 sm:ml-2 h-4 w-4" />
                <span className="hidden sm:inline">تصدير Excel</span>
                <span className="sm:hidden">تصدير</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* File Upload Section */}
        <FileUpload
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
          data-testid="file-upload-section"
        />

        {/* Processing Stats */}
        {processingResult && (
          <ProcessingStats
            statistics={processingResult.statistics}
            isProcessing={isProcessing}
            data-testid="processing-stats-section"
          />
        )}

        {/* Error Report */}
        {processingResult && processingResult.errors.length > 0 && (
          <ErrorReport
            errors={processingResult.errors}
            onEditRecord={(data) => {
              // Create a mock record for editing from error data
              const mockRecord: Attendee = {
                id: `temp-${Date.now()}`,
                attended: data.attended || "",
                userName: data.userName || "",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                email: data.email || "",
                registrationTime: data.registrationTime || "",
                approvalStatus: data.approvalStatus || "",
                joinTime: data.joinTime || null,
                leaveTime: data.leaveTime || null,
                sessionDuration: data.sessionDuration || null,
                isGuest: data.isGuest || null,
                country: data.country || null,
                phoneNumber: data.phoneNumber || null,
                isDuplicate: false,
                duplicateGroup: null,
                hasErrors: true,
                errorMessages: data.errorMessages || [],
                createdAt: new Date(),
              };
              setEditingRecord(mockRecord);
            }}
            data-testid="error-report-section"
          />
        )}

        {/* Data Table */}
        {processingResult && (
          <DataTable
            attendees={attendees}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            data-testid="data-table-section"
          />
        )}

        {/* Database Storage */}
        {processingResult && (
          <DatabaseStorage
            statistics={processingResult.statistics}
            data-testid="database-storage-section"
          />
        )}
      </main>

      {/* Edit Record Modal */}
      <EditRecordModal
        record={editingRecord}
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdateRecord}
        isLoading={updateMutation.isPending}
        data-testid="edit-record-modal"
      />
    </div>
  );
}
