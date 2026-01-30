import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Patient, 
  VisitReceipt, 
  Prescription,
  PrescriptionMedicine,
  QueueState, 
  SymptomSeverity, 
  VisitType, 
  VulnerabilityFlags,
  PatientStatus,
  EscalationLevel,
  StaffRole,
  Department,
  DEPARTMENTS,
  PrescriptionStatus
} from '@/types/queue';
import { sortQueueByPriority, generateTrustScore, estimateWaitTime, generateTokenNumber } from '@/lib/priority-engine';
import { toast } from 'sonner';

// Action types
type QueueAction =
  | { type: 'REGISTER_PATIENT'; payload: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'arrivalTime' | 'escalationLevel' | 'isEmergency' | 'isLateArrival' | 'trustScore'> }
  | { type: 'UPDATE_STATUS'; patientId: string; status: PatientStatus }
  | { type: 'MARK_EMERGENCY'; patientId: string }
  | { type: 'RESOLVE_EMERGENCY'; patientId: string }
  | { type: 'MARK_LATE_ARRIVAL'; patientId: string }
  | { type: 'ESCALATE'; patientId: string; level: EscalationLevel }
  | { type: 'CALL_NEXT'; department: Department }
  | { type: 'START_CONSULTATION'; patientId: string }
  | { type: 'COMPLETE_CONSULTATION'; patientId: string; diagnosis?: string }
  | { type: 'REMOVE_PATIENT'; patientId: string }
  | { type: 'TRANSFER_DEPARTMENT'; patientId: string; newDepartment: Department }
  | { type: 'CREATE_PRESCRIPTION'; prescription: Prescription }
  | { type: 'VERIFY_PRESCRIPTION'; prescriptionId: string }
  | { type: 'FORWARD_PRESCRIPTION'; prescriptionId: string }
  | { type: 'DISPENSE_MEDICINE'; prescriptionId: string }
  | { type: 'SCAN_RECEIPT'; receiptId: string }
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
      const department = action.payload.department;
      const newCounter = state.tokenCounters[department] + 1;
      const tokenNumber = generateTokenNumber(department, newCounter);
      
      const newPatient: Patient = {
        id: uuidv4(),
        tokenNumber,
        ...action.payload,
        status: 'waiting',
        arrivalTime: Date.now(),
        escalationLevel: 0,
        isEmergency: false,
        isLateArrival: false,
        trustScore: generateTrustScore(),
      };
      
      const updatedPatients = sortQueueByPriority([...state.patients, newPatient]);
      
      return {
        ...state,
        patients: updatedPatients,
        tokenCounters: {
          ...state.tokenCounters,
          [department]: newCounter,
        },
        pendingSync: state.isOffline,
      };
    }

    case 'UPDATE_STATUS': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId ? { ...p, status: action.status } : p
      );
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        pendingSync: state.isOffline,
      };
    }

    case 'MARK_EMERGENCY': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId 
          ? { ...p, isEmergency: true, status: 'emergency' as PatientStatus } 
          : p
      );
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        pendingSync: state.isOffline,
      };
    }

    case 'RESOLVE_EMERGENCY': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId 
          ? { ...p, isEmergency: false, status: 'waiting' as PatientStatus } 
          : p
      );
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        pendingSync: state.isOffline,
      };
    }

    case 'MARK_LATE_ARRIVAL': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId ? { ...p, isLateArrival: true } : p
      );
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        pendingSync: state.isOffline,
      };
    }

    case 'ESCALATE': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId ? { ...p, escalationLevel: action.level } : p
      );
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        pendingSync: state.isOffline,
      };
    }

    case 'CALL_NEXT': {
      // Find first waiting patient in department (already sorted by priority)
      const departmentPatients = state.patients.filter(
        p => p.department === action.department && p.status === 'waiting'
      );
      const sorted = sortQueueByPriority(departmentPatients, action.department);
      if (sorted.length === 0) return state;

      const nextPatient = sorted[0];
      const updatedPatients = state.patients.map(p =>
        p.id === nextPatient.id ? { ...p, status: 'called' as PatientStatus } : p
      );
      
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        pendingSync: state.isOffline,
      };
    }

    case 'START_CONSULTATION': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId ? { ...p, status: 'consultation' as PatientStatus } : p
      );
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        pendingSync: state.isOffline,
      };
    }

    case 'COMPLETE_CONSULTATION': {
      const patient = state.patients.find(p => p.id === action.patientId);
      if (!patient) return state;

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
        diagnosis: action.diagnosis || patient.diagnosis,
        prescriptionId: patient.prescriptionId,
        prescriptionStatus: patient.prescriptionId 
          ? state.prescriptions.find(p => p.id === patient.prescriptionId)?.status 
          : undefined,
        status: 'active',
        scanCount: 0,
        createdAt: Date.now(),
      };

      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId 
          ? { 
              ...p, 
              status: 'completed' as PatientStatus, 
              receiptId,
              diagnosis: action.diagnosis || p.diagnosis,
              consultationEndTime: Date.now()
            } 
          : p
      );

      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        receipts: [...state.receipts, newReceipt],
        pendingSync: state.isOffline,
      };
    }

    case 'REMOVE_PATIENT': {
      return {
        ...state,
        patients: state.patients.filter(p => p.id !== action.patientId),
        pendingSync: state.isOffline,
      };
    }

    case 'TRANSFER_DEPARTMENT': {
      const newCounter = state.tokenCounters[action.newDepartment] + 1;
      const newToken = generateTokenNumber(action.newDepartment, newCounter);
      
      const updatedPatients = state.patients.map(p =>
        p.id === action.patientId 
          ? { ...p, department: action.newDepartment, tokenNumber: newToken }
          : p
      );
      
      return {
        ...state,
        patients: sortQueueByPriority(updatedPatients),
        tokenCounters: {
          ...state.tokenCounters,
          [action.newDepartment]: newCounter,
        },
        pendingSync: state.isOffline,
      };
    }

    case 'CREATE_PRESCRIPTION': {
      const updatedPatients = state.patients.map(p =>
        p.id === action.prescription.patientId 
          ? { ...p, prescriptionId: action.prescription.id, diagnosis: action.prescription.diagnosis }
          : p
      );
      
      return {
        ...state,
        prescriptions: [...state.prescriptions, action.prescription],
        patients: updatedPatients,
        pendingSync: state.isOffline,
      };
    }

    case 'VERIFY_PRESCRIPTION': {
      const updatedPrescriptions = state.prescriptions.map(p =>
        p.id === action.prescriptionId 
          ? { ...p, doctorVerified: true, status: 'verified' as PrescriptionStatus }
          : p
      );
      return {
        ...state,
        prescriptions: updatedPrescriptions,
        pendingSync: state.isOffline,
      };
    }

    case 'FORWARD_PRESCRIPTION': {
      const updatedPrescriptions = state.prescriptions.map(p =>
        p.id === action.prescriptionId 
          ? { ...p, status: 'forwarded' as PrescriptionStatus, forwardedAt: Date.now() }
          : p
      );
      return {
        ...state,
        prescriptions: updatedPrescriptions,
        pendingSync: state.isOffline,
      };
    }

    case 'DISPENSE_MEDICINE': {
      const updatedPrescriptions = state.prescriptions.map(p =>
        p.id === action.prescriptionId 
          ? { ...p, status: 'dispensed' as PrescriptionStatus, dispensedAt: Date.now() }
          : p
      );
      
      // Update receipt status if exists
      const prescription = state.prescriptions.find(p => p.id === action.prescriptionId);
      const updatedReceipts = state.receipts.map(r =>
        r.prescriptionId === action.prescriptionId
          ? { ...r, prescriptionStatus: 'dispensed' as PrescriptionStatus }
          : r
      );
      
      return {
        ...state,
        prescriptions: updatedPrescriptions,
        receipts: updatedReceipts,
        pendingSync: state.isOffline,
      };
    }

    case 'SCAN_RECEIPT': {
      const updatedReceipts = state.receipts.map(r => {
        if (r.id === action.receiptId) {
          const newScanCount = r.scanCount + 1;
          return {
            ...r,
            scanCount: newScanCount,
            status: newScanCount > 1 ? 'fulfilled' as const : r.status,
          };
        }
        return r;
      });
      return {
        ...state,
        receipts: updatedReceipts,
      };
    }

    case 'SET_OFFLINE': {
      return {
        ...state,
        isOffline: action.isOffline,
        pendingSync: action.isOffline ? state.pendingSync : false,
      };
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
  registerPatient: (patient: Omit<Patient, 'id' | 'tokenNumber' | 'status' | 'arrivalTime' | 'escalationLevel' | 'isEmergency' | 'isLateArrival' | 'trustScore'>) => string;
  updateStatus: (patientId: string, status: PatientStatus) => void;
  markEmergency: (patientId: string) => void;
  resolveEmergency: (patientId: string) => void;
  markLateArrival: (patientId: string) => void;
  escalate: (patientId: string, level: EscalationLevel) => void;
  callNext: (department: Department) => void;
  startConsultation: (patientId: string) => void;
  completeConsultation: (patientId: string, diagnosis?: string) => void;
  removePatient: (patientId: string) => void;
  transferDepartment: (patientId: string, newDepartment: Department) => void;
  createPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt'>) => string;
  verifyPrescription: (prescriptionId: string) => void;
  forwardPrescription: (prescriptionId: string) => void;
  dispenseMedicine: (prescriptionId: string) => void;
  scanReceipt: (receiptId: string) => VisitReceipt | null;
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
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'healthqueue_state_v2';

// Provider
export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(queueReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure tokenCounters exist
        if (!parsed.tokenCounters) {
          parsed.tokenCounters = initialState.tokenCounters;
        }
        if (!parsed.prescriptions) {
          parsed.prescriptions = [];
        }
        dispatch({ type: 'LOAD_STATE', state: parsed });
      } catch (e) {
        console.error('Failed to load queue state:', e);
      }
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

  const value: QueueContextType = {
    state,
    
    registerPatient: (patient) => {
      const id = uuidv4();
      dispatch({ type: 'REGISTER_PATIENT', payload: patient });
      toast.success(`Patient registered - Token: ${generateTokenNumber(patient.department, state.tokenCounters[patient.department] + 1)}`);
      return id;
    },
    
    updateStatus: (patientId, status) => {
      dispatch({ type: 'UPDATE_STATUS', patientId, status });
    },
    
    markEmergency: (patientId) => {
      dispatch({ type: 'MARK_EMERGENCY', patientId });
      toast.error('🚨 EMERGENCY: Patient marked for immediate attention', {
        duration: 5000,
      });
    },
    
    resolveEmergency: (patientId) => {
      dispatch({ type: 'RESOLVE_EMERGENCY', patientId });
      toast.success('Emergency resolved');
    },
    
    markLateArrival: (patientId) => {
      dispatch({ type: 'MARK_LATE_ARRIVAL', patientId });
      toast.warning('Patient marked as late arrival');
    },
    
    escalate: (patientId, level) => {
      dispatch({ type: 'ESCALATE', patientId, level });
      toast.info(`Priority escalated to level ${level}`);
    },
    
    callNext: (department) => {
      const waiting = state.patients.filter(p => p.department === department && p.status === 'waiting');
      if (waiting.length > 0) {
        const sorted = sortQueueByPriority(waiting, department);
        dispatch({ type: 'CALL_NEXT', department });
        toast.success(`📢 Calling ${sorted[0].name} (${sorted[0].tokenNumber})`);
      } else {
        toast.info('No patients waiting in this department');
      }
    },
    
    startConsultation: (patientId) => {
      dispatch({ type: 'START_CONSULTATION', patientId });
      toast.info('Consultation started');
    },
    
    completeConsultation: (patientId, diagnosis) => {
      dispatch({ type: 'COMPLETE_CONSULTATION', patientId, diagnosis });
      toast.success('Consultation completed - Receipt generated');
    },
    
    removePatient: (patientId) => {
      dispatch({ type: 'REMOVE_PATIENT', patientId });
      toast.info('Patient removed from queue');
    },
    
    transferDepartment: (patientId, newDepartment) => {
      const patient = state.patients.find(p => p.id === patientId);
      const deptInfo = DEPARTMENTS.find(d => d.id === newDepartment);
      dispatch({ type: 'TRANSFER_DEPARTMENT', patientId, newDepartment });
      toast.success(`Patient transferred to ${deptInfo?.name || newDepartment}`);
    },
    
    createPrescription: (prescriptionData) => {
      const id = uuidv4();
      const prescription: Prescription = {
        ...prescriptionData,
        id,
        createdAt: Date.now(),
      };
      dispatch({ type: 'CREATE_PRESCRIPTION', prescription });
      return id;
    },
    
    verifyPrescription: (prescriptionId) => {
      dispatch({ type: 'VERIFY_PRESCRIPTION', prescriptionId });
      toast.success('Prescription verified by doctor');
    },
    
    forwardPrescription: (prescriptionId) => {
      dispatch({ type: 'FORWARD_PRESCRIPTION', prescriptionId });
      toast.success('📤 Prescription forwarded to Medicine Department');
    },
    
    dispenseMedicine: (prescriptionId) => {
      dispatch({ type: 'DISPENSE_MEDICINE', prescriptionId });
      toast.success('✅ Medicines dispensed successfully');
    },
    
    scanReceipt: (receiptId) => {
      const receipt = state.receipts.find(r => r.id === receiptId);
      if (!receipt) return null;
      
      dispatch({ type: 'SCAN_RECEIPT', receiptId });
      
      if (receipt.scanCount >= 1) {
        toast.error('⚠️ FRAUD ALERT: This receipt has already been used!', {
          duration: 5000,
        });
      }
      
      return receipt;
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
      }
    },
    
    canPerformAction,
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
