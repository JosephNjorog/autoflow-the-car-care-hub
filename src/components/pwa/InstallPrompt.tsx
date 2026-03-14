import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus } from 'lucide-react';

// Extend the BeforeInstallPromptEvent type (not in standard TS lib)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'afw_install_dismissed';
const DELAY_MS    = 5000;

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream;
}

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow]     = useState(false);
  const [ios, setIos]       = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Never show if: already installed, already dismissed, or not mobile
    if (isStandalone() || localStorage.getItem(STORAGE_KEY) || !isMobile()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // Show after delay — either Android (deferredPrompt will be set) or iOS
    const timer = setTimeout(() => {
      if (isIOS()) {
        setIos(true);
        setShow(true);
      }
      // Android path: show only if beforeinstallprompt fired (checked in separate effect)
    }, DELAY_MS);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      clearTimeout(timer);
    };
  }, []);

  // For Android: show when deferredPrompt becomes available (after the 5s timer)
  useEffect(() => {
    if (!deferredPrompt || localStorage.getItem(STORAGE_KEY) || isStandalone()) return;
    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [deferredPrompt]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const install = async () => {
    if (ios) {
      // iOS: no native API, just dismiss (user follows the on-screen instructions)
      dismiss();
      return;
    }
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, '1'); // accepted — never show again
    }
    setDeferredPrompt(null);
    setShow(false);
    setInstalling(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm"
          style={{ x: '-50%' }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

            {/* Header strip */}
            <div className="flex items-center justify-between px-4 pt-4 pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-xl leading-none">🚗</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">AutoPayKe</p>
                  <p className="text-xs text-muted-foreground">autopayk.app</p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3">
              <p className="text-sm font-medium text-foreground">Add to Home Screen</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {ios
                  ? 'Install AutoPayKe for a faster, full-screen experience — works offline too.'
                  : 'Install AutoPayKe for instant access, offline support, and a native app feel.'}
              </p>

              {/* iOS instructions */}
              {ios && (
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    { icon: <Share className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Tap the Share button in your browser toolbar' },
                    { icon: <Plus className="w-3.5 h-3.5 flex-shrink-0"  />, text: 'Select "Add to Home Screen"' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/50 border border-border">
                      <span className="text-primary">{step.icon}</span>
                      <p className="text-xs text-foreground">{step.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Not now
              </button>
              <button
                onClick={install}
                disabled={installing}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {installing ? 'Installing…' : ios ? 'Got it' : 'Install'}
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
