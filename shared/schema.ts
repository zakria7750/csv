import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const webinarAttendees = pgTable("webinar_attendees", {
  id: varchar("id").primaryKey(),
  attended: text("attended").notNull(),
  userName: text("user_name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  registrationTime: text("registration_time").notNull(),
  approvalStatus: text("approval_status").notNull(),
  joinTime: text("join_time"),
  leaveTime: text("leave_time"),
  sessionDuration: integer("session_duration"),
  isGuest: text("is_guest"),
  country: text("country"),
  phoneNumber: text("phone_number"),
  isDuplicate: boolean("is_duplicate").default(false),
  duplicateGroup: text("duplicate_group"),
  hasErrors: boolean("has_errors").default(false),
  errorMessages: text("error_messages").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const csvFiles = pgTable("csv_files", {
  id: varchar("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  totalRecords: integer("total_records").notNull(),
  validRecords: integer("valid_records").notNull(),
  duplicateRecords: integer("duplicate_records").notNull(),
  errorRecords: integer("error_records").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertAttendeeSchema = createInsertSchema(webinarAttendees).omit({
  id: true,
  createdAt: true,
});

export const insertCsvFileSchema = createInsertSchema(csvFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type Attendee = typeof webinarAttendees.$inferSelect;
export type InsertCsvFile = z.infer<typeof insertCsvFileSchema>;
export type CsvFile = typeof csvFiles.$inferSelect;

// Validation schemas for data processing
export const attendeeValidationSchema = z.object({
  attended: z.string().min(1, "حقل الحضور مطلوب"),
  userName: z.string().min(1, "اسم المستخدم مطلوب"),
  firstName: z.string().min(1, "الاسم الأول مطلوب").refine(val => val !== "--" && val.trim() !== "", "الاسم الأول لا يمكن أن يكون فارغاً أو '--'"),
  lastName: z.string().min(1, "اسم العائلة مطلوب").refine(val => val !== "--" && val.trim() !== "", "اسم العائلة لا يمكن أن يكون فارغاً أو '--'"),
  email: z.string().email("البريد الإلكتروني غير صحيح - يجب أن يحتوي على @ و ."),
  registrationTime: z.string().min(1, "وقت التسجيل مطلوب"),
  approvalStatus: z.string().optional().default(""),
  joinTime: z.string().optional(),
  leaveTime: z.string().optional(),
  sessionDuration: z.number().optional(),
  isGuest: z.string().optional(),
  country: z.string().optional(),
  phoneNumber: z.string().optional().refine(val => !val || /^\+?\d+$/.test(val.replace(/\s+/g, '')), "رقم الهاتف يجب أن يحتوي على أرقام فقط"),
});

export type AttendeeValidation = z.infer<typeof attendeeValidationSchema>;
