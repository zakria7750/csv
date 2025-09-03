export interface CSVParseResult<T = any> {
  data: T[];
  errors: CSVError[];
  meta: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
}

export interface CSVError {
  row: number;
  message: string;
  data?: any;
}

export class CSVParser {
  private static readonly WEBINAR_HEADERS = [
    'حضر', 'اسم المستخدم', 'الاسم الأول', 'اسم العائلة', 'البريد الإلكتروني',
    'Attended', 'User Name', 'First Name', 'Last Name', 'Email'
  ];

  static parseCSVText(csvText: string): CSVParseResult {
    const lines = csvText.split('\n');
    const errors: CSVError[] = [];
    const data: any[] = [];
    
    let headerRowIndex = this.findHeaderRow(lines);
    
    if (headerRowIndex === -1) {
      errors.push({
        row: 0,
        message: "لم يتم العثور على صف العناوين الخاص ببيانات الحضور"
      });
      return { data: [], errors, meta: { totalRows: 0, validRows: 0, errorRows: 1 } };
    }

    const headerRow = this.parseCSVLine(lines[headerRowIndex]);
    const dataRows = lines.slice(headerRowIndex + 1);
    
    dataRows.forEach((line, index) => {
      if (line.trim() === '') return; // Skip empty lines
      
      const actualRowIndex = headerRowIndex + 1 + index;
      const cells = this.parseCSVLine(line);
      
      if (cells.length < 5) {
        errors.push({
          row: actualRowIndex + 1,
          message: "عدد الأعمدة غير كافٍ",
          data: cells
        });
        return;
      }

      const rowData = this.mapCellsToObject(cells, headerRow);
      data.push(rowData);
    });

    return {
      data,
      errors,
      meta: {
        totalRows: dataRows.length,
        validRows: data.length,
        errorRows: errors.length
      }
    };
  }

  private static findHeaderRow(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const hasWebinarHeaders = this.WEBINAR_HEADERS.some(header => 
        line.includes(header)
      );
      
      if (hasWebinarHeaders) {
        return i;
      }
    }
    return -1;
  }

  private static parseCSVLine(line: string): string[] {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    cells.push(currentCell.trim());
    return cells;
  }

  private static mapCellsToObject(cells: string[], headers: string[]): any {
    const obj: any = {};
    
    // Map common fields based on position
    obj.attended = cells[0] || '';
    obj.userName = cells[1] || '';
    obj.firstName = cells[2] || '';
    obj.lastName = cells[3] || '';
    obj.email = cells[4] || '';
    obj.registrationTime = cells[5] || '';
    obj.approvalStatus = cells[6] || '';
    obj.joinTime = cells[7] || '';
    obj.leaveTime = cells[8] || '';
    obj.sessionDuration = cells[9] ? parseInt(cells[9]) : null;
    obj.isGuest = cells[10] || '';
    obj.country = cells[11] || '';
    obj.phoneNumber = cells[12] || '';
    
    return obj;
  }
}
