/**
 * HealthQueue+ AI Prescription Engine (Simulated)
 * 
 * This is a DEMO simulation - no real medical AI
 * Generates mock prescriptions based on diagnosis keywords
 */

import { PrescriptionMedicine, Department, VulnerabilityFlags } from '@/types/queue';

// Simulated AI prescription mappings
const PRESCRIPTION_MAPPINGS: Record<string, PrescriptionMedicine[]> = {
  // General Medicine
  'fever': [
    { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'Twice daily', duration: '3 days', instructions: 'Take after meals' },
    { name: 'Oral Rehydration Salts', dosage: '1 sachet', frequency: 'Thrice daily', duration: '3 days', instructions: 'Dissolve in 200ml water' },
  ],
  'cold': [
    { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'Once daily', duration: '5 days', instructions: 'Take at bedtime' },
    { name: 'Vitamin C 500mg', dosage: '500mg', frequency: 'Once daily', duration: '7 days', instructions: 'Take after breakfast' },
  ],
  'headache': [
    { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'As needed', duration: '3 days', instructions: 'Max 3 times per day' },
  ],
  'chest_pain': [
    { name: 'Aspirin 75mg', dosage: '75mg', frequency: 'Once daily', duration: '7 days', instructions: 'Take after breakfast' },
    { name: 'Pantoprazole 40mg', dosage: '40mg', frequency: 'Once daily', duration: '14 days', instructions: 'Take before breakfast' },
  ],
  'breathing': [
    { name: 'Salbutamol Inhaler', dosage: '2 puffs', frequency: 'As needed', duration: '14 days', instructions: 'Max 4 times per day' },
    { name: 'Montelukast 10mg', dosage: '10mg', frequency: 'Once daily', duration: '14 days', instructions: 'Take at bedtime' },
  ],
  
  // Pediatrics
  'vaccination': [
    { name: 'Multivitamin Syrup', dosage: '5ml', frequency: 'Once daily', duration: '30 days', instructions: 'After breakfast' },
  ],
  'rashes': [
    { name: 'Cetirizine Syrup', dosage: '2.5ml', frequency: 'Once daily', duration: '5 days', instructions: 'Before bedtime' },
    { name: 'Calamine Lotion', dosage: 'Apply thin layer', frequency: 'Twice daily', duration: '7 days', instructions: 'Apply on affected area' },
  ],
  'respiratory': [
    { name: 'Ambroxol Syrup', dosage: '5ml', frequency: 'Thrice daily', duration: '5 days', instructions: 'After meals' },
    { name: 'Paracetamol Syrup', dosage: '5ml', frequency: 'As needed', duration: '3 days', instructions: 'For fever above 100°F' },
  ],
  
  // Orthopedics
  'joint_pain': [
    { name: 'Diclofenac 50mg', dosage: '50mg', frequency: 'Twice daily', duration: '7 days', instructions: 'Take after meals' },
    { name: 'Calcium + Vitamin D3', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Take after dinner' },
  ],
  'back_pain': [
    { name: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Thrice daily', duration: '5 days', instructions: 'Take after meals' },
    { name: 'Muscle Relaxant (Thiocolchicoside)', dosage: '4mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' },
  ],
  'fracture': [
    { name: 'Calcium + Vitamin D3', dosage: '1 tablet', frequency: 'Twice daily', duration: '60 days', instructions: 'Take after meals' },
    { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'As needed', duration: '7 days', instructions: 'For pain relief' },
  ],
  'sprain': [
    { name: 'Diclofenac Gel', dosage: 'Apply thin layer', frequency: 'Thrice daily', duration: '7 days', instructions: 'Apply on affected area' },
    { name: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' },
  ],
  
  // Gynecology
  'prenatal': [
    { name: 'Folic Acid 5mg', dosage: '5mg', frequency: 'Once daily', duration: '90 days', instructions: 'Take after breakfast' },
    { name: 'Iron + Folic Acid', dosage: '1 tablet', frequency: 'Once daily', duration: '90 days', instructions: 'Take after lunch' },
    { name: 'Calcium 500mg', dosage: '500mg', frequency: 'Twice daily', duration: '90 days', instructions: 'Take after meals' },
  ],
  'menstrual': [
    { name: 'Mefenamic Acid 500mg', dosage: '500mg', frequency: 'Thrice daily', duration: '5 days', instructions: 'Take after meals' },
    { name: 'Iron Supplement', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Take after lunch' },
  ],
  'postnatal': [
    { name: 'Calcium + Vitamin D3', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', instructions: 'Take after meals' },
    { name: 'Multivitamin', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Take after breakfast' },
  ],
};

// Default prescription for unrecognized conditions
const DEFAULT_PRESCRIPTION: PrescriptionMedicine[] = [
  { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'As needed', duration: '3 days', instructions: 'Take after meals' },
  { name: 'Multivitamin', dosage: '1 tablet', frequency: 'Once daily', duration: '7 days', instructions: 'Take after breakfast' },
];

/**
 * Simulate AI prescription generation
 * Returns prescription medicines based on diagnosis keywords
 */
export function generateAIPrescription(
  diagnosis: string,
  _age: number,
  _vulnerabilities: VulnerabilityFlags,
  _department: Department
): { medicines: PrescriptionMedicine[]; confidence: number } {
  const lowerDiagnosis = diagnosis.toLowerCase();
  
  // Find matching prescription based on keywords
  for (const [keyword, medicines] of Object.entries(PRESCRIPTION_MAPPINGS)) {
    if (lowerDiagnosis.includes(keyword)) {
      return {
        medicines,
        confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence (simulated)
      };
    }
  }
  
  // Return default prescription if no match
  return {
    medicines: DEFAULT_PRESCRIPTION,
    confidence: 0.70, // Lower confidence for default
  };
}

/**
 * Simulate AI processing delay
 */
export function simulateAIProcessing(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1500 + Math.random() * 1000); // 1.5-2.5 seconds
  });
}

/**
 * Format prescription for display
 */
export function formatPrescriptionText(medicines: PrescriptionMedicine[]): string {
  return medicines.map((med, index) => 
    `${index + 1}. ${med.name}\n   Dosage: ${med.dosage}\n   Frequency: ${med.frequency}\n   Duration: ${med.duration}\n   Instructions: ${med.instructions}`
  ).join('\n\n');
}
