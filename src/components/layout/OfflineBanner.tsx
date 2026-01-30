import { motion, AnimatePresence } from 'framer-motion';
import { useQueue } from '@/context/QueueContext';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const { state } = useQueue();

  return (
    <AnimatePresence>
      {state.isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-warning text-warning-foreground overflow-hidden"
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>Offline Mode</span>
            {state.pendingSync && (
              <>
                <span className="mx-2">•</span>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Changes pending sync</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
