import { attendeeValidationSchema } from "@shared/schema";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data: any;
}

export interface ProcessingStatistics {
  totalRecords: number;
  validRecords: number;
  duplicateRecords: number;
  errorRecords: number;
}

export class DataValidator {
  static validateAttendee(data: any): ValidationResult {
    const result = attendeeValidationSchema.safeParse(data);
    
    if (result.success) {
      return {
        isValid: true,
        errors: [],
        data: result.data
      };
    } else {
      return {
        isValid: false,
        errors: result.error.errors.map(err => err.message),
        data
      };
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhoneNumber(phone: string): boolean {
    if (!phone || phone.trim() === '' || phone === '--') return true; // Optional field
    
    // Remove spaces and common separators
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it contains only digits and optional + prefix
    const phoneRegex = /^\+?\d+$/;
    return phoneRegex.test(cleanPhone);
  }

  static isEmptyOrDash(value: string): boolean {
    return !value || value.trim() === '' || value.trim() === '--';
  }

  static detectDuplicates(records: any[], keyField = 'email'): Map<string, any[]> {
    const duplicates = new Map<string, any[]>();
    
    records.forEach(record => {
      const key = record[keyField]?.toLowerCase();
      if (key) {
        if (!duplicates.has(key)) {
          duplicates.set(key, []);
        }
        duplicates.get(key)!.push(record);
      }
    });

    // Filter to only keep groups with more than 1 record
    const actualDuplicates = new Map<string, any[]>();
    duplicates.forEach((group, key) => {
      if (group.length > 1) {
        actualDuplicates.set(key, group);
      }
    });

    return actualDuplicates;
  }

  static generateProcessingStatistics(records: any[]): ProcessingStatistics {
    const totalRecords = records.length;
    let validRecords = 0;
    let duplicateRecords = 0;
    let errorRecords = 0;

    records.forEach(record => {
      if (record.hasErrors) {
        errorRecords++;
      } else if (record.isDuplicate) {
        duplicateRecords++;
      } else {
        validRecords++;
      }
    });

    return {
      totalRecords,
      validRecords,
      duplicateRecords,
      errorRecords
    };
  }

  static cleanData(value: string): string {
    if (!value) return '';
    
    // Replace common placeholder values
    if (value === '--' || value === 'N/A' || value === 'null' || value === 'undefined') {
      return '';
    }
    
    return value.trim();
  }
}
