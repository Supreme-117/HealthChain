import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Patient, DEPARTMENTS, Department } from '@/types/queue';
import { StatusBadge } from '@/components/ui/status-badge';
import { Clock, AlertTriangle, Baby, HeartPulse, Accessibility, User, Stethoscope, Bone, Heart } from 'lucide-react';
import { useQueue } from '@/context/QueueContext';

interface PatientCardProps {
  patient: Patient;
  position: number;
  showEstimatedWait?: boolean;
}

const departmentColors: Record<Department, string> = {
  general_medicine: 'bg-blue-500/10 text-blue-600',
  pediatrics: 'bg-yellow-500/10 text-yellow-600',
  orthopedics: 'bg-orange-500/10 text-orange-600',
  gynecology: 'bg-pink-500/10 text-pink-600',
};

export function PatientCard({ patient, position, showEstimatedWait = true }: PatientCardProps) {
  const { getEstimatedWait } = useQueue();
  const estimatedWait = showEstimatedWait ? getEstimatedWait(patient.id) : 0;
  const deptInfo = DEPARTMENTS.find(d => d.id === patient.department);

  const vulnerabilityIcons = [];
  if (patient.vulnerabilities.elderly || patient.age >= 60) {
    vulnerabilityIcons.push({ icon: User, label: 'Elderly' });
  }
  if (patient.vulnerabilities.pregnant) {
    vulnerabilityIcons.push({ icon: Baby, label: 'Pregnant' });
  }
  if (patient.vulnerabilities.disabled) {
    vulnerabilityIcons.push({ icon: Accessibility, label: 'Disabled' });
  }
  if (patient.vulnerabilities.chronicCondition) {
    vulnerabilityIcons.push({ icon: HeartPulse, label: 'Chronic' });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'p-4 rounded-lg border bg-card transition-all duration-300',
        patient.isEmergency && 'card-emergency',
        patient.status === 'called' && 'card-called',
        patient.status === 'completed' && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Queue Position */}
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

          {/* Patient Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{patient.name}</h3>
              <span className="font-mono text-xs text-muted-foreground">{patient.tokenNumber}</span>
              {patient.isLateArrival && (
                <span className="text-warning" title="Late Arrival">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <span>Age: {patient.age}</span>
              <span className={cn('px-2 py-0.5 rounded text-xs', departmentColors[patient.department])}>
                {deptInfo?.name}
              </span>
              {vulnerabilityIcons.length > 0 && (
                <div className="flex items-center gap-1">
                  {vulnerabilityIcons.map(({ icon: Icon, label }) => (
                    <span key={label} title={label} className="text-primary">
                      <Icon className="w-4 h-4" />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={patient.status} isEmergency={patient.isEmergency} />
          
          {showEstimatedWait && patient.status === 'waiting' && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>~{estimatedWait} min</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
