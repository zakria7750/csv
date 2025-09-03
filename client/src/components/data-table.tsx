import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Edit, Trash2 } from "lucide-react";
import type { Attendee } from "@shared/schema";

// Helper function to format dates
const formatDateTime = (dateStr: string | null) => {
  if (!dateStr || dateStr === '--' || dateStr.trim() === '') return '-';
  
  try {
    // Handle different date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If parsing fails, try manual parsing for Arabic format
      if (dateStr.includes('/')) {
        const parts = dateStr.split(' ');
        if (parts.length >= 2) {
          const datePart = parts[0];
          const timePart = parts[1];
          return `${datePart} ${timePart}`;
        }
      }
      return dateStr; // Return as-is if can't parse
    }
    
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

interface DataTableProps {
  attendees: Attendee[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: "all" | "valid" | "duplicate" | "error") => void;
  onEditRecord: (record: Attendee) => void;
  onDeleteRecord: (id: string) => void;
}

export function DataTable({
  attendees,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEditRecord,
  onDeleteRecord,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const totalPages = Math.ceil(attendees.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentAttendees = attendees.slice(startIndex, endIndex);

  const getStatusBadge = (attendee: Attendee) => {
    if (attendee.hasErrors) {
      return <Badge variant="destructive">خطأ</Badge>;
    }
    if (attendee.isDuplicate) {
      return <Badge className="bg-yellow-100 text-yellow-800">مكرر</Badge>;
    }
    if (attendee.attended === "نعم" || attendee.attended === "Yes") {
      return <Badge className="bg-green-100 text-green-800">نعم</Badge>;
    }
    return <Badge variant="secondary">{attendee.attended}</Badge>;
  };

  const getRowClassName = (attendee: Attendee) => {
    if (attendee.hasErrors) {
      return "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30";
    }
    if (attendee.isDuplicate) {
      return "bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30";
    }
    return "hover:bg-muted/50";
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">البيانات المعالجة</h2>
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="outline" size="sm">
                <Filter className="ml-2 h-4 w-4" />
                تصفية
              </Button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="البحث في البيانات..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pr-10"
                  data-testid="search-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السجلات</SelectItem>
                  <SelectItem value="valid">السجلات الصحيحة فقط</SelectItem>
                  <SelectItem value="duplicate">السجلات المكررة فقط</SelectItem>
                  <SelectItem value="error">السجلات التي تحتوي على أخطاء</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {currentAttendees.map((attendee, index) => (
              <Card key={attendee.id} className={`mobile-card ${getRowClassName(attendee)}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(attendee)}
                      {attendee.isDuplicate && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">مكرر</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditRecord(attendee)}
                        className="text-primary hover:text-primary/80 p-1 h-8 w-8"
                        title="تحرير"
                        data-testid={`edit-button-mobile-${index}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRecord(attendee.id)}
                        className="text-destructive hover:text-destructive/80 p-1 h-8 w-8"
                        title="حذف"
                        data-testid={`delete-button-mobile-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">الاسم:</span>
                      <span className="text-foreground">{attendee.firstName} {attendee.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">اسم المستخدم:</span>
                      <span className="text-foreground">{attendee.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">البريد الإلكتروني:</span>
                      <span className="text-primary ltr text-left">{attendee.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">وقت التسجيل:</span>
                      <span className="text-muted-foreground text-sm">{formatDateTime(attendee.registrationTime)}</span>
                    </div>
                    {attendee.sessionDuration && (
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">المدة:</span>
                        <span className="text-foreground">{attendee.sessionDuration} دقيقة</span>
                      </div>
                    )}
                    {attendee.country && (
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">البلد:</span>
                        <span className="text-foreground">{attendee.country}</span>
                      </div>
                    )}
                    {attendee.phoneNumber && (
                      <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">الرقم:</span>
                        <span className="text-foreground ltr text-left">{attendee.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block table-container overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">حضر</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">اسم المستخدم</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">الاسم الأول</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">اسم العائلة</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">البريد الإلكتروني</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">وقت التسجيل</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">المدة (دقيقة)</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">البلد</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">الرقم</th>
                  <th className="text-right px-3 py-3 border border-border font-medium text-foreground text-sm">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentAttendees.map((attendee, index) => (
                  <tr
                    key={attendee.id}
                    className={`transition-colors ${getRowClassName(attendee)}`}
                    data-testid={`attendee-row-${index}`}
                  >
                    <td className="px-3 py-3 border border-border">
                      {getStatusBadge(attendee)}
                    </td>
                    <td className="px-3 py-3 border border-border text-foreground text-sm" data-testid={`username-${index}`}>
                      <div className="max-w-32 truncate" title={attendee.userName}>
                        {attendee.userName}
                      </div>
                    </td>
                    <td className="px-3 py-3 border border-border text-foreground text-sm" data-testid={`first-name-${index}`}>
                      <div className="max-w-24 truncate" title={attendee.firstName}>
                        {attendee.firstName}
                      </div>
                    </td>
                    <td className="px-3 py-3 border border-border text-foreground text-sm" data-testid={`last-name-${index}`}>
                      <div className="max-w-24 truncate" title={attendee.lastName}>
                        {attendee.lastName}
                      </div>
                    </td>
                    <td className="px-3 py-3 border border-border text-primary ltr text-sm" data-testid={`email-${index}`}>
                      <div className="max-w-48 truncate" title={attendee.email}>
                        {attendee.email}
                      </div>
                    </td>
                    <td className="px-3 py-3 border border-border text-muted-foreground text-xs" data-testid={`registration-time-${index}`}>
                      <div className="max-w-32 truncate" title={attendee.registrationTime}>
                        {formatDateTime(attendee.registrationTime)}
                      </div>
                    </td>
                    <td className="px-3 py-3 border border-border text-center text-foreground text-sm" data-testid={`duration-${index}`}>
                      {attendee.sessionDuration || '-'}
                    </td>
                    <td className="px-3 py-3 border border-border text-foreground text-sm" data-testid={`country-${index}`}>
                      <div className="max-w-24 truncate" title={attendee.country || '-'}>
                        {attendee.country || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 border border-border text-foreground ltr text-sm" data-testid={`phone-${index}`}>
                      <div className="max-w-28 truncate" title={attendee.phoneNumber || '-'}>
                        {attendee.phoneNumber || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 border border-border">
                      <div className="flex space-x-1 space-x-reverse justify-center">
                        {attendee.isDuplicate && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1 py-0.5">مكرر</Badge>
                        )}
                        {attendee.hasErrors && (
                          <Badge variant="destructive" className="text-xs px-1 py-0.5">خطأ</Badge>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRecord(attendee)}
                          className="text-primary hover:text-primary/80 p-1 h-7 w-7"
                          title="تحرير"
                          data-testid={`edit-button-${index}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteRecord(attendee.id)}
                          className="text-destructive hover:text-destructive/80 p-1 h-7 w-7"
                          title="حذف"
                          data-testid={`delete-button-${index}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                عرض {startIndex + 1}-{Math.min(endIndex, attendees.length)} من {attendees.length.toLocaleString('ar-SA')} سجل
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  data-testid="prev-page-button"
                >
                  السابق
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      data-testid={`page-${pageNum}-button`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  data-testid="next-page-button"
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
