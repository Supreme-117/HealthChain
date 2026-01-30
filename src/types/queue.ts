// HealthQueue+ Type Definitions - Multi-Department System

export type PatientStatus = 
  | 'waiting' 
  | 'called' 
  | 'consultation' 
  | 'emergency' 
  | 'completed';

export type SymptomSeverity = 'mild' | 'moderate' | 'severe';

export type VisitType = 'routine' | 'followup' | 'referral';

export type StaffRole = 'receptionist' | 'nurse' | 'doctor' | 'medicine_staff';

export type EscalationLevel = 0 | 1 | 2; // 0: none, 1: low (receptionist), 2: medium (nurse)

// Department definitions
export type Department = 
  | 'general_medicine' 
  | 'pediatrics' 
  | 'orthopedics' 
  | 'gynecology';

export const DEPARTMENTS: { id: Department; name: string; color: string; icon: string }[] = [
  { id: 'general_medicine', name: 'General Medicine', color: 'blue', icon: 'Stethoscope' },
  { id: 'pediatrics', name: 'Pediatrics', color: 'yellow', icon: 'Baby' },
  { id: 'orthopedics', name: 'Orthopedics', color: 'orange', icon: 'Bone' },
  { id: 'gynecology', name: 'Gynecology', color: 'pink', icon: 'Heart' },
];

// Department-specific symptoms
export const DEPARTMENT_SYMPTOMS: Record<Department, { value: string; label: string; severity: SymptomSeverity }[]> = {
  general_medicine: [
    { value: 'fever', label: 'Fever', severity: 'moderate' },
    { value: 'cold', label: 'Cold/Cough', severity: 'mild' },
    { value: 'headache', label: 'Headache', severity: 'mild' },
    { value: 'fatigue', label: 'Fatigue', severity: 'mild' },
    { value: 'chest_pain', label: 'Chest Pain', severity: 'severe' },
    { value: 'breathing', label: 'Breathing Difficulty', severity: 'severe' },
  ],
  pediatrics: [
    { value: 'fever', label: 'Fever', severity: 'moderate' },
    { value: 'vaccination', label: 'Vaccination', severity: 'mild' },
    { value: 'growth_checkup', label: 'Growth Checkup', severity: 'mild' },
    { value: 'rashes', label: 'Rashes/Skin Issues', severity: 'moderate' },
    { value: 'respiratory', label: 'Respiratory Issues', severity: 'severe' },
  ],
  orthopedics: [
    { value: 'joint_pain', label: 'Joint Pain', severity: 'moderate' },
    { value: 'back_pain', label: 'Back Pain', severity: 'moderate' },
    { value: 'fracture', label: 'Suspected Fracture', severity: 'severe' },
    { value: 'sprain', label: 'Sprain/Strain', severity: 'mild' },
    { value: 'arthritis', label: 'Arthritis Follow-up', severity: 'mild' },
  ],
  gynecology: [
    { value: 'prenatal', label: 'Prenatal Checkup', severity: 'mild' },
    { value: 'menstrual', label: 'Menstrual Issues', severity: 'moderate' },
    { value: 'pregnancy', label: 'Pregnancy Related', severity: 'moderate' },
    { value: 'postnatal', label: 'Postnatal Care', severity: 'mild' },
    { value: 'emergency_gyn', label: 'Emergency/Pain', severity: 'severe' },
  ],
};

export interface VulnerabilityFlags {
  elderly: boolean;
  pregnant: boolean;
  disabled: boolean;
  chronicCondition: boolean;
}

// Token number for tracking
export interface Patient {
  id: string;
  tokenNumber: string; // e.g., "GM-001" for General Medicine
  name: string;
  age: number;
  department: Department;
  symptom: string;
  symptomSeverity: SymptomSeverity;
  vulnerabilities: VulnerabilityFlags;
  visitType: VisitType;
  status: PatientStatus;
  arrivalTime: number; // timestamp
  escalationLevel: EscalationLevel;
  isEmergency: boolean;
  isLateArrival: boolean;
  trustScore: number; // 0-100, simulated
  receiptId?: string;
  consultationEndTime?: number;
  diagnosis?: string;
  prescriptionId?: string;
}

// AI Prescription types
export type PrescriptionStatus = 'pending' | 'verified' | 'forwarded' | 'dispensed';

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  tokenNumber: string;
  department: Department;
  doctorDepartment: string;
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  status: PrescriptionStatus;
  aiGenerated: boolean;
  doctorVerified: boolean;
  createdAt: number;
  forwardedAt?: number;
  dispensedAt?: number;
}

export interface VisitReceipt {
  id: string;
  patientId: string;
  patientName: string;
  tokenNumber: string;
  department: Department;
  visitDate: number;
  doctorRole: string;
  visitType: VisitType;
  diagnosis?: string;
  prescriptionId?: string;
  prescriptionStatus?: PrescriptionStatus;
  status: 'active' | 'fulfilled' | 'invalid';
  scanCount: number;
  createdAt: number;
}

export interface QueueState {
  patients: Patient[];
  prescriptions: Prescription[];
  receipts: VisitReceipt[];
  tokenCounters: Record<Department, number>;
  isOffline: boolean;
  pendingSync: boolean;
}

// Staff actions
export interface StaffAction {
  type: 'escalate' | 'mark_emergency' | 'mark_late' | 'call_next' | 'complete' | 'resolve_emergency' | 'transfer_department' | 'forward_prescription' | 'dispense_medicine';
  patientId?: string;
  level?: EscalationLevel;
  department?: Department;
  prescriptionId?: string;
}
