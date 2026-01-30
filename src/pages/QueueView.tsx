import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueue } from '@/context/QueueContext';
import { QueueList } from '@/components/queue/QueueList';
import { Button } from '@/components/ui/button';
import { Department, DEPARTMENTS } from '@/types/queue';
import { UserPlus, Users, AlertTriangle, CheckCircle, Clock, Stethoscope, Baby, Bone, Heart } from 'lucide-react';

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

export default function QueueView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentParam = searchParams.get('department') as Department | null;
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>(
    departmentParam || 'all'
  );
  
  const { getSortedQueue } = useQueue();
  
  const patients = selectedDepartment === 'all' 
    ? getSortedQueue() 
    : getSortedQueue(selectedDepartment);

  const handleDepartmentChange = (dept: Department | 'all') => {
    setSelectedDepartment(dept);
    if (dept === 'all') {
      searchParams.delete('department');
    } else {
      searchParams.set('department', dept);
    }
    setSearchParams(searchParams);
  };

  // Queue stats
  const stats = {
    total: patients.length,
    waiting: patients.filter(p => p.status === 'waiting').length,
    emergency: patients.filter(p => p.isEmergency).length,
    inConsultation: patients.filter(p => p.status === 'consultation').length,
    completed: patients.filter(p => p.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Live Queue</h1>
            <p className="text-muted-foreground">
              Real-time patient queue with estimated wait times
            </p>
          </div>

          {/* Department Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleDepartmentChange('all')}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedDepartment === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-muted-foreground/50'
                }`}
              >
                All Departments
              </button>
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => handleDepartmentChange(dept.id)}
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <div className="bg-card rounded-lg border p-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.waiting}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-emergency" />
              <p className="text-2xl font-bold text-emergency">{stats.emergency}</p>
              <p className="text-xs text-muted-foreground">Emergency</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center">
              <Stethoscope className="w-5 h-5 mx-auto mb-1 text-warning" />
              <p className="text-2xl font-bold text-warning">{stats.inConsultation}</p>
              <p className="text-xs text-muted-foreground">Consulting</p>
            </div>
            <div className="bg-card rounded-lg border p-4 text-center col-span-2 md:col-span-1">
              <CheckCircle className="w-5 h-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold text-success">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          {/* Queue List */}
          <div className="bg-card rounded-xl border p-4 md:p-6">
            <QueueList department={selectedDepartment === 'all' ? undefined : selectedDepartment} />
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/register">
                <UserPlus className="w-5 h-5 mr-2" />
                Register New Patient
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/staff">
                Manage Queue (Staff)
              </Link>
            </Button>
          </div>

          {/* Legend */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-3 text-sm">Status Legend</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="text-muted-foreground">Waiting</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                <span className="text-muted-foreground">Called</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning"></span>
                <span className="text-muted-foreground">In Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emergency"></span>
                <span className="text-muted-foreground">Emergency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-muted"></span>
                <span className="text-muted-foreground">Completed</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
