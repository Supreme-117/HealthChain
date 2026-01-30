import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueue } from '@/context/QueueContext';
import { StaffRole, Department, DEPARTMENTS } from '@/types/queue';
import { RoleToggle, RoleInfo } from '@/components/staff/RoleToggle';
import { StaffPatientCard } from '@/components/staff/StaffPatientCard';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Users, 
  AlertTriangle,
  Info,
  Stethoscope,
  Baby,
  Bone,
  Heart
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

export default function StaffDashboard() {
  const [role, setRole] = useState<StaffRole>('receptionist');
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('general_medicine');
  const { getSortedQueue, callNext, state } = useQueue();
  
  // Get patients for selected department (or all for receptionist)
  const patients = role === 'receptionist' 
    ? getSortedQueue() 
    : getSortedQueue(selectedDepartment);
    
  const waitingCount = patients.filter(p => p.status === 'waiting').length;
  const emergencyCount = patients.filter(p => p.isEmergency).length;

  // Calculate positions
  let position = 0;
  const patientsWithPosition = patients.map(patient => {
    if (patient.status !== 'completed') {
      position++;
      return { patient, position };
    }
    return { patient, position: 0 };
  });

  const handleCallNext = () => {
    callNext(selectedDepartment);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Staff Dashboard</h1>
              <p className="text-muted-foreground">
                Manage patient queue based on your role
              </p>
            </div>
            
            <RoleToggle currentRole={role} onRoleChange={setRole} />
          </div>

          {/* Department Selection (for Doctor/Nurse) */}
          {(role === 'doctor' || role === 'nurse') && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Select Department:</p>
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
          )}

          {/* Role Info */}
          <div className="bg-accent/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <RoleInfo role={role} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{waitingCount}</p>
                  <p className="text-sm text-muted-foreground">Waiting</p>
                </div>
              </div>
            </div>
            {emergencyCount > 0 && (
              <div className="bg-emergency/10 rounded-lg border border-emergency/20 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-emergency" />
                  <div>
                    <p className="text-2xl font-bold text-emergency">{emergencyCount}</p>
                    <p className="text-sm text-muted-foreground">Emergency</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Doctor: Call Next Button */}
            {role === 'doctor' && (
              <div className="col-span-2 md:col-span-1">
                <Button 
                  onClick={handleCallNext} 
                  className="w-full h-full min-h-[80px]"
                  disabled={waitingCount === 0}
                >
                  <Phone className="w-6 h-6 mr-2" />
                  Call Next Patient
                </Button>
              </div>
            )}
          </div>

          {/* Patient List */}
          <div className="bg-card rounded-xl border p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">
              Patient Queue
              {role !== 'receptionist' && (
                <span className="text-muted-foreground font-normal text-sm ml-2">
                  ({DEPARTMENTS.find(d => d.id === selectedDepartment)?.name})
                </span>
              )}
            </h2>
            
            {patients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No patients in queue</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {patientsWithPosition.map(({ patient, position }) => (
                    <StaffPatientCard
                      key={patient.id}
                      patient={patient}
                      position={position}
                      role={role}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Demo Notice */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
            <strong>Demo Mode:</strong> Role switching is for demonstration. 
            In production, this would require authentication.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
