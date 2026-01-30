import { cn } from '@/lib/utils';
import { PatientStatus } from '@/types/queue';
import { AlertTriangle, Clock, Phone, Stethoscope, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: PatientStatus;
  isEmergency?: boolean;
  className?: string;
}

const statusConfig: Record<PatientStatus, { label: string; icon: React.ReactNode; className: string }> = {
  waiting: {
    label: 'Waiting',
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-secondary text-secondary-foreground',
  },
  called: {
    label: 'Called',
    icon: <Phone className="w-3.5 h-3.5" />,
    className: 'bg-primary text-primary-foreground animate-pulse-soft',
  },
  consultation: {
    label: 'In Consultation',
    icon: <Stethoscope className="w-3.5 h-3.5" />,
    className: 'bg-warning text-warning-foreground',
  },
  emergency: {
    label: 'EMERGENCY',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    className: 'bg-emergency text-emergency-foreground animate-pulse',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: 'bg-muted text-muted-foreground',
  },
};

export function StatusBadge({ status, isEmergency, className }: StatusBadgeProps) {
  const config = isEmergency ? statusConfig.emergency : statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
