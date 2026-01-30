import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { VisitReceipt } from '@/types/queue';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Calendar,
  User,
  Stethoscope,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReceiptCardProps {
  receipt: VisitReceipt;
  onScan?: () => void;
}

const statusConfig = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    className: 'text-success bg-success/10',
  },
  fulfilled: {
    label: 'Already Fulfilled',
    icon: AlertTriangle,
    className: 'text-warning bg-warning/10',
  },
  invalid: {
    label: 'Invalid',
    icon: XCircle,
    className: 'text-destructive bg-destructive/10',
  },
};

export function ReceiptCard({ receipt, onScan }: ReceiptCardProps) {
  const config = statusConfig[receipt.status];
  const StatusIcon = config.icon;
  
  const qrValue = JSON.stringify({
    receiptId: receipt.id,
    patientName: receipt.patientName,
    visitDate: receipt.visitDate,
    status: receipt.status,
  });

  const handleDownload = () => {
    // Create a simple text receipt for demo
    const receiptText = `
╔══════════════════════════════════════════╗
║          HealthQueue+ Receipt            ║
╠══════════════════════════════════════════╣
║                                          ║
║  Patient: ${receipt.patientName.padEnd(28)}║
║  Date: ${format(receipt.visitDate, 'PPP').padEnd(31)}║
║  Time: ${format(receipt.visitDate, 'p').padEnd(31)}║
║  Doctor: ${receipt.doctorRole.padEnd(29)}║
║  Visit Type: ${receipt.visitType.padEnd(25)}║
║  Status: COMPLETED                       ║
║                                          ║
║  Receipt ID: ${receipt.id.slice(0, 8)}...              ║
║                                          ║
╚══════════════════════════════════════════╝
    `;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="gradient-success p-6 text-center">
          <h1 className="text-2xl font-bold text-primary-foreground">HealthQueue+</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Smart Visit Receipt</p>
        </div>

        {/* Status Banner */}
        <div className={cn('flex items-center justify-center gap-2 py-3 px-4', config.className)}>
          <StatusIcon className="w-5 h-5" />
          <span className="font-semibold">{config.label}</span>
          {receipt.scanCount > 0 && (
            <span className="text-sm ml-2">
              (Scanned {receipt.scanCount} time{receipt.scanCount > 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Fraud Alert */}
        {receipt.scanCount > 1 && (
          <div className="bg-destructive/10 border-destructive/20 border-y p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Anti-Fraud Alert</p>
              <p className="text-sm text-destructive/80">
                This receipt has been scanned multiple times. Possible duplicate usage detected.
              </p>
            </div>
          </div>
        )}

        {/* Receipt Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <User className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Patient Name</p>
              <p className="font-semibold">{receipt.patientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Visit Date & Time</p>
              <p className="font-semibold">{format(receipt.visitDate, 'PPP p')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Stethoscope className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Doctor Role</p>
              <p className="font-semibold">{receipt.doctorRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Visit Type</p>
              <p className="font-semibold capitalize">{receipt.visitType}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-6 pt-0">
          <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
            <QRCodeSVG
              value={qrValue}
              size={160}
              level="H"
              includeMargin
            />
            <p className="text-xs text-muted-foreground mt-2">
              Scan to verify receipt
            </p>
            {onScan && (
              <Button
                variant="outline"
                size="sm"
                onClick={onScan}
                className="mt-3"
              >
                Simulate Scan
              </Button>
            )}
          </div>
        </div>

        {/* Receipt ID */}
        <div className="px-6 pb-4">
          <p className="text-xs text-center text-muted-foreground">
            Receipt ID: <span className="font-mono">{receipt.id}</span>
          </p>
        </div>

        {/* Download Button */}
        <div className="p-4 border-t bg-muted/50">
          <Button onClick={handleDownload} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
