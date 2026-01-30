import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Patient, 
  VisitReceipt, 
  Prescription,
  QueueState, 
  PatientStatus,
  EscalationLevel,
  StaffRole,
  Department,
  DEPARTMENTS,
  PrescriptionStatus
} from '@/types/queue';
import { sortQueueByPriority, generateTrustScore, estimateWaitTime, generateTokenNumber } from '@/lib/priority-engine';
import { toast } from 'sonner';
import { supabase, DbPatient, DbPrescription, DbReceipt, DbTokenCounter } from '@/lib/supabase';

// Helper functions to convert between DB and App types
function dbPatientToPatient(db: DbPatient): Patient {
  return {
    id: db.id,
    tokenNumber: db.token_number,
    name: db.name,
    age: db.age,
    department: db.department as Department,
    symptom: db.symptom,
    symptomSeverity: db.symptom_severity as 'mild' | 'moderate' | 'severe',
    vulnerabilities: db.vulnerabilities,
    visitType: db.visit_type as 'routine' | 'followup' | 'referral',
    status: db.status as PatientStatus,
    arrivalTime: db.arrival_time,
    escalationLevel: db.escalation_level as EscalationLevel,
    isEmergency: db.is_emergency,
    isLateArrival: db.is_late_arrival,
    trustScore: db.trust_score,
    receiptId: db.receipt_id,
    consultationEndTime: db.consultation_end_time,
    diagnosis: db.diagnosis,
    prescriptionId: db.prescription_id,
  };
}

function patientToDbPatient(patient: Patient): Omit<DbPatient, 'created_at' | 'updated_at'> {
  return {
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
  };
}

function dbPrescriptionToPrescription(db: DbPrescription): Prescription {
  return {
    id: db.id,
    patientId: db.patient_id,
    patientName: db.patient_name,
    tokenNumber: db.token_number,
    department: db.department as Department,
    doctorDepartment: db.doctor_department,
    diagnosis: db.diagnosis,
    medicines: db.medicines,
    status: db.status as PrescriptionStatus,
    aiGenerated: db.ai_generated,
    doctorVerified: db.doctor_verified,
    createdAt: db.created_at,
    forwardedAt: db.forwarded_at,
    dispensedAt: db.dispensed_at,
  };
}

function prescriptionToDbPrescription(p: Prescription): DbPrescription {
  return {
    id: p.id,
    patient_id: p.patientId,
    patient_name: p.patientName,
    token_number: p.tokenNumber,
    department: p.department,
    doctor_department: p.doctorDepartment,
    diagnosis: p.diagnosis,
    medicines: p.medicines,
    status: p.status,
    ai_generated: p.aiGenerated,
    doctor_verified: p.doctorVerified,
    created_at: p.createdAt,
    forwarded_at: p.forwardedAt,
    dispensed_at: p.dispensedAt,
  };
}

function dbReceiptToReceipt(db: DbReceipt): VisitReceipt {
  return {
    id: db.id,
    patientId: db.patient_id,
    patientName: db.patient_name,
    tokenNumber: db.token_number,
    department: db.department as Department,
    visitDate: db.visit_date,
    doctorRole: db.doctor_role,
    visitType: db.visit_type as 'routine' | 'followup' | 'referral',
    diagnosis: db.diagnosis,
    prescriptionId: db.prescription_id,
    prescriptionStatus: db.prescription_status as PrescriptionStatus | undefined,
    status: db.status as 'active' | 'fulfilled' | 'invalid',
    scanCount: db.scan_count,
    createdAt: db.created_at,
  };
}

function receiptToDbReceipt(r: VisitReceipt): DbReceipt {
  return {
    id: r.id,
    patient_id: r.patientId,
    patient_name: r.patientName,
    token_number: r.tokenNumber,
    department: r.department,
    visit_date: r.visitDate,
    doctor_role: r.doctorRole,
    visit_type: r.visitType,
    diagnosis: r.diagnosis,
    prescription_id: r.prescriptionId,
    prescription_status: r.prescriptionStatus,
    status: r.status,
    scan_count: r.scanCount,
    created_at: r.createdAt,
  };
}

// Action types
type QueueAction =
  | { type: 'REGISTER_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENT'; patient: Patient }
  | { type: 'REMOVE_PATIENT'; patientId: string }
  | { type: 'ADD_PRESCRIPTION'; prescription: Prescription }
  | { type: 'UPDATE_PRESCRIPTION'; prescription: Prescription }
  | { type: 'ADD_RECEIPT'; receipt: VisitReceipt }
  | { type: 'UPDATE_RECEIPT'; receipt: VisitReceipt }
  | { type: 'SET_TOKEN_COUNTER'; department: Department; counter: number }
  | { type: 'SET_OFFLINE'; isOffline: boolean }
  | { type: 'LOAD_STATE'; state: QueueState };

// Initial state
const initialState: QueueState = {
  patients: [],
  prescriptions: [],
  receipts: [],
  tokenCounters: {
    general_medicine: 0,
    pediatrics: 0,
    orthopedics: 0,
    gynecology: 0,
  },
  isOffline: false,
  pendingSync: false,
};

// Reducer
function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'REGISTER_PATIENT': {
      const updatedPatients = sortQueueByPriority([...state.patients, action.payload]);
      return { ...state, patients: updatedPatients };
    }

    case 'UPDATE_PATIENT': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.patient.id ? action.patient : p
      );
      return { ...state, patients: sortQueueByPriority(updatedPatients) };
    }

    case 'REMOVE_PATIENT': {
      return { ...state, patients: state.patients.filter(p => p.id !== action.patientId) };
    }

    case 'ADD_PRESCRIPTION': {
      return { ...state, prescriptions: [...state.prescriptions, action.prescription] };
    }

    case 'UPDATE_PRESCRIPTION': {
      const updatedPrescriptions = state.prescriptions.map(p =>
        p.id === action.prescription.id ? action.prescription : p
      );
      return { ...state, prescriptions: updatedPrescriptions };
    }

    case 'ADD_RECEIPT': {
      return { ...state, receipts: [...state.receipts, action.receipt] };
    }

    case 'UPDATE_RECEIPT': {
      const updatedReceipts = state.receipts.map(r =>
        r.id === action.receipt.id ? action.receipt : r
      );
      return { ...state, receipts: updatedReceipts };
    }

    case 'SET_TOKEN_COUNTER': {
      return {
        ...state,
        tokenCounters: { ...state.tokenCounters, [action.department]: action.counter },
      };
    }

    case 'SET_OFFLINE': {
      return { ...state, isOffline: action.isOffline };
    }

    case 'LOAD_STATE': {
      return action.state;
    }

    default:
      return state;
  }
}

// Context
interface QueueContextType {
  state: QueueState;
  isLoading: boolean;
  registerPatient: (patient: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'arrivalTime' | 'escalationLevel' | 'isEmergency' | 'isLateArrival' | 'trustScore'>) => Promise<string>;
  updateStatus: (patientId: string, status: PatientStatus) => Promise<void>;
  markEmergency: (patientId: string) => Promise<void>;
  resolveEmergency: (patientId: string) => Promise<void>;
  markLateArrival: (patientId: string) => Promise<void>;
  escalate: (patientId: string, level: EscalationLevel) => Promise<void>;
  callNext: (department: Department) => Promise<void>;
  startConsultation: (patientId: string) => Promise<void>;
  completeConsultation: (patientId: string, diagnosis?: string) => Promise<void>;
  removePatient: (patientId: string) => Promise<void>;
  transferDepartment: (patientId: string, newDepartment: Department) => Promise<void>;
  createPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt'>) => Promise<string>;
  verifyPrescription: (prescriptionId: string) => Promise<void>;
  forwardPrescription: (prescriptionId: string) => Promise<void>;
  dispenseMedicine: (prescriptionId: string) => Promise<void>;
  scanReceipt: (receiptId: string) => Promise<VisitReceipt | null>;
  getReceipt: (receiptId: string) => VisitReceipt | undefined;
  getPatient: (patientId: string) => Patient | undefined;
  getPatientByToken: (tokenNumber: string) => Patient | undefined;
  getPrescription: (prescriptionId: string) => Prescription | undefined;
  getPrescriptionByToken: (tokenNumber: string) => Prescription | undefined;
  getEstimatedWait: (patientId: string) => number;
  getSortedQueue: (department?: Department) => Patient[];
  getForwardedPrescriptions: () => Prescription[];
  toggleOffline: () => void;
  canPerformAction: (role: StaffRole, action: string) => boolean;
  refreshData: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Provider
export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(queueReducer, initialState);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load data from Supabase on mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [patientsRes, prescriptionsRes, receiptsRes, countersRes] = await Promise.all([
        supabase.from('patients').select('*').order('arrival_time', { ascending: true }),
        supabase.from('prescriptions').select('*').order('created_at', { ascending: true }),
        supabase.from('receipts').select('*').order('created_at', { ascending: true }),
        supabase.from('token_counters').select('*'),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (prescriptionsRes.error) throw prescriptionsRes.error;
      if (receiptsRes.error) throw receiptsRes.error;
      if (countersRes.error) throw countersRes.error;

      const patients = (patientsRes.data || []).map(dbPatientToPatient);
      const prescriptions = (prescriptionsRes.data || []).map(dbPrescriptionToPrescription);
      const receipts = (receiptsRes.data || []).map(dbReceiptToReceipt);
      
      const tokenCounters: Record<Department, number> = {
        general_medicine: 0,
        pediatrics: 0,
        orthopedics: 0,
        gynecology: 0,
      };
      
      (countersRes.data || []).forEach((c: DbTokenCounter) => {
        if (c.department in tokenCounters) {
          tokenCounters[c.department as Department] = c.counter;
        }
      });

      dispatch({
        type: 'LOAD_STATE',
        state: {
          patients: sortQueueByPriority(patients),
          prescriptions,
          receipts,
          tokenCounters,
          isOffline: false,
          pendingSync: false,
        },
      });
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      toast.error('Failed to load data from database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    const patientsChannel = supabase
      .channel('patients-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        loadData();
      })
      .subscribe();

    const prescriptionsChannel = supabase
      .channel('prescriptions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => {
        loadData();
      })
      .subscribe();

    const receiptsChannel = supabase
      .channel('receipts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(prescriptionsChannel);
      supabase.removeChannel(receiptsChannel);
    };
  }, [loadData]);

  // Role-based permissions
  const canPerformAction = (role: StaffRole, action: string): boolean => {
    const permissions: Record<StaffRole, string[]> = {
      receptionist: ['view', 'escalate_low', 'mark_late', 'transfer'],
      nurse: ['view', 'escalate_low', 'escalate_medium', 'mark_late', 'mark_emergency'],
      doctor: ['view', 'call_next', 'start_consultation', 'complete', 'resolve_emergency', 'generate_receipt', 'create_prescription', 'verify_prescription', 'forward_prescription'],
      medicine_staff: ['view', 'dispense', 'verify_prescription'],
    };
    return permissions[role]?.includes(action) || false;
  };

  // Helper to update token counter in DB
  const updateTokenCounter = async (department: Department, newCounter: number) => {
    const { error } = await supabase
      .from('token_counters')
      .upsert({ department, counter: newCounter }, { onConflict: 'department' });
    
    if (error) throw error;
    dispatch({ type: 'SET_TOKEN_COUNTER', department, counter: newCounter });
  };

  const value: QueueContextType = {
    state,
    isLoading,
    
    registerPatient: async (patientData) => {
      const department = patientData.department;
      const newCounter = state.tokenCounters[department] + 1;
      const tokenNumber = generateTokenNumber(department, newCounter);
      
      const newPatient: Patient = {
        id: uuidv4(),
        tokenNumber,
        ...patientData,
        status: 'waiting',
        arrivalTime: Date.now(),
        escalationLevel: 0,
        isEmergency: false,
        isLateArrival: false,
        trustScore: generateTrustScore(),
      };
      
      try {
        const { error } = await supabase
          .from('patients')
          .insert(patientToDbPatient(newPatient));
        
        if (error) throw error;
        
        await updateTokenCounter(department, newCounter);
        dispatch({ type: 'REGISTER_PATIENT', payload: newPatient });
        toast.success(`Patient registered - Token: ${tokenNumber}`);
        return newPatient.id;
      } catch (error) {
        console.error('Failed to register patient:', error);
        toast.error('Failed to register patient');
        throw error;
      }
    },
    
    updateStatus: async (patientId, status) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const updatedPatient = { ...patient, status };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ status })
          .eq('id', patientId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
      } catch (error) {
        console.error('Failed to update status:', error);
        toast.error('Failed to update status');
      }
    },
    
    markEmergency: async (patientId) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const updatedPatient = { ...patient, isEmergency: true, status: 'emergency' as PatientStatus };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ is_emergency: true, status: 'emergency' })
          .eq('id', patientId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        toast.error('EMERGENCY: Patient marked for immediate attention', { duration: 5000 });
      } catch (error) {
        console.error('Failed to mark emergency:', error);
        toast.error('Failed to mark emergency');
      }
    },
    
    resolveEmergency: async (patientId) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const updatedPatient = { ...patient, isEmergency: false, status: 'waiting' as PatientStatus };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ is_emergency: false, status: 'waiting' })
          .eq('id', patientId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        toast.success('Emergency resolved');
      } catch (error) {
        console.error('Failed to resolve emergency:', error);
        toast.error('Failed to resolve emergency');
      }
    },
    
    markLateArrival: async (patientId) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const updatedPatient = { ...patient, isLateArrival: true };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ is_late_arrival: true })
          .eq('id', patientId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        toast.warning('Patient marked as late arrival');
      } catch (error) {
        console.error('Failed to mark late arrival:', error);
        toast.error('Failed to mark late arrival');
      }
    },
    
    escalate: async (patientId, level) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const updatedPatient = { ...patient, escalationLevel: level };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ escalation_level: level })
          .eq('id', patientId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        toast.info(`Priority escalated to level ${level}`);
      } catch (error) {
        console.error('Failed to escalate:', error);
        toast.error('Failed to escalate priority');
      }
    },
    
    callNext: async (department) => {
      const waiting = state.patients.filter(p => p.department === department && p.status === 'waiting');
      if (waiting.length === 0) {
        toast.info('No patients waiting in this department');
        return;
      }

      const sorted = sortQueueByPriority(waiting, department);
      const nextPatient = sorted[0];
      const updatedPatient = { ...nextPatient, status: 'called' as PatientStatus };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ status: 'called' })
          .eq('id', nextPatient.id);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        toast.success(`Calling ${nextPatient.name} (${nextPatient.tokenNumber})`);
      } catch (error) {
        console.error('Failed to call next:', error);
        toast.error('Failed to call next patient');
      }
    },
    
    startConsultation: async (patientId) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const updatedPatient = { ...patient, status: 'consultation' as PatientStatus };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ status: 'consultation' })
          .eq('id', patientId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        toast.info('Consultation started');
      } catch (error) {
        console.error('Failed to start consultation:', error);
        toast.error('Failed to start consultation');
      }
    },
    
    completeConsultation: async (patientId, diagnosis) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const receiptId = uuidv4();
      const deptInfo = DEPARTMENTS.find(d => d.id === patient.department);
      
      const newReceipt: VisitReceipt = {
        id: receiptId,
        patientId: patient.id,
        patientName: patient.name,
        tokenNumber: patient.tokenNumber,
        department: patient.department,
        visitDate: Date.now(),
        doctorRole: `${deptInfo?.name || 'General'} Physician`,
        visitType: patient.visitType,
        diagnosis: diagnosis || patient.diagnosis,
        prescriptionId: patient.prescriptionId,
        prescriptionStatus: patient.prescriptionId 
          ? state.prescriptions.find(p => p.id === patient.prescriptionId)?.status 
          : undefined,
        status: 'active',
        scanCount: 0,
        createdAt: Date.now(),
      };

      const updatedPatient: Patient = { 
        ...patient, 
        status: 'completed', 
        receiptId,
        diagnosis: diagnosis || patient.diagnosis,
        consultationEndTime: Date.now()
      };
      
      try {
        // Insert receipt and update patient in parallel
        const [receiptRes, patientRes] = await Promise.all([
          supabase.from('receipts').insert(receiptToDbReceipt(newReceipt)),
          supabase.from('patients').update({
            status: 'completed',
            receipt_id: receiptId,
            diagnosis: diagnosis || patient.diagnosis,
            consultation_end_time: Date.now(),
          }).eq('id', patientId),
        ]);
        
        if (receiptRes.error) throw receiptRes.error;
        if (patientRes.error) throw patientRes.error;
        
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        dispatch({ type: 'ADD_RECEIPT', receipt: newReceipt });
        toast.success('Consultation completed - Receipt generated');
      } catch (error) {
        console.error('Failed to complete consultation:', error);
        toast.error('Failed to complete consultation');
      }
    },
    
    removePatient: async (patientId) => {
      try {
        const { error } = await supabase
          .from('patients')
          .delete()
          .eq('id', patientId);
        
        if (error) throw error;
        dispatch({ type: 'REMOVE_PATIENT', patientId });
        toast.info('Patient removed from queue');
      } catch (error) {
        console.error('Failed to remove patient:', error);
        toast.error('Failed to remove patient');
      }
    },
    
    transferDepartment: async (patientId, newDepartment) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const newCounter = state.tokenCounters[newDepartment] + 1;
      const newToken = generateTokenNumber(newDepartment, newCounter);
      const deptInfo = DEPARTMENTS.find(d => d.id === newDepartment);
      
      const updatedPatient = { ...patient, department: newDepartment, tokenNumber: newToken };
      
      try {
        const { error } = await supabase
          .from('patients')
          .update({ department: newDepartment, token_number: newToken })
          .eq('id', patientId);
        
        if (error) throw error;
        
        await updateTokenCounter(newDepartment, newCounter);
        dispatch({ type: 'UPDATE_PATIENT', patient: updatedPatient });
        toast.success(`Patient transferred to ${deptInfo?.name || newDepartment}`);
      } catch (error) {
        console.error('Failed to transfer department:', error);
        toast.error('Failed to transfer department');
      }
    },
    
    createPrescription: async (prescriptionData) => {
      const id = uuidv4();
      const prescription: Prescription = {
        ...prescriptionData,
        id,
        createdAt: Date.now(),
      };
      
      try {
        // Insert prescription
        const { error: prescError } = await supabase
          .from('prescriptions')
          .insert(prescriptionToDbPrescription(prescription));
        
        if (prescError) throw prescError;
        
        // Update patient with prescription ID
        const { error: patientError } = await supabase
          .from('patients')
          .update({ prescription_id: id, diagnosis: prescription.diagnosis })
          .eq('id', prescription.patientId);
        
        if (patientError) throw patientError;
        
        dispatch({ type: 'ADD_PRESCRIPTION', prescription });
        
        // Update patient in local state
        const patient = state.patients.find(p => p.id === prescription.patientId);
        if (patient) {
          dispatch({ 
            type: 'UPDATE_PATIENT', 
            patient: { ...patient, prescriptionId: id, diagnosis: prescription.diagnosis } 
          });
        }
        
        return id;
      } catch (error) {
        console.error('Failed to create prescription:', error);
        toast.error('Failed to create prescription');
        throw error;
      }
    },
    
    verifyPrescription: async (prescriptionId) => {
      const prescription = state.prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;
      
      const updatedPrescription = { 
        ...prescription, 
        doctorVerified: true, 
        status: 'verified' as PrescriptionStatus 
      };
      
      try {
        const { error } = await supabase
          .from('prescriptions')
          .update({ doctor_verified: true, status: 'verified' })
          .eq('id', prescriptionId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PRESCRIPTION', prescription: updatedPrescription });
        toast.success('Prescription verified by doctor');
      } catch (error) {
        console.error('Failed to verify prescription:', error);
        toast.error('Failed to verify prescription');
      }
    },
    
    forwardPrescription: async (prescriptionId) => {
      const prescription = state.prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;
      
      const updatedPrescription = { 
        ...prescription, 
        status: 'forwarded' as PrescriptionStatus, 
        forwardedAt: Date.now() 
      };
      
      try {
        const { error } = await supabase
          .from('prescriptions')
          .update({ status: 'forwarded', forwarded_at: Date.now() })
          .eq('id', prescriptionId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_PRESCRIPTION', prescription: updatedPrescription });
        toast.success('Prescription forwarded to Medicine Department');
      } catch (error) {
        console.error('Failed to forward prescription:', error);
        toast.error('Failed to forward prescription');
      }
    },
    
    dispenseMedicine: async (prescriptionId) => {
      const prescription = state.prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;
      
      const updatedPrescription = { 
        ...prescription, 
        status: 'dispensed' as PrescriptionStatus, 
        dispensedAt: Date.now() 
      };
      
      try {
        // Update prescription
        const { error: prescError } = await supabase
          .from('prescriptions')
          .update({ status: 'dispensed', dispensed_at: Date.now() })
          .eq('id', prescriptionId);
        
        if (prescError) throw prescError;
        
        // Update any related receipt
        await supabase
          .from('receipts')
          .update({ prescription_status: 'dispensed' })
          .eq('prescription_id', prescriptionId);
        
        dispatch({ type: 'UPDATE_PRESCRIPTION', prescription: updatedPrescription });
        
        // Update receipts in local state
        const updatedReceipts = state.receipts.map(r =>
          r.prescriptionId === prescriptionId
            ? { ...r, prescriptionStatus: 'dispensed' as PrescriptionStatus }
            : r
        );
        updatedReceipts.forEach(r => {
          if (r.prescriptionId === prescriptionId) {
            dispatch({ type: 'UPDATE_RECEIPT', receipt: r });
          }
        });
        
        toast.success('Medicines dispensed successfully');
      } catch (error) {
        console.error('Failed to dispense medicine:', error);
        toast.error('Failed to dispense medicine');
      }
    },
    
    scanReceipt: async (receiptId) => {
      const receipt = state.receipts.find(r => r.id === receiptId);
      if (!receipt) return null;
      
      const newScanCount = receipt.scanCount + 1;
      const updatedReceipt = {
        ...receipt,
        scanCount: newScanCount,
        status: newScanCount > 1 ? 'fulfilled' as const : receipt.status,
      };
      
      try {
        const { error } = await supabase
          .from('receipts')
          .update({ 
            scan_count: newScanCount, 
            status: newScanCount > 1 ? 'fulfilled' : receipt.status 
          })
          .eq('id', receiptId);
        
        if (error) throw error;
        dispatch({ type: 'UPDATE_RECEIPT', receipt: updatedReceipt });
        
        if (receipt.scanCount >= 1) {
          toast.error('FRAUD ALERT: This receipt has already been used!', { duration: 5000 });
        }
        
        return updatedReceipt;
      } catch (error) {
        console.error('Failed to scan receipt:', error);
        toast.error('Failed to scan receipt');
        return null;
      }
    },
    
    getReceipt: (receiptId) => state.receipts.find(r => r.id === receiptId),
    
    getPatient: (patientId) => state.patients.find(p => p.id === patientId),
    
    getPatientByToken: (tokenNumber) => state.patients.find(p => p.tokenNumber === tokenNumber.toUpperCase()),
    
    getPrescription: (prescriptionId) => state.prescriptions.find(p => p.id === prescriptionId),
    
    getPrescriptionByToken: (tokenNumber) => state.prescriptions.find(p => p.tokenNumber === tokenNumber.toUpperCase()),
    
    getEstimatedWait: (patientId) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return 0;
      return estimateWaitTime(patient, state.patients);
    },
    
    getSortedQueue: (department) => sortQueueByPriority(state.patients, department),
    
    getForwardedPrescriptions: () => state.prescriptions.filter(p => p.status === 'forwarded'),
    
    toggleOffline: () => {
      const newOffline = !state.isOffline;
      dispatch({ type: 'SET_OFFLINE', isOffline: newOffline });
      if (newOffline) {
        toast.warning('Offline Mode - Changes will sync when connection returns');
      } else {
        toast.success('Back online - Syncing changes...');
        loadData();
      }
    },
    
    canPerformAction,
    
    refreshData: loadData,
  };

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
