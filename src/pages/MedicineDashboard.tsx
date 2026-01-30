import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueue } from '@/context/QueueContext';
import { Prescription, DEPARTMENTS } from '@/types/queue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Pill, 
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
  User,
  FileText,
  Printer
} from 'lucide-react';

export default function MedicineDashboard() {
  const [tokenInput, setTokenInput] = useState('');
  const [searchResult, setSearchResult] = useState<Prescription | null>(null);
  const [showDispenseDialog, setShowDispenseDialog] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    getPrescriptionByToken, 
    getForwardedPrescriptions, 
    dispenseMedicine,
    state 
  } = useQueue();
  
  const forwardedPrescriptions = getForwardedPrescriptions();

  const handleSearch = () => {
    setError('');
    setSearchResult(null);
    
    const prescription = getPrescriptionByToken(tokenInput.trim());
    
    if (!prescription) {
      setError('No prescription found for this token number');
      return;
    }
    
    if (prescription.status === 'dispensed') {
      setError('⚠️ ALREADY DISPENSED: This prescription has already been fulfilled!');
      return;
    }
    
    if (prescription.status !== 'forwarded') {
      setError('This prescription has not been forwarded to medicine department yet');
      return;
    }
    
    setSearchResult(prescription);
  };

  const handleDispense = () => {
    if (!searchResult) return;
    dispenseMedicine(searchResult.id);
    setShowDispenseDialog(false);
    setSearchResult(null);
    setTokenInput('');
  };

  const getDeptInfo = (deptId: string) => {
    return DEPARTMENTS.find(d => d.id === deptId);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Pill className="w-5 h-5 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold">Medicine Department</h1>
            </div>
            <p className="text-muted-foreground">
              Verify and dispense medicines for e-prescriptions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Token Lookup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Token Lookup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token">Enter Token Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="token"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                        placeholder="e.g., GM-001"
                        className="font-mono"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 ${
                      error.includes('ALREADY DISPENSED') 
                        ? 'bg-destructive/10 border border-destructive/20' 
                        : 'bg-muted'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        error.includes('ALREADY DISPENSED') ? 'text-destructive' : 'text-muted-foreground'
                      }`} />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {searchResult && (
                    <div className="p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                          Ready to Dispense
                        </Badge>
                        <span className="font-mono text-sm">{searchResult.tokenNumber}</span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{searchResult.patientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{searchResult.diagnosis}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>From: {searchResult.doctorDepartment}</span>
                        </div>
                      </div>

                      <div className="border rounded-lg divide-y mb-4">
                        {searchResult.medicines.map((med, idx) => (
                          <div key={idx} className="p-3">
                            <p className="font-medium text-sm">{med.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {med.dosage} • {med.frequency} • {med.duration}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={() => setShowDispenseDialog(true)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Dispense Medicines
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* E-Prescription Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    E-Prescription Queue
                  </span>
                  <Badge variant="secondary">{forwardedPrescriptions.length} pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {forwardedPrescriptions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending prescriptions</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {forwardedPrescriptions.map((prescription) => (
                      <div 
                        key={prescription.id}
                        className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setTokenInput(prescription.tokenNumber);
                          setSearchResult(prescription);
                          setError('');
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-medium">{prescription.tokenNumber}</span>
                          <Badge variant="secondary" className="text-xs">
                            {prescription.forwardedAt 
                              ? new Date(prescription.forwardedAt).toLocaleTimeString()
                              : 'Pending'}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{prescription.patientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {prescription.medicines.length} medicine(s) • {prescription.doctorDepartment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recently Dispensed */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Recently Dispensed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.prescriptions.filter(p => p.status === 'dispensed').length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No dispensed prescriptions yet</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {state.prescriptions
                    .filter(p => p.status === 'dispensed')
                    .slice(-6)
                    .reverse()
                    .map((prescription) => (
                      <div 
                        key={prescription.id}
                        className="p-3 rounded-lg border bg-green-500/5 border-green-500/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm">{prescription.tokenNumber}</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-sm font-medium">{prescription.patientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {prescription.dispensedAt 
                            ? new Date(prescription.dispensedAt).toLocaleTimeString()
                            : 'Dispensed'}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demo Notice */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
            <strong>Demo Mode:</strong> Medicine dispensing is simulated. 
            Each token can only be redeemed once to prevent fraud.
          </div>
        </motion.div>
      </div>

      {/* Dispense Confirmation Dialog */}
      <Dialog open={showDispenseDialog} onOpenChange={setShowDispenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Medicine Dispensing</DialogTitle>
            <DialogDescription>
              Verify that you have prepared all medicines for this prescription.
            </DialogDescription>
          </DialogHeader>
          
          {searchResult && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted/50 mb-4">
                <p className="font-medium">{searchResult.patientName}</p>
                <p className="text-sm text-muted-foreground font-mono">{searchResult.tokenNumber}</p>
              </div>
              
              <p className="text-sm font-medium mb-2">Medicines to dispense:</p>
              <ul className="space-y-1">
                {searchResult.medicines.map((med, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <Pill className="w-3 h-3 text-muted-foreground" />
                    {med.name} - {med.dosage}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispenseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDispense} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Dispensed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
