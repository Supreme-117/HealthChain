-- HealthChain Database Schema
-- Tables for patients, prescriptions, receipts, and token counters

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Department enum type
DO $$ BEGIN
  CREATE TYPE department_type AS ENUM ('general_medicine', 'pediatrics', 'orthopedics', 'gynecology');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Patient status enum
DO $$ BEGIN
  CREATE TYPE patient_status AS ENUM ('waiting', 'called', 'consultation', 'emergency', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Symptom severity enum
DO $$ BEGIN
  CREATE TYPE symptom_severity AS ENUM ('mild', 'moderate', 'severe');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Visit type enum
DO $$ BEGIN
  CREATE TYPE visit_type AS ENUM ('routine', 'followup', 'referral');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Prescription status enum
DO $$ BEGIN
  CREATE TYPE prescription_status AS ENUM ('pending', 'verified', 'forwarded', 'dispensed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Receipt status enum
DO $$ BEGIN
  CREATE TYPE receipt_status AS ENUM ('active', 'fulfilled', 'invalid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_number VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  department department_type NOT NULL,
  symptom VARCHAR(100) NOT NULL,
  symptom_severity symptom_severity NOT NULL,
  vulnerability_elderly BOOLEAN DEFAULT false,
  vulnerability_pregnant BOOLEAN DEFAULT false,
  vulnerability_disabled BOOLEAN DEFAULT false,
  vulnerability_chronic_condition BOOLEAN DEFAULT false,
  visit_type visit_type NOT NULL DEFAULT 'routine',
  status patient_status NOT NULL DEFAULT 'waiting',
  arrival_time BIGINT NOT NULL,
  escalation_level INTEGER DEFAULT 0 CHECK (escalation_level >= 0 AND escalation_level <= 2),
  is_emergency BOOLEAN DEFAULT false,
  is_late_arrival BOOLEAN DEFAULT false,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  receipt_id UUID,
  consultation_end_time BIGINT,
  diagnosis TEXT,
  prescription_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  token_number VARCHAR(20) NOT NULL,
  department department_type NOT NULL,
  doctor_department VARCHAR(100) NOT NULL,
  diagnosis TEXT NOT NULL,
  medicines JSONB NOT NULL DEFAULT '[]',
  status prescription_status NOT NULL DEFAULT 'pending',
  ai_generated BOOLEAN DEFAULT false,
  doctor_verified BOOLEAN DEFAULT false,
  forwarded_at BIGINT,
  dispensed_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  token_number VARCHAR(20) NOT NULL,
  department department_type NOT NULL,
  visit_date BIGINT NOT NULL,
  doctor_role VARCHAR(100) NOT NULL,
  visit_type visit_type NOT NULL,
  diagnosis TEXT,
  prescription_id UUID REFERENCES prescriptions(id),
  prescription_status prescription_status,
  status receipt_status NOT NULL DEFAULT 'active',
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token counters table (to track token numbers per department)
CREATE TABLE IF NOT EXISTS token_counters (
  department department_type PRIMARY KEY,
  counter INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize token counters for all departments
INSERT INTO token_counters (department, counter) VALUES
  ('general_medicine', 0),
  ('pediatrics', 0),
  ('orthopedics', 0),
  ('gynecology', 0)
ON CONFLICT (department) DO NOTHING;

-- Add foreign key references
ALTER TABLE patients 
  ADD CONSTRAINT fk_patient_receipt 
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL;

ALTER TABLE patients 
  ADD CONSTRAINT fk_patient_prescription 
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_department ON patients(department);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_token ON patients(token_number);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_receipts_patient ON receipts(patient_id);

-- Enable Row Level Security (but allow all access for now)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_counters ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Allow all access to patients" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to prescriptions" ON prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to receipts" ON receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to token_counters" ON token_counters FOR ALL USING (true) WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_token_counters_updated_at ON token_counters;
CREATE TRIGGER update_token_counters_updated_at
  BEFORE UPDATE ON token_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
