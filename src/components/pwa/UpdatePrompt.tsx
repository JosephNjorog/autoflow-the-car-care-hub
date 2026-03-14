import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 minutes
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (needRefresh) setShow(true);
  }, [needRefresh]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-2xl">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">Update available</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tap to get the latest version.</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0 hover:bg-primary/90 transition-colors"
        >
          Update
        </button>
        <button
          onClick={() => setShow(false)}
          className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
