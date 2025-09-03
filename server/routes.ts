import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { attendeeValidationSchema, insertCsvFileSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import * as XLSX from 'xlsx';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and process CSV file
  app.post("/api/upload-csv", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "لم يتم رفع أي ملف" });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      const fileSize = req.file.size;

      // Parse CSV data
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Find the header row (look for attendee data columns)
      let headerRowIndex = -1;
      const expectedHeaders = ['حضر', 'اسم المستخدم', 'الاسم الأول', 'اسم العائلة', 'البريد الإلكتروني'];
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 5) {
          // Check if this row contains attendee headers (Arabic or English)
          const hasAttendeeHeaders = row.some(cell => 
            typeof cell === 'string' && (
              cell.includes('حضر') || cell.includes('Attended') ||
              cell.includes('اسم المستخدم') || cell.includes('User Name') ||
              cell.includes('البريد الإلكتروني') || cell.includes('Email')
            )
          );
          
          if (hasAttendeeHeaders) {
            headerRowIndex = i;
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        return res.status(400).json({ message: "لم يتم العثور على بيانات الحضور في الملف" });
      }

      // Extract attendee data starting from header row + 1
      const attendeeData = rawData.slice(headerRowIndex + 1).filter(row => 
        row && row.length > 5 && row.some(cell => cell !== undefined && cell !== null && cell !== "")
      );

      const processedAttendees: any[] = [];
      const errors: any[] = [];
      const duplicates = new Map<string, any[]>();

      // Process each row
      attendeeData.forEach((row, index) => {
        const rowIndex = headerRowIndex + 2 + index; // +2 because we start from header+1 and index is 0-based
        
        const attendeeRow = {
          attended: String(row[0] || '').trim(),
          userName: String(row[1] || '').trim(),
          firstName: String(row[2] || '').trim(),
          lastName: String(row[3] || '').trim(),
          email: String(row[4] || '').trim().toLowerCase(),
          registrationTime: String(row[5] || '').trim(),
          approvalStatus: String(row[6] || '').trim(),
          joinTime: String(row[7] || '').trim(),
          leaveTime: String(row[8] || '').trim(),
          sessionDuration: row[9] ? Number(row[9]) : undefined,
          isGuest: String(row[10] || '').trim(),
          country: String(row[11] || '').trim(),
          phoneNumber: String(row[12] || '').trim(),
          isDuplicate: false,
          duplicateGroup: null,
          hasErrors: false,
          errorMessages: [] as string[]
        };

        // Validate the row
        const validationResult = attendeeValidationSchema.safeParse(attendeeRow);
        
        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors.map(err => err.message);
          errors.push({
            rowIndex,
            type: "بيانات غير صحيحة",
            messages: errorMessages,
            data: attendeeRow
          });
          attendeeRow.hasErrors = true;
          attendeeRow.errorMessages = errorMessages;
        }

        // Check for duplicates based on email
        if (attendeeRow.email) {
          const emailKey = attendeeRow.email.toLowerCase();
          if (!duplicates.has(emailKey)) {
            duplicates.set(emailKey, []);
          }
          duplicates.get(emailKey)!.push({ ...attendeeRow, rowIndex });
        }

        processedAttendees.push(attendeeRow);
      });

      // Mark duplicates and create duplicate groups
      let duplicateGroupCounter = 1;
      duplicates.forEach((records) => {
        if (records.length > 1) {
          const groupId = `duplicate-group-${duplicateGroupCounter++}`;
          records.forEach((record, index) => {
            const attendee = processedAttendees.find(a => 
              a.email === record.email && 
              a.registrationTime === record.registrationTime
            );
            if (attendee) {
              attendee.isDuplicate = true;
              attendee.duplicateGroup = groupId;
            }
          });
        }
      });

      // Calculate statistics
      const totalRecords = processedAttendees.length;
      const validRecords = processedAttendees.filter(a => !a.hasErrors && !a.isDuplicate).length;
      const duplicateRecords = processedAttendees.filter(a => a.isDuplicate).length;
      const errorRecords = processedAttendees.filter(a => a.hasErrors).length;

      // Create CSV file record
      const csvFile = await storage.createCsvFile({
        fileName,
        fileSize,
        totalRecords,
        validRecords,
        duplicateRecords,
        errorRecords
      });

      // Store attendees in database
      await storage.createManyAttendees(processedAttendees);

      res.json({
        fileId: csvFile.id,
        statistics: {
          totalRecords,
          validRecords,
          duplicateRecords,
          errorRecords
        },
        errors: errors.slice(0, 50), // Limit errors shown
        message: `تم معالجة ${totalRecords} سجل بنجاح`
      });

    } catch (error) {
      console.error("Error processing CSV:", error);
      res.status(500).json({ message: "خطأ في معالجة الملف" });
    }
  });

  // Get all attendees
  app.get("/api/attendees", async (req, res) => {
    try {
      const { search, status } = req.query;
      
      let attendees;
      if (search) {
        attendees = await storage.searchAttendees(String(search));
      } else if (status) {
        attendees = await storage.getAttendeesByStatus(status as 'valid' | 'duplicate' | 'error');
      } else {
        attendees = await storage.getAllAttendees();
      }

      res.json(attendees);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع البيانات" });
    }
  });

  // Get single attendee
  app.get("/api/attendees/:id", async (req, res) => {
    try {
      const attendee = await storage.getAttendee(req.params.id);
      if (!attendee) {
        return res.status(404).json({ message: "السجل غير موجود" });
      }
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع البيانات" });
    }
  });

  // Update attendee
  app.put("/api/attendees/:id", async (req, res) => {
    try {
      const validationResult = attendeeValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "بيانات غير صحيحة",
          errors: validationResult.error.errors.map(err => err.message)
        });
      }

      const updated = await storage.updateAttendee(req.params.id, validationResult.data);
      if (!updated) {
        return res.status(404).json({ message: "السجل غير موجود" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث البيانات" });
    }
  });

  // Delete attendee
  app.delete("/api/attendees/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAttendee(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "السجل غير موجود" });
      }
      res.json({ message: "تم حذف السجل بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف البيانات" });
    }
  });

  // Export to Excel
  app.get("/api/export-excel", async (req, res) => {
    try {
      const attendees = await storage.getAttendeesByStatus('valid');
      
      // Prepare data for Excel export
      const excelData = attendees.map(attendee => ({
        'حضر': attendee.attended,
        'اسم المستخدم': attendee.userName,
        'الاسم الأول': attendee.firstName,
        'اسم العائلة': attendee.lastName,
        'البريد الإلكتروني': attendee.email,
        'وقت التسجيل': attendee.registrationTime,
        'حالة الموافقة': attendee.approvalStatus,
        'وقت الانضمام': attendee.joinTime,
        'وقت المغادرة': attendee.leaveTime,
        'المدة (دقيقة)': attendee.sessionDuration,
        'هل ضيف': attendee.isGuest,
        'البلد': attendee.country,
        'رقم الهاتف': attendee.phoneNumber
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'بيانات الحضور');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="webinar_attendees_cleaned.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تصدير البيانات" });
    }
  });

  // Get processing statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const allAttendees = await storage.getAllAttendees();
      const statistics = {
        totalRecords: allAttendees.length,
        validRecords: allAttendees.filter(a => !a.hasErrors && !a.isDuplicate).length,
        duplicateRecords: allAttendees.filter(a => a.isDuplicate).length,
        errorRecords: allAttendees.filter(a => a.hasErrors).length
      };
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ message: "خطأ في استرجاع الإحصائيات" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
