import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueue } from '@/context/QueueContext';
import { Department, DEPARTMENTS, Patient, PrescriptionMedicine } from '@/types/queue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateAIPrescription, simulateAIProcessing } from '@/lib/prescription-engine';
import { 
  Phone, 
  Users, 
  AlertTriangle,
  Stethoscope,
  Baby,
  Bone,
  Heart,
  Bot,
  CheckCircle,
  Send,
  FileText,
  Clock,
  Loader2
} from 'lucide-react';

const departmentIcons: Record<Department, React.ReactNode> = {
  general_medicine: <Stethoscope className="w-4 h-4" />,
  pediatrics: <Baby className="w-4 h-4" />,
  orthopedics: <Bone className="w-4 h-4" />,
  gynecology: <Heart className="w-4 h-4" />,
};

const departmentColors: Record<Department, string> = {
  general_medicine: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  pediatrics: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  orthopedics: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  gynecology: 'bg-pink-500/10 text-pink-600 border-pink-500/30',
};

export default function DoctorDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('general_medicine');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedicines, setGeneratedMedicines] = useState<PrescriptionMedicine[]>([]);
  const [prescriptionVerified, setPrescriptionVerified] = useState(false);
  
  const { 
    getSortedQueue, 
    callNext, 
    startConsultation, 
    completeConsultation,
    createPrescription,
    verifyPrescription,
    forwardPrescription,
    state 
  } = useQueue();
  
  const patients = getSortedQueue(selectedDepartment);
  const waitingCount = patients.filter(p => p.status === 'waiting').length;
  const calledPatient = patients.find(p => p.status === 'called');
  const consultingPatient = patients.find(p => p.status === 'consultation');

  const handleCallNext = () => {
    callNext(selectedDepartment);
  };

  const handleStartConsultation = (patient: Patient) => {
    startConsultation(patient.id);
    setSelectedPatient(patient);
    setDiagnosis('');
    setGeneratedMedicines([]);
    setPrescriptionVerified(false);
  };

  const handleGeneratePrescription = async () => {
    if (!diagnosis.trim() || !selectedPatient) return;
    
    setIsGenerating(true);
    await simulateAIProcessing();
    
    const { medicines } = generateAIPrescription(
      diagnosis,
      selectedPatient.age,
      selectedPatient.vulnerabilities,
      selectedPatient.department
    );
    
    setGeneratedMedicines(medicines);
    setIsGenerating(false);
  };

  const handleVerifyPrescription = () => {
    setPrescriptionVerified(true);
  };

  const handleForwardAndComplete = () => {
    if (!selectedPatient) return;
    
    // Create prescription
    const prescriptionId = createPrescription({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      tokenNumber: selectedPatient.tokenNumber,
      department: selectedPatient.department,
      doctorDepartment: DEPARTMENTS.find(d => d.id === selectedDepartment)?.name || 'General',
      diagnosis,
      medicines: generatedMedicines,
      status: 'verified',
      aiGenerated: true,
      doctorVerified: true,
    });
    
    // Forward to medicine dept
    forwardPrescription(prescriptionId);
    
    // Complete consultation
    completeConsultation(selectedPatient.id, diagnosis);
    
    // Reset
    setSelectedPatient(null);
    setDiagnosis('');
    setGeneratedMedicines([]);
    setPrescriptionVerified(false);
  };

  const handleCompleteWithoutPrescription = () => {
    if (!selectedPatient) return;
    completeConsultation(selectedPatient.id, diagnosis || 'General consultation');
    setSelectedPatient(null);
    setDiagnosis('');
    setGeneratedMedicines([]);
    setPrescriptionVerified(false);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Doctor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage consultations and AI-assisted prescriptions
            </p>
          </div>

          {/* Department Selection */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Your Department:</p>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    selectedDepartment === dept.id
                      ? departmentColors[dept.id] + ' border-current'
                      : 'bg-card border-border hover:border-muted-foreground/50'
                  }`}
                >
                  {departmentIcons[dept.id]}
                  <span className="text-sm font-medium">{dept.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Queue Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Patient Queue</span>
                  <Badge variant="secondary">{waitingCount} waiting</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Call Next Button */}
                <Button 
                  onClick={handleCallNext}
                  className="w-full mb-4"
                  disabled={waitingCount === 0 || !!consultingPatient}
                  size="lg"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Next Patient
                </Button>

                {/* Called Patient */}
                {calledPatient && !consultingPatient && (
                  <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-primary">Called</Badge>
                      <span className="font-mono text-sm">{calledPatient.tokenNumber}</span>
                    </div>
                    <p className="font-semibold">{calledPatient.name}</p>
                    <p className="text-sm text-muted-foreground">Age: {calledPatient.age}</p>
                    <Button 
                      onClick={() => handleStartConsultation(calledPatient)}
                      className="w-full mt-3"
                    >
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Start Consultation
                    </Button>
                  </div>
                )}

                {/* Current Consultation */}
                {consultingPatient && (
                  <div className="p-4 rounded-lg border-2 border-warning bg-warning/5 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-warning">In Consultation</Badge>
                      <span className="font-mono text-sm">{consultingPatient.tokenNumber}</span>
                    </div>
                    <p className="font-semibold">{consultingPatient.name}</p>
                    <p className="text-sm text-muted-foreground">Age: {consultingPatient.age}</p>
                    <Button 
                      onClick={() => setSelectedPatient(consultingPatient)}
                      variant="outline"
                      className="w-full mt-3"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Open Prescription Panel
                    </Button>
                  </div>
                )}

                {/* Waiting List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {patients
                    .filter(p => p.status === 'waiting')
                    .slice(0, 5)
                    .map((patient, idx) => (
                      <div key={patient.id} className="p-3 rounded-lg border bg-card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.tokenNumber}</p>
                          </div>
                        </div>
                        {patient.isEmergency && (
                          <AlertTriangle className="w-4 h-4 text-emergency" />
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Prescription Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Prescription Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedPatient ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Start a consultation to generate prescriptions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Patient Info */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedPatient.name}</span>
                        <span className="font-mono text-sm">{selectedPatient.tokenNumber}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Age: {selectedPatient.age} • {selectedPatient.symptom}
                      </p>
                    </div>

                    {/* Diagnosis Input */}
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Main Diagnosis</Label>
                      <Textarea
                        id="diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Enter diagnosis (e.g., Viral fever, Joint pain, etc.)"
                        rows={2}
                      />
                    </div>

                    {/* Generate Button */}
                    <Button 
                      onClick={handleGeneratePrescription}
                      disabled={!diagnosis.trim() || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing medical history...
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 mr-2" />
                          Generate AI Prescription
                        </>
                      )}
                    </Button>

                    {/* Generated Prescription */}
                    {generatedMedicines.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                            AI Suggested
                          </Badge>
                          {prescriptionVerified && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Doctor Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                          {generatedMedicines.map((med, idx) => (
                            <div key={idx} className="p-3">
                              <p className="font-medium text-sm">{med.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {med.dosage} • {med.frequency} • {med.duration}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                📝 {med.instructions}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Verify Button */}
                        {!prescriptionVerified && (
                          <Button 
                            onClick={handleVerifyPrescription}
                            variant="outline"
                            className="w-full"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify Prescription
                          </Button>
                        )}

                        {/* Forward Button */}
                        {prescriptionVerified && (
                          <Button 
                            onClick={handleForwardAndComplete}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Forward to Medicine Dept & Complete
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Complete without Prescription */}
                    <Button 
                      onClick={handleCompleteWithoutPrescription}
                      variant="ghost"
                      className="w-full"
                    >
                      Complete without Prescription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Demo Notice */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
            <strong>Demo Mode:</strong> AI prescriptions are simulated based on keyword matching. 
            No real medical AI is involved.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
