import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useClock } from "@/hooks/useClock";
import { useSettings } from "@/store/useStore";

const digitVariants: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit:    { opacity: 0, y: 12,  transition: { duration: 0.18 } },
};

function AnimatedDigit({ value, className }: { value: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden inline-block ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          variants={digitVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ display: "inline-block" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function Clock() {
  const { time12, time24, ampm, date, greeting, seconds } = useClock();
  const { settings } = useSettings();

  if (!settings.showClock) return null;

  const displayTime = settings.use24Hour ? time24 : time12;
  const [h1, h2, , m1, m2] = displayTime.padStart(5, "0").split("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-center select-none"
      data-testid="clock-widget"
    >
      {settings.showGreeting && (
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-white/65 text-sm font-light uppercase mb-3 tracking-[0.3em] drop-shadow"
        >
          {greeting}
        </motion.p>
      )}

      {/* Clock digits */}
      <div className="flex items-end justify-center gap-0">
        <div className="flex items-end gap-0">
          <span
            className="text-white font-extralight drop-shadow-2xl leading-none tabular-nums"
            style={{
              fontSize: "clamp(4.5rem, 13vw, 10rem)",
              textShadow: "0 2px 40px rgba(0,0,0,0.35), 0 0 80px rgba(99,102,241,0.15)",
              letterSpacing: "-0.02em",
            }}
          >
            <AnimatedDigit value={h1} />
            <AnimatedDigit value={h2} />
          </span>

          {/* Colon */}
          <motion.span
            className="text-white/50 font-extralight leading-none mx-1"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)", marginBottom: "0.05em" }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            :
          </motion.span>

          <span
            className="text-white font-extralight drop-shadow-2xl leading-none tabular-nums"
            style={{
              fontSize: "clamp(4.5rem, 13vw, 10rem)",
              textShadow: "0 2px 40px rgba(0,0,0,0.35), 0 0 80px rgba(99,102,241,0.15)",
              letterSpacing: "-0.02em",
            }}
          >
            <AnimatedDigit value={m1} />
            <AnimatedDigit value={m2} />
          </span>
        </div>

        {!settings.use24Hour && (
          <span
            className="text-white/45 font-light ml-2 mb-1"
            style={{ fontSize: "clamp(1.2rem, 3vw, 2.2rem)" }}
          >
            {ampm}
          </span>
        )}

        {/* Seconds digits */}
        <div className="flex items-end gap-0 ml-2 mb-1.5">
          <motion.span
            className="text-white/25 font-extralight leading-none"
            style={{ fontSize: "clamp(1.4rem, 3.8vw, 3.2rem)", marginBottom: "0.08em" }}
            animate={{ opacity: [0.25, 0.07, 0.25] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            :
          </motion.span>
          <span
            className="text-white/48 font-extralight drop-shadow-lg leading-none tabular-nums"
            style={{
              fontSize: "clamp(1.4rem, 3.8vw, 3.2rem)",
              textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              letterSpacing: "-0.02em",
            }}
          >
            <AnimatedDigit value={seconds[0]} />
            <AnimatedDigit value={seconds[1]} />
          </span>
        </div>
      </div>

      {/* Seconds progress bar */}
      <div className="w-full max-w-sm mx-auto mt-3 mb-2 h-px bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-400/60 to-purple-400/60 rounded-full"
          animate={{ width: `${(Number(seconds) / 60) * 100}%` }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-white/55 text-sm font-light tracking-widest drop-shadow"
        style={{ letterSpacing: "0.12em" }}
      >
        {date}
      </motion.p>
    </motion.div>
  );
}
