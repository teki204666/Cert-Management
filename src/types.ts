export type Role = "admin" | "staff" | "guest";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  staffId?: string;
  password?: string;
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

export interface Machine {
  id: string;
  name: string;
  machineNumber: string;
  department: string;
  contractNumber?: string;
  createdAt: any;
}

export interface Certificate {
  id: string;
  ownerType: 'staff' | 'machine';
  ownerId: string;
  ownerName: string;
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
  category: 'staff' | 'machine';
  description?: string;
  createdAt: any;
}

export interface VerificationLog {
  id: string;
  certId: string;
  timestamp: string;
  user: string;
}

export interface NotificationLog {
  id: string;
  certId: string;
  staffName: string;
  type: "30_days" | "7_days";
  sentAt: any;
  recipient: string;
}
