
export enum ActiveModule {
  Report = 'report',
  Certificate = 'certificate',
}

export enum StaffModule {
  BulkVerify = 'bulk-verify',
  Report = 'report',
  Repository = 'repository',
}

export type UserRole = 'student' | 'staff';
export type StaffDesignation = 'hod' | 'dean' | 'principal' | null;

// Represents a user account in the application
export interface User {
  id: string;
  username: string;
  email: string;
  password_DO_NOT_STORE_PLAINTEXT: string; // In a real app, this would be a hash
  role: UserRole;
  designation?: StaffDesignation;
}

export interface ReportVersion {
  content: string;
  timestamp: Date;
}

export interface CertificateData {
  recipientName: string;
  certificateId: string;
  courseTitle: string;
  issuingAuthority: string;
  issueDate: string;
  imageBase64?: string;
}

export interface VerificationResult {
  fileName: string;
  data: CertificateData | null;
  status: 'Verified' | 'Failed';
  error?: string;
  imageBase64?: string;
  mimeType?: string;
}

// Database Entity for Stored Files
export interface StoredFile {
  id: string;
  userId: string;
  username: string;
  userRole: UserRole;
  userDesignation?: StaffDesignation;
  title: string;
  type: 'report' | 'certificate';
  content: string; // Report text or JSON string
  images?: { base64: string; mimeType: string }[];
  createdAt: string;
}
