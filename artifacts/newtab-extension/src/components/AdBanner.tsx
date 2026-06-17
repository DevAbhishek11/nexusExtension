import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import { useIdleDetect } from "@/hooks/useIdleDetect";
import { useSettings } from "@/store/useStore";

export function AdBanner({ onUpgrade }: { onUpgrade?: () => void }) {
  const { settings } = useSettings();
  const isIdle = useIdleDetect(90000);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isIdle && !dismissed && !settings.isPremium) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => { clearTimeout(timer); };
    } else {
      setVisible(false);
      return;
    }
  }, [isIdle, dismissed, settings.isPremium]);

  useEffect(() => {
    if (!isIdle) {
      setDismissed(false);
    }
  }, [isIdle]);

  if (settings.isPremium) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 glass-card rounded-2xl px-5 py-3 flex items-center gap-4 shadow-xl"
          data-testid="ad-banner"
        >
          <div className="flex items-center gap-2 text-white/70">
            <Heart size={14} className="text-red-400" />
            <span className="text-sm">Support us to keep this extension free</span>
          </div>
          <button
            onClick={() => { setVisible(false); onUpgrade?.(); }}
            className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity shrink-0"
            data-testid="upgrade-premium-button"
          >
            Go Premium ₹49
          </button>
          <button
            onClick={() => { setVisible(false); setDismissed(true); }}
            className="text-white/40 hover:text-white transition-colors"
            data-testid="dismiss-ad-button"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
