import { supabase } from './supabase';
import { Patient, Prescription, VisitReceipt, Department } from '@/types/queue';

// Patient operations
export async function savePatient(patient: Patient) {
  const { data, error } = await supabase
    .from('patients')
    .insert([
      {
        id: patient.id,
        token_number: patient.tokenNumber,
        name: patient.name,
        age: patient.age,
        department: patient.department,
        symptom: patient.symptom,
        symptom_severity: patient.symptomSeverity,
        vulnerabilities: patient.vulnerabilities,
        visit_type: patient.visitType,
        status: patient.status,
        arrival_time: patient.arrivalTime,
        escalation_level: patient.escalationLevel,
        is_emergency: patient.isEmergency,
        is_late_arrival: patient.isLateArrival,
        trust_score: patient.trustScore,
        receipt_id: patient.receiptId,
        consultation_end_time: patient.consultationEndTime,
        diagnosis: patient.diagnosis,
        prescription_id: patient.prescriptionId,
      }
    ])
    .select();
  
  if (error) {
    console.error('Error saving patient:', error);
    throw error;
  }
  return data;
}

export async function updatePatient(patientId: string, updates: Partial<Patient>) {
  const { data, error } = await supabase
    .from('patients')
    .update({
      status: updates.status,
      escalation_level: updates.escalationLevel,
      is_emergency: updates.isEmergency,
      is_late_arrival: updates.isLateArrival,
      receipt_id: updates.receiptId,
      consultation_end_time: updates.consultationEndTime,
      diagnosis: updates.diagnosis,
      prescription_id: updates.prescriptionId,
      updated_at: new Date(),
    })
    .eq('id', patientId)
    .select();
  
  if (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
  return data;
}

export async function getPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('*');
  
  if (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
  
  return data?.map(p => ({
    id: p.id,
    tokenNumber: p.token_number,
    name: p.name,
    age: p.age,
    department: p.department,
    symptom: p.symptom,
    symptomSeverity: p.symptom_severity,
    vulnerabilities: p.vulnerabilities,
    visitType: p.visit_type,
    status: p.status,
    arrivalTime: p.arrival_time,
    escalationLevel: p.escalation_level,
    isEmergency: p.is_emergency,
    isLateArrival: p.is_late_arrival,
    trustScore: p.trust_score,
    receiptId: p.receipt_id,
    consultationEndTime: p.consultation_end_time,
    diagnosis: p.diagnosis,
    prescriptionId: p.prescription_id,
  })) || [];
}

export async function deletePatient(patientId: string) {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId);
  
  if (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
}

// Prescription operations
export async function savePrescription(prescription: Prescription) {
  const { data, error } = await supabase
    .from('prescriptions')
    .insert([
      {
        id: prescription.id,
        patient_id: prescription.patientId,
        patient_name: prescription.patientName,
        token_number: prescription.tokenNumber,
        department: prescription.department,
        doctor_department: prescription.doctorDepartment,
        diagnosis: prescription.diagnosis,
        medicines: prescription.medicines,
        status: prescription.status,
        ai_generated: prescription.aiGenerated,
        doctor_verified: prescription.doctorVerified,
        created_at: prescription.createdAt,
        forwarded_at: prescription.forwardedAt,
        dispensed_at: prescription.dispensedAt,
      }
    ])
    .select();
  
  if (error) {
    console.error('Error saving prescription:', error);
    throw error;
  }
  return data;
}

export async function updatePrescription(prescriptionId: string, updates: Partial<Prescription>) {
  const { data, error } = await supabase
    .from('prescriptions')
    .update({
      status: updates.status,
      doctor_verified: updates.doctorVerified,
      forwarded_at: updates.forwardedAt,
      dispensed_at: updates.dispensedAt,
      updated_at: new Date(),
    })
    .eq('id', prescriptionId)
    .select();
  
  if (error) {
    console.error('Error updating prescription:', error);
    throw error;
  }
  return data;
}

export async function getPrescriptions() {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*');
  
  if (error) {
    console.error('Error fetching prescriptions:', error);
    throw error;
  }
  
  return data?.map(p => ({
    id: p.id,
    patientId: p.patient_id,
    patientName: p.patient_name,
    tokenNumber: p.token_number,
    department: p.department,
    doctorDepartment: p.doctor_department,
    diagnosis: p.diagnosis,
    medicines: p.medicines,
    status: p.status,
    aiGenerated: p.ai_generated,
    doctorVerified: p.doctor_verified,
    createdAt: p.created_at,
    forwardedAt: p.forwarded_at,
    dispensedAt: p.dispensed_at,
  })) || [];
}

// Receipt operations
export async function saveReceipt(receipt: VisitReceipt) {
  const { data, error } = await supabase
    .from('receipts')
    .insert([
      {
        id: receipt.id,
        patient_id: receipt.patientId,
        patient_name: receipt.patientName,
        token_number: receipt.tokenNumber,
        department: receipt.department,
        visit_date: receipt.visitDate,
        doctor_role: receipt.doctorRole,
        visit_type: receipt.visitType,
        diagnosis: receipt.diagnosis,
        prescription_id: receipt.prescriptionId,
        prescription_status: receipt.prescriptionStatus,
        status: receipt.status,
        scan_count: receipt.scanCount,
        created_at: receipt.createdAt,
      }
    ])
    .select();
  
  if (error) {
    console.error('Error saving receipt:', error);
    throw error;
  }
  return data;
}

export async function updateReceipt(receiptId: string, updates: Partial<VisitReceipt>) {
  const { data, error } = await supabase
    .from('receipts')
    .update({
      scan_count: updates.scanCount,
      status: updates.status,
      prescription_status: updates.prescriptionStatus,
      updated_at: new Date(),
    })
    .eq('id', receiptId)
    .select();
  
  if (error) {
    console.error('Error updating receipt:', error);
    throw error;
  }
  return data;
}

export async function getReceipts() {
  const { data, error } = await supabase
    .from('receipts')
    .select('*');
  
  if (error) {
    console.error('Error fetching receipts:', error);
    throw error;
  }
  
  return data?.map(r => ({
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    tokenNumber: r.token_number,
    department: r.department,
    visitDate: r.visit_date,
    doctorRole: r.doctor_role,
    visitType: r.visit_type,
    diagnosis: r.diagnosis,
    prescriptionId: r.prescription_id,
    prescriptionStatus: r.prescription_status,
    status: r.status,
    scanCount: r.scan_count,
    createdAt: r.created_at,
  })) || [];
}

// Token counter operations
export async function getTokenCounter(department: Department) {
  const { data, error } = await supabase
    .from('token_counters')
    .select('counter')
    .eq('department', department)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching token counter:', error);
    throw error;
  }
  
  return data?.counter || 0;
}

export async function incrementTokenCounter(department: Department) {
  const { data, error } = await supabase
    .from('token_counters')
    .update({ counter: ((await getTokenCounter(department)) || 0) + 1 })
    .eq('department', department)
    .select();
  
  if (error) {
    console.error('Error incrementing token counter:', error);
    throw error;
  }
  
  return data?.[0]?.counter || 0;
}

// Sync operations
export async function syncAllData() {
  try {
    const patients = await getPatients();
    const prescriptions = await getPrescriptions();
    const receipts = await getReceipts();
    
    return {
      patients,
      prescriptions,
      receipts,
    };
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
  }
}
