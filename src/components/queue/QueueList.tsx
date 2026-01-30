import { AnimatePresence } from 'framer-motion';
import { useQueue } from '@/context/QueueContext';
import { PatientCard } from './PatientCard';
import { Department } from '@/types/queue';
import { Users } from 'lucide-react';

interface QueueListProps {
  department?: Department;
}

export function QueueList({ department }: QueueListProps) {
  const { getSortedQueue } = useQueue();
  const patients = getSortedQueue(department);

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No patients in queue</p>
        <p className="text-sm">Register a patient to get started</p>
      </div>
    );
  }

  // Calculate positions (excluding completed for numbering)
  let position = 0;
  const patientsWithPosition = patients.map(patient => {
    if (patient.status !== 'completed') {
      position++;
      return { patient, position };
    }
    return { patient, position: 0 };
  });

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {patientsWithPosition.map(({ patient, position }) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            position={position}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
