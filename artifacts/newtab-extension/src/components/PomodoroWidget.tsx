import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { useSettings } from "@/store/useStore";

type Phase = "focus" | "break" | "longBreak";

const PHASES: Record<Phase, { label: string; duration: number; color: string }> = {
  focus: { label: "Focus", duration: 25 * 60, color: "text-red-300" },
  break: { label: "Short Break", duration: 5 * 60, color: "text-green-300" },
  longBreak: { label: "Long Break", duration: 15 * 60, color: "text-blue-300" },
};

export function PomodoroWidget() {
  const { settings } = useSettings();
  const [phase, setPhase] = useState<Phase>("focus");
  const [timeLeft, setTimeLeft] = useState(PHASES.focus.duration);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            const next = phase === "focus"
              ? (session + 1) % 4 === 0 ? "longBreak" : "break"
              : "focus";
            if (phase === "focus") setSession(s => s + 1);
            setPhase(next);
            return PHASES[next].duration;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, session]);

  useEffect(() => {
    setTimeLeft(PHASES[phase].duration);
    setRunning(false);
  }, [phase]);

  if (!settings.showPomodoro) return null;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const progress = 1 - timeLeft / PHASES[phase].duration;
  const circumference = 2 * Math.PI * 30;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card rounded-2xl p-4 text-white"
      data-testid="pomodoro-widget"
    >
      <div className="flex items-center gap-2 mb-3">
        <Timer size={16} className="text-white/70" />
        <h3 className="font-medium text-sm">Pomodoro</h3>
        <span className="ml-auto text-xs text-white/50">{session} sessions</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="40" cy="40" r="30"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-mono text-xs font-bold">{minutes}:{seconds}</span>
          </div>
        </div>

        <div className="flex-1">
          <p className={`font-medium text-sm ${PHASES[phase].color}`}>{PHASES[phase].label}</p>
          <div className="flex gap-1 mt-2">
            {(["focus", "break", "longBreak"] as Phase[]).map(p => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`px-2 py-0.5 rounded text-[10px] transition-all ${phase === p ? "bg-white/30 text-white" : "text-white/50 hover:text-white/80"}`}
              >
                {p === "focus" ? "25" : p === "break" ? "5" : "15"}m
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setRunning(r => !r)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs transition-colors"
              data-testid="pomodoro-toggle"
            >
              {running ? <Pause size={12} /> : <Play size={12} />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => { setRunning(false); setTimeLeft(PHASES[phase].duration); }}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              data-testid="pomodoro-reset"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
