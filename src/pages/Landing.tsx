import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Shield, 
  Clock, 
  AlertTriangle, 
  FileCheck, 
  Users,
  ArrowRight,
  CheckCircle,
  Stethoscope,
  Baby,
  Bone,
  Heart,
  Pill,
  Bot
} from 'lucide-react';
import { Department, DEPARTMENTS } from '@/types/queue';

const features = [
  {
    icon: Shield,
    title: 'Fair Priority System',
    description: 'Hidden, abuse-resistant scoring ensures equitable treatment for all patients.',
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Handling',
    description: 'Instant prioritization for emergencies with visual alerts across all displays.',
  },
  {
    icon: Bot,
    title: 'AI Prescriptions',
    description: 'AI-powered prescription suggestions with doctor verification workflow.',
  },
  {
    icon: Pill,
    title: 'Medicine Dispensing',
    description: 'Integrated e-prescription forwarding with one-time token redemption.',
  },
];

const benefits = [
  'Multi-department queue management',
  'AI-assisted prescription generation',
  'Token-based medicine dispensing',
  'Works offline with automatic sync',
];

const departmentIcons: Record<Department, React.ReactNode> = {
  general_medicine: <Stethoscope className="w-6 h-6" />,
  pediatrics: <Baby className="w-6 h-6" />,
  orthopedics: <Bone className="w-6 h-6" />,
  gynecology: <Heart className="w-6 h-6" />,
};

const departmentColors: Record<Department, string> = {
  general_medicine: 'bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500/20',
  pediatrics: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/20',
  orthopedics: 'bg-orange-500/10 border-orange-500/30 text-orange-600 hover:bg-orange-500/20',
  gynecology: 'bg-pink-500/10 border-pink-500/30 text-pink-600 hover:bg-pink-500/20',
};

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Multi-Department Hospital Queue System</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Stop Waiting.{' '}
              <span className="text-primary">Start Healing.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              HealthQueue+ transforms chaotic hospital OPDs into organized, fair, and transparent 
              patient-flow systems with AI-powered prescriptions and integrated medicine dispensing.
            </p>

            {/* Department Selector */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4">Select Department:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {DEPARTMENTS.map((dept) => (
                  <Link
                    key={dept.id}
                    to={`/queue?department=${dept.id}`}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${departmentColors[dept.id]}`}
                  >
                    {departmentIcons[dept.id]}
                    <span className="font-medium">{dept.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base">
                <Link to="/register">
                  <Users className="w-5 h-5 mr-2" />
                  Register Patient
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <Link to="/doctor">
                  Doctor Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Complete OPD Management</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From registration to prescription to medicine dispensing — 
              a seamless patient journey across all departments.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-card border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  End-to-End Patient Flow
                </h2>
                <p className="text-muted-foreground mb-6">
                  HealthQueue+ manages the complete patient journey from registration 
                  through consultation to medicine collection, with AI assistance at every step.
                </p>
                <ul className="space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-card rounded-2xl border p-8 shadow-lg">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">AI-Powered Prescriptions</h3>
                  <p className="text-muted-foreground text-sm">
                    AI suggests prescriptions based on diagnosis, patient history, and 
                    department protocols. Doctors verify and forward to pharmacy with one click.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to See It in Action?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              This is a concept prototype demonstrating multi-department queue management, 
              AI prescriptions, and medicine dispensing workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/staff">
                  Staff Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/medicine">
                  Medicine Dept
                  <Pill className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            <strong>HealthQueue+</strong> — Multi-Department Priority Queue & AI Prescription MVP
          </p>
          <p className="mt-2">
            No production claims. For demonstration purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
