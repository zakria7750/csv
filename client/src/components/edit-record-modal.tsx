import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { attendeeValidationSchema, type AttendeeValidation } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Attendee } from "@shared/schema";

interface EditRecordModalProps {
  record: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Attendee>) => void;
  isLoading: boolean;
}

export function EditRecordModal({ record, isOpen, onClose, onSave, isLoading }: EditRecordModalProps) {
  const form = useForm<AttendeeValidation>({
    resolver: zodResolver(attendeeValidationSchema),
    defaultValues: {
      attended: "",
      userName: "",
      firstName: "",
      lastName: "",
      email: "",
      registrationTime: "",
      approvalStatus: "",
      joinTime: "",
      leaveTime: "",
      sessionDuration: undefined,
      isGuest: "",
      country: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        attended: record.attended || "",
        userName: record.userName || "",
        firstName: record.firstName || "",
        lastName: record.lastName || "",
        email: record.email || "",
        registrationTime: record.registrationTime || "",
        approvalStatus: record.approvalStatus || "",
        joinTime: record.joinTime || "",
        leaveTime: record.leaveTime || "",
        sessionDuration: record.sessionDuration || undefined,
        isGuest: record.isGuest || "",
        country: record.country || "",
        phoneNumber: record.phoneNumber || "",
      });
    }
  }, [record, form]);

  const handleSubmit = (data: AttendeeValidation) => {
    onSave(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto dialog-content" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">تحرير السجل</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">الاسم الأول</FormLabel>
                    <FormControl>
                      <Input {...field} className="text-sm sm:text-base" data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">اسم العائلة</FormLabel>
                    <FormControl>
                      <Input {...field} className="text-sm sm:text-base" data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستخدم</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-user-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" className="ltr" dir="ltr" data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input {...field} className="ltr text-sm sm:text-base" dir="ltr" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">البلد</FormLabel>
                    <FormControl>
                      <Input {...field} className="text-sm sm:text-base" data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registrationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">وقت التسجيل</FormLabel>
                    <FormControl>
                      <Input {...field} className="ltr text-sm sm:text-base" dir="ltr" data-testid="input-registration-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sessionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">مدة الجلسة (بالدقائق)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        className="text-sm sm:text-base"
                        data-testid="input-session-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-1"
                data-testid="cancel-button"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto order-1 sm:order-2"
                data-testid="save-button"
              >
                {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
