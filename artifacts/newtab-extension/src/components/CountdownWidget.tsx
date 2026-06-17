import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Timer, ChevronUp, ChevronDown, Calendar } from "lucide-react";

interface Countdown {
  id: string;
  name: string;
  emoji: string;
  date: string; // ISO datetime string
  color: string;
}

const STORAGE_KEY = "nt_countdowns";
const COLORS = ["#4F46E5", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];
const EMOJIS = ["🎂", "🎉", "✈️", "🏆", "💼", "🎓", "💍", "🏖️", "🎯", "🚀"];

function loadCountdowns(): Countdown[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveCountdowns(c: Countdown[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

function formatDiff(target: Date, now: Date) {
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return { past: true, label: "Passed", days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return { past: false, label: `${days}d ${hours}h ${minutes}m`, days, hours, minutes, seconds };
  if (hours > 0) return { past: false, label: `${hours}h ${minutes}m ${seconds}s`, days, hours, minutes, seconds };
  return { past: false, label: `${minutes}m ${seconds}s`, days, hours, minutes, seconds };
}

function CountdownCard({ cd, now, onDelete }: { cd: Countdown; now: Date; onDelete: () => void }) {
  const target = new Date(cd.date);
  const diff = formatDiff(target, now);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-white/8 rounded-xl p-3 group border border-white/10 hover:border-white/20 transition-all"
    >
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400"
      >
        <X size={12} />
      </button>
      <div className="flex items-start gap-2.5">
        <span className="text-2xl mt-0.5">{cd.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-xs font-medium truncate">{cd.name}</p>
          <p className="text-white/30 text-[10px] mt-0.5">
            {target.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          {diff.past ? (
            <p className="text-white/30 text-xs mt-1.5">Event passed</p>
          ) : (
            <div className="flex items-baseline gap-1 mt-1.5">
              {diff.days > 0 && (
                <>
                  <span className="font-bold text-white text-xl tabular-nums" style={{ color: cd.color }}>{diff.days}</span>
                  <span className="text-white/40 text-xs">d</span>
                </>
              )}
              {diff.days === 0 && diff.hours > 0 && (
                <>
                  <span className="font-bold text-xl tabular-nums" style={{ color: cd.color }}>{diff.hours}</span>
                  <span className="text-white/40 text-xs">h</span>
                  <span className="font-bold text-xl tabular-nums" style={{ color: cd.color }}>{diff.minutes}</span>
                  <span className="text-white/40 text-xs">m</span>
                </>
              )}
              {diff.days === 0 && diff.hours === 0 && (
                <>
                  <span className="font-bold text-xl tabular-nums" style={{ color: cd.color }}>{diff.minutes}</span>
                  <span className="text-white/40 text-xs">m</span>
                  <span className="font-bold text-xl tabular-nums" style={{ color: cd.color }}>{diff.seconds}</span>
                  <span className="text-white/40 text-xs">s</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function CountdownWidget() {
  const [countdowns, setCountdowns] = useState<Countdown[]>(loadCountdowns);
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [emoji, setEmoji] = useState("🎉");
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const addCountdown = () => {
    if (!name.trim() || !date) return;
    const cd: Countdown = { id: Date.now().toString(), name: name.trim(), date, emoji, color };
    const updated = [...countdowns, cd].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    saveCountdowns(updated);
    setCountdowns(updated);
    setName(""); setDate(""); setShowAdd(false);
  };

  const deleteCountdown = (id: string) => {
    const updated = countdowns.filter(c => c.id !== id);
    saveCountdowns(updated);
    setCountdowns(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
      style={{ minWidth: 250, maxWidth: 300 }}
      data-testid="countdown-widget"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-pink-400" />
          <span className="text-white font-medium text-sm">Countdowns</span>
          {countdowns.length > 0 && (
            <span className="text-white/40 text-xs bg-white/10 rounded-full px-1.5 py-0.5">{countdowns.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowAdd(!showAdd)} className="p-1 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10">
            <Plus size={14} />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-white/40 hover:text-white transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <AnimatePresence>
              {showAdd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-white/10 bg-white/5 px-4 py-3 space-y-2"
                >
                  <input
                    value={name} onChange={e => setName(e.target.value)} placeholder="Event name..."
                    className="w-full bg-white/10 text-white placeholder:text-white/30 rounded-lg px-3 py-1.5 text-xs outline-none border border-white/20 focus:border-primary"
                    autoFocus
                  />
                  <input
                    type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full bg-white/10 text-white rounded-lg px-3 py-1.5 text-xs outline-none border border-white/20 focus:border-primary"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setEmoji(e)}
                        className={`text-base p-1 rounded transition-all ${emoji === e ? "bg-white/20 scale-110" : "hover:bg-white/10"}`}>{e}</button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white/40" : ""}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAdd(false)} className="flex-1 py-1.5 bg-white/10 text-white/60 text-xs rounded-lg">Cancel</button>
                    <button onClick={addCountdown} className="flex-1 py-1.5 bg-primary text-white text-xs rounded-lg">Add</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {countdowns.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">No countdowns. Add one!</p>
              ) : (
                <AnimatePresence>
                  {countdowns.map(cd => (
                    <CountdownCard key={cd.id} cd={cd} now={now} onDelete={() => deleteCountdown(cd.id)} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
