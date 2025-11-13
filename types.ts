export enum ActiveModule {
  Report = 'report',
  Certificate = 'certificate',
}

export enum StaffModule {
  BulkVerify = 'bulk-verify',
  Report = 'report',
}

export type UserRole = 'student' | 'staff';

// Represents a user account in the application
export interface User {
  id: string;
  username: string;
  email: string;
  password_DO_NOT_STORE_PLAINTEXT: string; // In a real app, this would be a hash
  role: UserRole;
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
  // Fix: Add mimeType property to support different file types for previews.
  mimeType?: string;
}
