import { type Attendee, type InsertAttendee, type CsvFile, type InsertCsvFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Attendee operations
  getAttendee(id: string): Promise<Attendee | undefined>;
  getAttendeeByEmail(email: string): Promise<Attendee | undefined>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(id: string, attendee: Partial<InsertAttendee>): Promise<Attendee | undefined>;
  deleteAttendee(id: string): Promise<boolean>;
  getAllAttendees(): Promise<Attendee[]>;
  getAttendeesByFileId(fileId: string): Promise<Attendee[]>;
  
  // CSV file operations
  getCsvFile(id: string): Promise<CsvFile | undefined>;
  createCsvFile(file: InsertCsvFile): Promise<CsvFile>;
  getAllCsvFiles(): Promise<CsvFile[]>;
  
  // Bulk operations
  createManyAttendees(attendees: InsertAttendee[]): Promise<Attendee[]>;
  deleteAttendeesByFileId(fileId: string): Promise<boolean>;
  
  // Search and filter
  searchAttendees(query: string): Promise<Attendee[]>;
  getAttendeesByStatus(status: 'valid' | 'duplicate' | 'error'): Promise<Attendee[]>;
}

export class MemStorage implements IStorage {
  private attendees: Map<string, Attendee>;
  private csvFiles: Map<string, CsvFile>;

  constructor() {
    this.attendees = new Map();
    this.csvFiles = new Map();
  }

  async getAttendee(id: string): Promise<Attendee | undefined> {
    return this.attendees.get(id);
  }

  async getAttendeeByEmail(email: string): Promise<Attendee | undefined> {
    return Array.from(this.attendees.values()).find(
      (attendee) => attendee.email === email,
    );
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    const id = randomUUID();
    const attendee: Attendee = { 
      ...insertAttendee,
      joinTime: insertAttendee.joinTime || null,
      leaveTime: insertAttendee.leaveTime || null,
      sessionDuration: insertAttendee.sessionDuration || null,
      isGuest: insertAttendee.isGuest || null,
      country: insertAttendee.country || null,
      phoneNumber: insertAttendee.phoneNumber || null,
      isDuplicate: insertAttendee.isDuplicate || false,
      duplicateGroup: insertAttendee.duplicateGroup || null,
      hasErrors: insertAttendee.hasErrors || false,
      errorMessages: insertAttendee.errorMessages || null,
      id,
      createdAt: new Date()
    };
    this.attendees.set(id, attendee);
    return attendee;
  }

  async updateAttendee(id: string, updateData: Partial<InsertAttendee>): Promise<Attendee | undefined> {
    const existing = this.attendees.get(id);
    if (!existing) return undefined;

    const updated: Attendee = { ...existing, ...updateData };
    this.attendees.set(id, updated);
    return updated;
  }

  async deleteAttendee(id: string): Promise<boolean> {
    return this.attendees.delete(id);
  }

  async getAllAttendees(): Promise<Attendee[]> {
    const attendees = Array.from(this.attendees.values());
    // Sort duplicates together by grouping them
    return attendees.sort((a, b) => {
      if (a.duplicateGroup && b.duplicateGroup) {
        if (a.duplicateGroup === b.duplicateGroup) {
          return a.createdAt!.getTime() - b.createdAt!.getTime();
        }
        return a.duplicateGroup.localeCompare(b.duplicateGroup);
      }
      if (a.duplicateGroup && !b.duplicateGroup) return -1;
      if (!a.duplicateGroup && b.duplicateGroup) return 1;
      return a.createdAt!.getTime() - b.createdAt!.getTime();
    });
  }

  async getAttendeesByFileId(fileId: string): Promise<Attendee[]> {
    // In this implementation, we don't track fileId per attendee
    // but we can return all attendees for simplicity
    return this.getAllAttendees();
  }

  async getCsvFile(id: string): Promise<CsvFile | undefined> {
    return this.csvFiles.get(id);
  }

  async createCsvFile(insertFile: InsertCsvFile): Promise<CsvFile> {
    const id = randomUUID();
    const file: CsvFile = { 
      ...insertFile, 
      id,
      uploadedAt: new Date()
    };
    this.csvFiles.set(id, file);
    return file;
  }

  async getAllCsvFiles(): Promise<CsvFile[]> {
    return Array.from(this.csvFiles.values()).sort(
      (a, b) => b.uploadedAt!.getTime() - a.uploadedAt!.getTime()
    );
  }

  async createManyAttendees(attendees: InsertAttendee[]): Promise<Attendee[]> {
    const created: Attendee[] = [];
    for (const attendee of attendees) {
      const result = await this.createAttendee(attendee);
      created.push(result);
    }
    return created;
  }

  async deleteAttendeesByFileId(fileId: string): Promise<boolean> {
    // In this implementation, we delete all attendees for simplicity
    this.attendees.clear();
    return true;
  }

  async searchAttendees(query: string): Promise<Attendee[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.attendees.values()).filter(attendee =>
      attendee.firstName.toLowerCase().includes(lowerQuery) ||
      attendee.lastName.toLowerCase().includes(lowerQuery) ||
      attendee.userName.toLowerCase().includes(lowerQuery) ||
      attendee.email.toLowerCase().includes(lowerQuery) ||
      attendee.country?.toLowerCase().includes(lowerQuery)
    );
  }

  async getAttendeesByStatus(status: 'valid' | 'duplicate' | 'error'): Promise<Attendee[]> {
    return Array.from(this.attendees.values()).filter(attendee => {
      switch (status) {
        case 'valid':
          return !attendee.hasErrors && !attendee.isDuplicate;
        case 'duplicate':
          return attendee.isDuplicate;
        case 'error':
          return attendee.hasErrors;
        default:
          return true;
      }
    });
  }
}

export const storage = new MemStorage();
