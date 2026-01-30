import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useQueue } from '@/context/QueueContext';
import { SymptomSeverity, VisitType, VulnerabilityFlags, Department, DEPARTMENTS, DEPARTMENT_SYMPTOMS } from '@/types/queue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Info, AlertCircle, Stethoscope, Baby, Bone, Heart } from 'lucide-react';

// Validation schema
const patientSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  age: z.number().min(0, 'Age must be positive').max(120, 'Invalid age'),
  department: z.enum(['general_medicine', 'pediatrics', 'orthopedics', 'gynecology']),
  symptom: z.string().min(1, 'Please select a symptom'),
  visitType: z.enum(['routine', 'followup', 'referral']),
});

const departmentIcons: Record<Department, React.ReactNode> = {
  general_medicine: <Stethoscope className="w-5 h-5" />,
  pediatrics: <Baby className="w-5 h-5" />,
  orthopedics: <Bone className="w-5 h-5" />,
  gynecology: <Heart className="w-5 h-5" />,
};

const departmentColors: Record<Department, string> = {
  general_medicine: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  pediatrics: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
  orthopedics: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  gynecology: 'bg-pink-500/10 border-pink-500/30 text-pink-600',
};

export default function PatientRegistration() {
  const navigate = useNavigate();
  const { registerPatient } = useQueue();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [department, setDepartment] = useState<Department>('general_medicine');
  const [symptom, setSymptom] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('routine');
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityFlags>({
    elderly: false,
    pregnant: false,
    disabled: false,
    chronicCondition: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get symptoms for selected department
  const availableSymptoms = DEPARTMENT_SYMPTOMS[department] || [];

  // Get severity from symptom
  const getSymptomSeverity = (): SymptomSeverity => {
    const selected = availableSymptoms.find(s => s.value === symptom);
    return selected?.severity || 'mild';
  };

  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept);
    setSymptom(''); // Reset symptom when department changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = patientSchema.safeParse({
      name: name.trim(),
      age: parseInt(age) || 0,
      department,
      symptom,
      visitType,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    registerPatient({
      name: result.data.name,
      age: result.data.age,
      department: result.data.department as Department,
      symptom: result.data.symptom,
      symptomSeverity: getSymptomSeverity(),
      visitType: result.data.visitType,
      vulnerabilities,
    });

    // Reset form
    setName('');
    setAge('');
    setDepartment('general_medicine');
    setSymptom('');
    setVisitType('routine');
    setVulnerabilities({
      elderly: false,
      pregnant: false,
      disabled: false,
      chronicCondition: false,
    });

    navigate(`/queue?department=${department}`);
  };

  const toggleVulnerability = (key: keyof VulnerabilityFlags) => {
    setVulnerabilities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Patient Registration</CardTitle>
              <CardDescription>
                Register a new patient to join the queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Patient Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter patient name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter age"
                    min="0"
                    max="120"
                    className={errors.age ? 'border-destructive' : ''}
                  />
                  {errors.age && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.age}
                    </p>
                  )}
                </div>

                {/* Department Selection */}
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleDepartmentChange(dept.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          department === dept.id
                            ? departmentColors[dept.id] + ' border-current'
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        {departmentIcons[dept.id]}
                        <span className="text-sm font-medium">{dept.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department-specific Symptoms */}
                <div className="space-y-2">
                  <Label>Symptom / Reason for Visit *</Label>
                  <Select value={symptom} onValueChange={setSymptom}>
                    <SelectTrigger className={errors.symptom ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select symptom" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSymptoms.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.symptom && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.symptom}
                    </p>
                  )}
                </div>

                {/* Visit Type */}
                <div className="space-y-2">
                  <Label>Visit Type *</Label>
                  <Select value={visitType} onValueChange={(v) => setVisitType(v as VisitType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vulnerability Flags */}
                <div className="space-y-3">
                  <Label>Vulnerability Flags (if applicable)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                      <Checkbox
                        checked={vulnerabilities.elderly}
                        onCheckedChange={() => toggleVulnerability('elderly')}
                      />
                      <span className="text-sm">Elderly (60+)</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                      <Checkbox
                        checked={vulnerabilities.pregnant}
                        onCheckedChange={() => toggleVulnerability('pregnant')}
                      />
                      <span className="text-sm">Pregnant</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                      <Checkbox
                        checked={vulnerabilities.disabled}
                        onCheckedChange={() => toggleVulnerability('disabled')}
                      />
                      <span className="text-sm">Disabled</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                      <Checkbox
                        checked={vulnerabilities.chronicCondition}
                        onCheckedChange={() => toggleVulnerability('chronicCondition')}
                      />
                      <span className="text-sm">Chronic Condition</span>
                    </label>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50 text-sm">
                  <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Privacy:</strong> Queue position is determined fairly 
                    by our system. You cannot see or influence your priority score. 
                    This ensures fair treatment for all patients.
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Register & Join Queue
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
