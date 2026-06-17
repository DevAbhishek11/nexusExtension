import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Sparkles, Palette, Image as ImageIcon, EyeOff } from "lucide-react";
import { useSettings } from "@/store/useStore";

const BENEFITS = [
  { icon: <EyeOff size={14} />, text: "Remove all ads forever" },
  { icon: <ImageIcon size={14} />, text: "Premium wallpaper library" },
  { icon: <Palette size={14} />, text: "Advanced customization" },
  { icon: <Sparkles size={14} />, text: "Exclusive widget themes" },
  { icon: <Crown size={14} />, text: "Priority feature access" },
];

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  const { updateSettings } = useSettings();

  const handlePayment = () => {
    // In production, this would trigger Razorpay checkout
    // For demo: just mark as premium
    if (typeof window !== "undefined" && (window as typeof window & { Razorpay: unknown }).Razorpay) {
      const options = {
        key: "rzp_test_REPLACE_WITH_KEY",
        amount: 4900,
        currency: "INR",
        name: "NexTab",
        description: "One-time Premium License",
        handler: (response: Record<string, string>) => {
          if (response.razorpay_payment_id) {
            updateSettings({ isPremium: true });
            onClose();
          }
        },
        prefill: {},
        theme: { color: "#4F46E5" },
      };
      const razorpay = new (window as typeof window & { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
      razorpay.open();
    } else {
      // Demo mode - activate premium
      updateSettings({ isPremium: true });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          data-testid="premium-modal-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-3xl p-8 w-full max-w-sm mx-4 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
            data-testid="premium-modal"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-purple-600/10 pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              data-testid="close-premium-modal"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Crown size={28} className="text-white" />
              </div>
              <h2 className="text-white text-2xl font-bold">Go Premium</h2>
              <p className="text-white/60 text-sm mt-1">Unlock the full NexTab experience</p>
            </div>

            <ul className="space-y-3 mb-6">
              {BENEFITS.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                    <Check size={12} />
                  </div>
                  {benefit.text}
                </li>
              ))}
            </ul>

            <div className="bg-white/10 rounded-2xl p-4 text-center mb-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-white/50 text-sm">₹</span>
                <span className="text-white text-4xl font-bold">49</span>
              </div>
              <p className="text-white/50 text-xs mt-1">One-time payment. No subscriptions.</p>
            </div>

            <button
              onClick={handlePayment}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg flex items-center justify-center gap-2"
              data-testid="get-premium-button"
            >
              <Crown size={16} />
              Upgrade for ₹49
            </button>

            <p className="text-white/30 text-xs text-center mt-3">
              Secure payment powered by Razorpay
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
