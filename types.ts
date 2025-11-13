export enum ActiveModule {
  Report = 'report',
  Certificate = 'certificate',
}

export enum StaffModule {
  BulkVerify = 'bulk-verify',
  Report = 'report',
}

export type UserRole = 'student' | 'staff';

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
}