import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching our schema
export interface DbPatient {
  id: string;
  token_number: string;
  name: string;
  age: number;
  department: string;
  symptom: string;
  symptom_severity: string;
  vulnerabilities: {
    elderly: boolean;
    pregnant: boolean;
    disabled: boolean;
    chronicCondition: boolean;
  };
  visit_type: string;
  status: string;
  arrival_time: number;
  escalation_level: number;
  is_emergency: boolean;
  is_late_arrival: boolean;
  trust_score: number;
  receipt_id?: string;
  consultation_end_time?: number;
  diagnosis?: string;
  prescription_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DbPrescription {
  id: string;
  patient_id: string;
  patient_name: string;
  token_number: string;
  department: string;
  doctor_department: string;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  status: string;
  ai_generated: boolean;
  doctor_verified: boolean;
  created_at: number;
  forwarded_at?: number;
  dispensed_at?: number;
}

export interface DbReceipt {
  id: string;
  patient_id: string;
  patient_name: string;
  token_number: string;
  department: string;
  visit_date: number;
  doctor_role: string;
  visit_type: string;
  diagnosis?: string;
  prescription_id?: string;
  prescription_status?: string;
  status: string;
  scan_count: number;
  created_at: number;
}

export interface DbTokenCounter {
  department: string;
  counter: number;
}
