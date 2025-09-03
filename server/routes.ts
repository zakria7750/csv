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

// Function to convert Excel serial date to proper date string
function convertExcelDate(excelDate: any): string {
  if (!excelDate || excelDate === '--' || excelDate === '') return '';
  
  // If it's already a string, return as is
  if (typeof excelDate === 'string') {
    // Check if it looks like a date string already
    if (excelDate.includes('/') || excelDate.includes('-')) {
      return excelDate;
    }
    // If it's a string number, convert to number first
    const num = parseFloat(excelDate);
    if (isNaN(num)) return excelDate;
    excelDate = num;
  }
  
  // If it's a number (Excel serial date)
  if (typeof excelDate === 'number' && excelDate > 1) {
    // Excel's epoch starts at January 1, 1900 (but accounts for leap year bug)
    const epoch = new Date(1899, 11, 30); // December 30, 1899
    const date = new Date(epoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
    
    // Format as MM/DD/YYYY HH:MM
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  }
  
  return String(excelDate);
}

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
      console.log(`[CSV Processing] Starting to parse file: ${fileName}, size: ${fileSize} bytes`);
      console.log(`[CSV Processing] Environment: NODE_ENV=${process.env.NODE_ENV}, Platform: ${process.platform}`);
      console.log(`[CSV Processing] Memory usage:`, process.memoryUsage());
      
      // Check file size limits (Vercel functions have stricter limits)
      const maxSize = 10 * 1024 * 1024; // 10MB for better performance
      if (fileSize > maxSize) {
        console.log(`[CSV Processing] File too large: ${fileSize} bytes (max: ${maxSize})`);
        return res.status(400).json({ 
          message: `حجم الملف كبير جداً (${Math.round(fileSize / 1024 / 1024)}MB). الحد الأقصى المسموح هو 10MB للحصول على أفضل أداء`,
          fileSize,
          maxSize
        });
      }
      
      const workbook = XLSX.read(fileBuffer, { 
        type: 'buffer',
        cellDates: true, // Better date handling
        cellNF: false,   // Don't keep number formats to save memory
        cellText: false  // Don't keep text representations to save memory
      });
      console.log(`[CSV Processing] Workbook loaded, sheets: ${workbook.SheetNames.join(', ')}`);
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Use more memory-efficient parsing
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',     // Default value for empty cells
        raw: false,     // Get formatted values instead of raw
        dateNF: 'mm/dd/yyyy hh:mm' // Standardize date format
      }) as any[][];
      
      console.log(`[CSV Processing] Raw data extracted, total rows: ${rawData.length}`);
      console.log(`[CSV Processing] Memory after parsing:`, process.memoryUsage());
      
      // Clear the workbook from memory
      workbook.Sheets = {};

      // Find the "Attendee Details" section header row
      let headerRowIndex = -1;
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.length > 0) {
          const firstCell = String(row[0] || '');
          // Look specifically for "Attendee Details" section
          if (firstCell.includes('Attendee Details')) {
            // The actual header row is the next row
            headerRowIndex = i + 1;
            break;
          }
        }
      }

      if (headerRowIndex === -1 || headerRowIndex >= rawData.length) {
        console.log(`[CSV Processing] Failed to find 'Attendee Details' section. Available rows:`);
        rawData.slice(0, 10).forEach((row, i) => {
          console.log(`Row ${i}: ${row[0]}`);
        });
        return res.status(400).json({ 
          message: "لم يتم العثور على قسم 'Attendee Details' في الملف",
          hint: "تأكد من أن الملف يحتوي على قسم بعنوان 'Attendee Details'"
        });
      }
      
      console.log(`[CSV Processing] Found 'Attendee Details' section at row ${headerRowIndex}`);

      // Extract attendee data starting from header row + 1
      const attendeeData = rawData.slice(headerRowIndex + 1).filter(row => 
        row && row.length > 5 && row.some(cell => cell !== undefined && cell !== null && cell !== "")
      );
      
      // Clear rawData from memory after extraction
      rawData.length = 0;

      const processedAttendees: any[] = [];
      const errors: any[] = [];
      const duplicates = new Map<string, any[]>();

      console.log(`[CSV Processing] Processing ${attendeeData.length} attendee rows`);
      
      // Process each row with batching for better performance
      const batchSize = 100; // Process in smaller batches
      let processedCount = 0;
      
      for (let i = 0; i < attendeeData.length; i += batchSize) {
        const batch = attendeeData.slice(i, i + batchSize);
        
        batch.forEach((row, batchIndex) => {
          const index = i + batchIndex;
        const rowIndex = headerRowIndex + 2 + index; // +2 because we start from header+1 and index is 0-based
        
        const attendeeRow = {
          attended: String(row[0] || '').trim(),
          userName: String(row[1] || '').trim(),
          firstName: String(row[2] || '').trim(),
          lastName: String(row[3] || '').trim(),
          email: String(row[4] || '').trim().toLowerCase(),
          registrationTime: convertExcelDate(row[5]),
          approvalStatus: String(row[6] || '').trim(),
          joinTime: convertExcelDate(row[7]),
          leaveTime: convertExcelDate(row[8]),
          sessionDuration: row[9] ? Number(row[9]) : undefined,
          isGuest: String(row[10] || '').trim(),
          phoneNumber: String(row[11] || '').trim(), // Fixed: phoneNumber is column 11
          country: String(row[12] || '').trim(),     // Fixed: country is column 12
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
          processedCount++;
        });
        
        // Log progress every batch
        console.log(`[CSV Processing] Processed ${processedCount}/${attendeeData.length} rows`);
        
        // Yield control periodically to prevent timeout
        if (i > 0 && i % (batchSize * 2) === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }

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
      console.log(`[CSV Processing] Creating CSV file record with stats: total=${totalRecords}, valid=${validRecords}, duplicates=${duplicateRecords}, errors=${errorRecords}`);
      
      const csvFile = await storage.createCsvFile({
        fileName,
        fileSize,
        totalRecords,
        validRecords,
        duplicateRecords,
        errorRecords
      });
      
      console.log(`[CSV Processing] CSV file record created with ID: ${csvFile.id}`);

      // Store attendees in database with batching
      console.log(`[CSV Processing] Storing ${processedAttendees.length} attendees in database`);
      console.log(`[CSV Processing] Memory before storage:`, process.memoryUsage());
      
      try {
        // Store in smaller batches to avoid memory issues
        const storageBatchSize = 50;
        const storedAttendees = [];
        
        for (let i = 0; i < processedAttendees.length; i += storageBatchSize) {
          const batch = processedAttendees.slice(i, i + storageBatchSize);
          console.log(`[CSV Processing] Storing batch ${Math.floor(i/storageBatchSize) + 1}/${Math.ceil(processedAttendees.length/storageBatchSize)}`);
          
          const batchResult = await storage.createManyAttendees(batch);
          storedAttendees.push(...batchResult);
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log(`[CSV Processing] Successfully stored ${storedAttendees.length} attendees in database`);
        console.log(`[CSV Processing] Memory after storage:`, process.memoryUsage());
      } catch (dbError) {
        console.error(`[CSV Processing] Database error:`, dbError);
        throw new Error(`فشل في حفظ البيانات في قاعدة البيانات: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      }

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
      const errorInfo = {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : 'Stack trace hidden in production'
        } : error,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        platform: process.platform,
        nodeVersion: process.version
      };
      
      console.error("[CSV Processing] Critical Error:", errorInfo);
      
      // Determine error type and provide appropriate response
      let errorMessage = "خطأ في معالجة الملف";
      let statusCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('FUNCTION_INVOCATION_FAILED')) {
          errorMessage = "المعالجة استغرقت وقتاً أطول من المتوقع. حاول بملف أصغر أو ببيانات أقل";
          statusCode = 408; // Request Timeout
        } else if (error.message.includes('memory') || error.message.includes('heap')) {
          errorMessage = "الملف كبير جداً للمعالجة. حاول تقسيمه إلى ملفات أصغر";
          statusCode = 413; // Payload Too Large
        } else if (error.message.includes('فشل في حفظ البيانات')) {
          errorMessage = "خطأ في حفظ البيانات. حاول مرة أخرى";
          statusCode = 503; // Service Unavailable
        }
      }
      
      const isDev = process.env.NODE_ENV === 'development';
      res.status(statusCode).json({ 
        message: errorMessage,
        ...(isDev && {
          error: error instanceof Error ? error.message : String(error),
          details: "تأكد من أن الملف يحتوي على قسم 'Attendee Details' وأن البيانات في التنسيق الصحيح",
          memoryUsage: errorInfo.memoryUsage
        })
      });
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
