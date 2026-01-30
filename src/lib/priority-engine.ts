/**
 * HealthQueue+ Priority Engine - Multi-Department System
 * 
 * STRICTLY INTERNAL - No formulas, weights, or logic should be exposed to UI
 * This module handles fair, abuse-resistant queue prioritization per department
 */

import { Patient, SymptomSeverity, VulnerabilityFlags, EscalationLevel, Department } from '@/types/queue';

// Internal weights - NEVER expose these
const WEIGHTS = {
  // Age factors (hidden)
  AGE_ELDERLY_THRESHOLD: 60,
  AGE_CHILD_THRESHOLD: 5,
  
  // Symptom severity caps (hidden) - self-reported claims are bounded
  SEVERITY_CAP: {
    mild: 10,
    moderate: 25,
    severe: 40,
  },
  
  // Vulnerability bonuses (hidden)
  VULNERABILITY: {
    elderly: 15,
    pregnant: 20,
    disabled: 15,
    chronicCondition: 10,
  },
  
  // Time-based fairness (hidden)
  WAIT_TIME_FACTOR: 0.5, // points per minute waiting
  MAX_WAIT_BONUS: 50,
  
  // Trust influence (hidden) - never dominates
  TRUST_FACTOR: 0.1,
  
  // Escalation boosts (hidden) - bounded
  ESCALATION: {
    0: 0,
    1: 10, // Receptionist escalation
    2: 25, // Nurse escalation
  },
  
  // Visit type modifiers (hidden)
  VISIT_TYPE: {
    routine: 0,
    followup: 5,
    referral: 10,
  },
  
  // Late arrival penalty (hidden)
  LATE_PENALTY: 15,
};

/**
 * Calculate internal priority score
 * HIDDEN from all UI - only used for queue ordering
 */
function calculatePriorityScore(patient: Patient): number {
  let score = 0;
  
  // Base severity score (capped to prevent abuse)
  score += WEIGHTS.SEVERITY_CAP[patient.symptomSeverity];
  
  // Age-based priority
  if (patient.age >= WEIGHTS.AGE_ELDERLY_THRESHOLD) {
    score += WEIGHTS.VULNERABILITY.elderly;
  } else if (patient.age <= WEIGHTS.AGE_CHILD_THRESHOLD) {
    score += 12; // Children get priority but less than elderly
  }
  
  // Vulnerability flags
  Object.entries(patient.vulnerabilities).forEach(([key, value]) => {
    if (value && key in WEIGHTS.VULNERABILITY) {
      score += WEIGHTS.VULNERABILITY[key as keyof typeof WEIGHTS.VULNERABILITY];
    }
  });
  
  // Wait time fairness (increasing priority over time)
  const waitMinutes = (Date.now() - patient.arrivalTime) / (1000 * 60);
  const waitBonus = Math.min(waitMinutes * WEIGHTS.WAIT_TIME_FACTOR, WEIGHTS.MAX_WAIT_BONUS);
  score += waitBonus;
  
  // Trust factor (simulated, bounded influence)
  score += patient.trustScore * WEIGHTS.TRUST_FACTOR;
  
  // Staff escalation (bounded boost)
  score += WEIGHTS.ESCALATION[patient.escalationLevel];
  
  // Visit type modifier
  score += WEIGHTS.VISIT_TYPE[patient.visitType];
  
  // Late arrival penalty
  if (patient.isLateArrival) {
    score -= WEIGHTS.LATE_PENALTY;
  }
  
  return Math.max(0, score);
}

/**
 * Sort patients by queue priority within a specific department
 * Order: Emergency > Called > Consultation > Priority Score > Arrival Time
 */
export function sortQueueByPriority(patients: Patient[], department?: Department): Patient[] {
  // Filter by department if specified
  const filtered = department 
    ? patients.filter(p => p.department === department)
    : patients;
  
  // Filter out completed patients for sorting, they stay at bottom
  const active = filtered.filter(p => p.status !== 'completed');
  const completed = filtered.filter(p => p.status === 'completed');
  
  const sorted = [...active].sort((a, b) => {
    // Called patient always at top
    if (a.status === 'called' && b.status !== 'called') return -1;
    if (b.status === 'called' && a.status !== 'called') return 1;
    
    // In consultation next
    if (a.status === 'consultation' && b.status !== 'consultation') return -1;
    if (b.status === 'consultation' && a.status !== 'consultation') return 1;
    
    // Emergency overrides all numeric logic
    if (a.isEmergency && !b.isEmergency) return -1;
    if (b.isEmergency && !a.isEmergency) return 1;
    
    // Priority score (hidden)
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);
    
    if (scoreB !== scoreA) {
      return scoreB - scoreA; // Higher score = higher priority
    }
    
    // Tiebreaker: earlier arrival
    return a.arrivalTime - b.arrivalTime;
  });
  
  // Completed patients at the end
  return [...sorted, ...completed];
}

/**
 * Estimate wait time (simulated) for a specific department
 * Returns minutes
 */
export function estimateWaitTime(patient: Patient, queue: Patient[]): number {
  const departmentQueue = queue.filter(p => p.department === patient.department);
  const sorted = sortQueueByPriority(
    departmentQueue.filter(p => 
      p.status === 'waiting' || p.status === 'called' || p.status === 'consultation'
    ),
    patient.department
  );
  
  const position = sorted.findIndex(p => p.id === patient.id);
  if (position === -1) return 0;
  
  // Simulate: ~8-12 minutes per patient ahead
  const avgTime = 10;
  const variance = Math.random() * 4 - 2; // ±2 minutes variance
  
  return Math.max(0, Math.round(position * avgTime + variance));
}

/**
 * Generate initial trust score (simulated)
 * In production, this would be based on visit history
 */
export function generateTrustScore(): number {
  // Simulate trust score distribution
  // Most patients have moderate trust (60-80)
  const base = 70;
  const variance = (Math.random() - 0.5) * 40;
  return Math.min(100, Math.max(0, Math.round(base + variance)));
}

/**
 * Generate token number for a department
 */
export function generateTokenNumber(department: Department, counter: number): string {
  const prefixes: Record<Department, string> = {
    general_medicine: 'GM',
    pediatrics: 'PD',
    orthopedics: 'OR',
    gynecology: 'GY',
  };
  
  return `${prefixes[department]}-${String(counter).padStart(3, '0')}`;
}

/**
 * Check if patient should be auto-removed (no-show)
 */
export function checkNoShow(patient: Patient, thresholdMinutes: number = 30): boolean {
  if (patient.status !== 'waiting') return false;
  
  const waitMinutes = (Date.now() - patient.arrivalTime) / (1000 * 60);
  return waitMinutes > thresholdMinutes && patient.isLateArrival;
}
