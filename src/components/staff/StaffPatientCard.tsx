import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Patient, StaffRole, DEPARTMENTS, Department } from '@/types/queue';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useQueue } from '@/context/QueueContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  ArrowUp,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRightLeft,
} from 'lucide-react';
import { useState } from 'react';

const departmentColors: Record<Department, string> = {
  general_medicine: 'bg-blue-500/10 text-blue-600',
  pediatrics: 'bg-yellow-500/10 text-yellow-600',
  orthopedics: 'bg-orange-500/10 text-orange-600',
  gynecology: 'bg-pink-500/10 text-pink-600',
};

interface StaffPatientCardProps {
  patient: Patient;
  position: number;
  role: StaffRole;
}

export function StaffPatientCard({ patient, position, role }: StaffPatientCardProps) {
  const [showTransfer, setShowTransfer] = useState(false);
  const deptInfo = DEPARTMENTS.find(d => d.id === patient.department);
  
  const {
    markEmergency,
    resolveEmergency,
    markLateArrival,
    escalate,
    updateStatus,
    completeConsultation,
    removePatient,
    transferDepartment,
    canPerformAction,
  } = useQueue();

  const handleTransfer = (newDept: Department) => {
    transferDepartment(patient.id, newDept);
    setShowTransfer(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'p-4 rounded-lg border bg-card',
        patient.isEmergency && 'card-emergency',
        patient.status === 'called' && 'card-called',
        patient.status === 'completed' && 'opacity-50'
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
              patient.isEmergency 
                ? 'bg-emergency text-emergency-foreground' 
                : patient.status === 'called'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}>
              {patient.status === 'completed' ? '✓' : position}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{patient.name}</h3>
                <span className="font-mono text-xs text-muted-foreground">{patient.tokenNumber}</span>
                {patient.isLateArrival && (
                  <span className="text-warning" title="Late Arrival">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Age: {patient.age}</span>
                <span className={cn('px-2 py-0.5 rounded text-xs', departmentColors[patient.department])}>
                  {deptInfo?.name}
                </span>
                <span className="capitalize">{patient.symptomSeverity}</span>
              </div>
            </div>
          </div>

          <StatusBadge status={patient.status} isEmergency={patient.isEmergency} />
        </div>

        {/* Transfer Department UI */}
        {showTransfer && role === 'receptionist' && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Transfer to:</span>
            <Select onValueChange={(val) => handleTransfer(val as Department)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.filter(d => d.id !== patient.department).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => setShowTransfer(false)}>
              Cancel
            </Button>
          </div>
        )}

        {/* Actions based on role */}
        {patient.status !== 'completed' && (
          <div className="flex flex-wrap gap-2">
            {/* Receptionist Actions */}
            {role === 'receptionist' && patient.status === 'waiting' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => escalate(patient.id, 1)}
                  disabled={patient.escalationLevel >= 1}
                >
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Escalate L1
                </Button>
                {!patient.isLateArrival && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markLateArrival(patient.id)}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Mark Late
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTransfer(!showTransfer)}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-1" />
                  Transfer
                </Button>
              </>
            )}

            {/* Nurse Actions */}
            {role === 'nurse' && patient.status === 'waiting' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => escalate(patient.id, 2)}
                  disabled={patient.escalationLevel >= 2}
                >
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Escalate L2
                </Button>
                {!patient.isEmergency && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => markEmergency(patient.id)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Emergency
                  </Button>
                )}
                {!patient.isLateArrival && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markLateArrival(patient.id)}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Mark Late
                  </Button>
                )}
              </>
            )}

            {/* Doctor Actions */}
            {role === 'doctor' && (
              <>
                {patient.status === 'called' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus(patient.id, 'consultation')}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Start Consultation
                  </Button>
                )}
                {patient.status === 'consultation' && (
                  <Button
                    size="sm"
                    className="bg-success hover:bg-success/90"
                    onClick={() => completeConsultation(patient.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete & Generate Receipt
                  </Button>
                )}
                {patient.isEmergency && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveEmergency(patient.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Resolve Emergency
                  </Button>
                )}
              </>
            )}

            {/* View Receipt (for completed patients) */}
            {patient.receiptId && (
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <a href={`/receipt/${patient.receiptId}`}>
                  <FileText className="w-4 h-4 mr-1" />
                  View Receipt
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
