export type Role = "admin" | "staff" | "guest";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  staffId?: string; // Link to staff record if role is staff
}

export interface Staff {
  id: string;
  name: string;
  staffNumber: string;
  department: string;
  contractNumber?: string;
  photoUrl?: string;
  createdAt: any;
}

export interface Certificate {
  id: string;
  staffId: string;
  staffName: string;
  contractNumber?: string;
  type: string;
  certNumber: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
  status: "valid" | "expired" | "expiring_soon";
  createdAt: any;
}

export interface CertType {
  id: string;
  name: string;
  description?: string;
  createdAt: any;
}

export interface NotificationLog {
  id: string;
  certId: string;
  staffName: string;
  type: "30_days" | "7_days";
  sentAt: any;
  recipient: string;
}
