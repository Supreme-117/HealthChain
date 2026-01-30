-- Create tables for HealthChain

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  department TEXT NOT NULL,
  symptom TEXT NOT NULL,
  symptom_severity TEXT NOT NULL,
  vulnerabilities JSONB DEFAULT '{}'::jsonb,
  visit_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  arrival_time BIGINT NOT NULL,
  escalation_level INTEGER DEFAULT 0,
  is_emergency BOOLEAN DEFAULT FALSE,
  is_late_arrival BOOLEAN DEFAULT FALSE,
  trust_score REAL DEFAULT 50,
  receipt_id UUID,
  consultation_end_time BIGINT,
  diagnosis TEXT,
  prescription_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  token_number TEXT NOT NULL,
  department TEXT NOT NULL,
  doctor_department TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_generated BOOLEAN DEFAULT FALSE,
  doctor_verified BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  forwarded_at BIGINT,
  dispensed_at BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  token_number TEXT NOT NULL,
  department TEXT NOT NULL,
  visit_date BIGINT NOT NULL,
  doctor_role TEXT NOT NULL,
  visit_type TEXT NOT NULL,
  diagnosis TEXT,
  prescription_id UUID REFERENCES prescriptions(id),
  prescription_status TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  scan_count INTEGER DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Token counters table
CREATE TABLE IF NOT EXISTS token_counters (
  department TEXT PRIMARY KEY,
  counter INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize token counters
INSERT INTO token_counters (department, counter) VALUES 
  ('general_medicine', 0),
  ('pediatrics', 0),
  ('orthopedics', 0),
  ('gynecology', 0)
ON CONFLICT (department) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_department ON patients(department);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_token_number ON patients(token_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_receipts_patient_id ON receipts(patient_id);
CREATE INDEX IF NOT EXISTS idx_receipts_token_number ON receipts(token_number);

-- Enable RLS (Row Level Security) for testing (can be configured further)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (consider restricting in production)
CREATE POLICY "Allow all access to patients" ON patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to prescriptions" ON prescriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to receipts" ON receipts
  FOR ALL USING (true) WITH CHECK (true);
