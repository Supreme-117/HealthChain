import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueue } from '@/context/QueueContext';
import { ReceiptCard } from '@/components/receipt/ReceiptCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileX } from 'lucide-react';

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { getReceipt, scanReceipt } = useQueue();
  
  const receipt = id ? getReceipt(id) : undefined;

  const handleScan = () => {
    if (id) {
      scanReceipt(id);
    }
  };

  if (!receipt) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-8"
          >
            <FileX className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Receipt Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The receipt you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/queue">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Queue
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 max-w-md mx-auto">
          <Button asChild variant="ghost" size="sm">
            <Link to="/queue">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue
            </Link>
          </Button>
        </div>
        
        <ReceiptCard receipt={receipt} onScan={handleScan} />

        {/* Visit History (Simulated) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto mt-8"
        >
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Visit History</h2>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Visit</span>
                  <span className="text-sm text-success">Completed</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  General Consultation
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg opacity-70">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Previous Visit</span>
                  <span className="text-sm text-muted-foreground">30 days ago</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Follow-up (Simulated)
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg opacity-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Initial Visit</span>
                  <span className="text-sm text-muted-foreground">60 days ago</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Initial Consultation (Simulated)
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Visit history shown for demonstration purposes
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
