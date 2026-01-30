import { StaffRole } from '@/types/queue';
import { cn } from '@/lib/utils';
import { UserRound, Stethoscope, ClipboardList, Pill } from 'lucide-react';

interface RoleToggleProps {
  currentRole: StaffRole;
  onRoleChange: (role: StaffRole) => void;
}

const roles: { role: StaffRole; label: string; icon: React.ReactNode; description: string }[] = [
  {
    role: 'receptionist',
    label: 'Receptionist',
    icon: <ClipboardList className="w-5 h-5" />,
    description: 'View all queues, low escalation, mark late, transfer departments',
  },
  {
    role: 'nurse',
    label: 'Nurse',
    icon: <UserRound className="w-5 h-5" />,
    description: 'Emergency marking, medium escalation per department',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    icon: <Stethoscope className="w-5 h-5" />,
    description: 'Call patients, consult, prescriptions, generate receipts',
  },
];

export function RoleToggle({ currentRole, onRoleChange }: RoleToggleProps) {
  return (
    <div className="bg-card rounded-lg border p-1 inline-flex gap-1 flex-wrap">
      {roles.map(({ role, label, icon }) => (
        <button
          key={role}
          onClick={() => onRoleChange(role)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            currentRole === role
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function RoleInfo({ role }: { role: StaffRole }) {
  const roleData = roles.find(r => r.role === role);
  if (!roleData) return null;

  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{roleData.label}:</span> {roleData.description}
    </p>
  );
}
