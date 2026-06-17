import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

interface ClockZone {
  id: string;
  label: string;
  tz: string;
}

const STORAGE_KEY = "nt_worldclocks";
const PRESETS: Omit<ClockZone, "id">[] = [
  { label: "New York", tz: "America/New_York" },
  { label: "London", tz: "Europe/London" },
  { label: "Paris", tz: "Europe/Paris" },
  { label: "Dubai", tz: "Asia/Dubai" },
  { label: "Mumbai", tz: "Asia/Kolkata" },
  { label: "Singapore", tz: "Asia/Singapore" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
  { label: "Los Angeles", tz: "America/Los_Angeles" },
  { label: "São Paulo", tz: "America/Sao_Paulo" },
  { label: "Toronto", tz: "America/Toronto" },
  { label: "Berlin", tz: "Europe/Berlin" },
  { label: "Moscow", tz: "Europe/Moscow" },
  { label: "Shanghai", tz: "Asia/Shanghai" },
  { label: "Seoul", tz: "Asia/Seoul" },
];

function loadClocks(): ClockZone[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && saved.length > 0) return saved;
  } catch {}
  return [
    { id: "1", label: "New York", tz: "America/New_York" },
    { id: "2", label: "London", tz: "Europe/London" },
    { id: "3", label: "Tokyo", tz: "Asia/Tokyo" },
  ];
}
function saveClocks(c: ClockZone[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

function getTime(tz: string) {
  const now = new Date();
  try {
    const str = now.toLocaleTimeString("en-US", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });
    const dateStr = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" });
    const offsetHours = -now.toLocaleString("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
      .split("GMT")[1]?.replace(":30", ".5") || "0";
    return { time: str.slice(0, -3), ampm: str.slice(-2), date: dateStr, offset: offsetHours };
  } catch {
    return { time: "—:——", ampm: "", date: "—", offset: "" };
  }
}

function isDaytime(tz: string) {
  try {
    const h = parseInt(new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", hour12: false }));
    return h >= 6 && h < 20;
  } catch { return true; }
}

export function WorldClock() {
  const [clocks, setClocks] = useState<ClockZone[]>(loadClocks);
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const addClock = (preset: Omit<ClockZone, "id">) => {
    if (clocks.find(c => c.tz === preset.tz)) return;
    const updated = [...clocks, { ...preset, id: Date.now().toString() }];
    saveClocks(updated);
    setClocks(updated);
    setShowAdd(false);
    setSearch("");
  };

  const removeClock = (id: string) => {
    const updated = clocks.filter(c => c.id !== id);
    saveClocks(updated);
    setClocks(updated);
  };

  const filtered = PRESETS.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.tz.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
      style={{ minWidth: 260, maxWidth: 320 }}
      data-testid="world-clock"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-blue-400" />
          <span className="text-white font-medium text-sm">World Clock</span>
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
            {/* Add timezone search */}
            <AnimatePresence>
              {showAdd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-white/10 bg-white/5"
                >
                  <div className="px-3 py-2">
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search city..."
                      autoFocus
                      className="w-full bg-white/10 text-white placeholder:text-white/30 rounded-lg px-3 py-1.5 text-xs outline-none border border-white/20 focus:border-primary"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto pb-2">
                    {filtered.map(p => (
                      <button
                        key={p.tz}
                        onClick={() => addClock(p)}
                        className={`w-full flex items-center justify-between px-4 py-1.5 text-xs hover:bg-white/10 transition-colors ${clocks.find(c => c.tz === p.tz) ? "text-white/30" : "text-white/70 hover:text-white"}`}
                      >
                        <span>{p.label}</span>
                        <span className="text-white/30">{p.tz}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="divide-y divide-white/5">
              {clocks.map(clock => {
                const { time, ampm, date } = getTime(clock.tz);
                const daytime = isDaytime(clock.tz);
                return (
                  <div key={clock.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${daytime ? "bg-yellow-400" : "bg-indigo-400"}`} />
                        <span className="text-white/60 text-xs truncate">{clock.label}</span>
                      </div>
                      <span className="text-white/30 text-[10px]">{date}</span>
                    </div>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-white font-light text-xl tabular-nums">{time}</span>
                      <span className="text-white/40 text-xs">{ampm}</span>
                    </div>
                    <button
                      onClick={() => removeClock(clock.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 shrink-0"
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
