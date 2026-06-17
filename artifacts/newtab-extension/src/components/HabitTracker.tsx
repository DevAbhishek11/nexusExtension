import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Flame, Check, ChevronDown, ChevronUp, Trophy } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  completions: string[]; // ISO date strings
}

const STORAGE_KEY = "nt_habits";
const COLORS = ["#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6"];
const EMOJIS = ["💧", "🏃", "📚", "🧘", "💊", "🥗", "😴", "✍️", "🎯", "💪", "🧹", "🎵"];

function today() { return new Date().toISOString().slice(0, 10); }
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}
function dayLabel(iso: string) {
  const d = new Date(iso);
  return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
}

function loadHabits(): Habit[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveHabits(h: Habit[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }

function calcStreak(completions: string[]): number {
  if (completions.length === 0) return 0;
  const sorted = [...completions].sort().reverse();
  let streak = 0;
  let date = new Date();
  for (const d of sorted) {
    const expected = date.toISOString().slice(0, 10);
    if (d === expected) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else break;
  }
  return streak;
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(loadHabits);
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💧");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const last7 = getLast7Days();
  const todayStr = today();

  const toggle = useCallback((habitId: string, date: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== habitId) return h;
        const done = h.completions.includes(date);
        return { ...h, completions: done ? h.completions.filter(d => d !== date) : [...h.completions, date] };
      });
      saveHabits(updated);
      return updated;
    });
  }, []);

  const addHabit = () => {
    if (!newName.trim()) return;
    const h: Habit = { id: Date.now().toString(), name: newName.trim(), emoji: newEmoji, color: newColor, completions: [] };
    const updated = [...habits, h];
    saveHabits(updated);
    setHabits(updated);
    setNewName("");
    setShowAdd(false);
  };

  const deleteHabit = (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    saveHabits(updated);
    setHabits(updated);
  };

  const todayCompleted = habits.filter(h => h.completions.includes(todayStr)).length;
  const allDoneToday = habits.length > 0 && todayCompleted === habits.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
      style={{ minWidth: 280, maxWidth: 340 }}
      data-testid="habit-tracker"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Flame size={15} className="text-orange-400" />
          <span className="text-white font-medium text-sm">Habits</span>
          {habits.length > 0 && (
            <span className="text-xs text-white/40 bg-white/10 rounded-full px-2 py-0.5">
              {todayCompleted}/{habits.length}
            </span>
          )}
          {allDoneToday && <Trophy size={13} className="text-yellow-400 animate-breathe" />}
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Add habit form */}
            <AnimatePresence>
              {showAdd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-3 border-b border-white/10 bg-white/5"
                >
                  <div className="flex gap-2 mb-2">
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Habit name..."
                      onKeyDown={e => e.key === "Enter" && addHabit()}
                      autoFocus
                      className="flex-1 bg-white/10 text-white placeholder:text-white/30 rounded-lg px-3 py-1.5 text-xs outline-none border border-white/20 focus:border-primary"
                    />
                    <button onClick={addHabit} className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg">Add</button>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setNewEmoji(e)}
                        className={`text-base p-1 rounded-lg transition-all ${newEmoji === e ? "bg-white/20 scale-110" : "hover:bg-white/10"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-white/40" : ""}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {habits.length === 0 ? (
              <div className="py-6 text-center text-white/30 text-xs">
                No habits yet. Click + to add one.
              </div>
            ) : (
              <div className="px-4 py-3 space-y-3">
                {/* Day headers */}
                <div className="flex items-center">
                  <div className="flex-1" />
                  {last7.map(d => (
                    <div key={d} className={`w-8 text-center text-[10px] font-medium ${d === todayStr ? "text-primary" : "text-white/30"}`}>
                      {dayLabel(d)}
                    </div>
                  ))}
                  <div className="w-6" />
                </div>

                {habits.map(habit => {
                  const streak = calcStreak(habit.completions);
                  const doneToday = habit.completions.includes(todayStr);
                  return (
                    <div key={habit.id} className="flex items-center group">
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-base">{habit.emoji}</span>
                        <span className="text-white/80 text-xs truncate">{habit.name}</span>
                        {streak > 0 && (
                          <span className="text-orange-400 text-[10px] flex items-center gap-0.5 shrink-0">
                            <Flame size={9} /> {streak}
                          </span>
                        )}
                      </div>
                      {last7.map(d => {
                        const done = habit.completions.includes(d);
                        const isToday = d === todayStr;
                        return (
                          <button
                            key={d}
                            onClick={() => toggle(habit.id, d)}
                            className={`w-8 h-8 flex items-center justify-center transition-all ${
                              done
                                ? "scale-100"
                                : isToday ? "hover:scale-110" : "opacity-40 hover:opacity-70"
                            }`}
                            title={d}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                done ? "shadow-lg" : "border border-white/20 bg-white/5"
                              }`}
                              style={done ? { backgroundColor: habit.color } : {}}
                            >
                              {done && <Check size={10} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
