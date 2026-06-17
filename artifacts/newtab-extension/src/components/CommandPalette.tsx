import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Settings, Eye, EyeOff, Sun, Moon, Monitor, ExternalLink, Timer, ListTodo, StickyNote, Quote } from "lucide-react";
import { useSettings, useQuickLinks } from "@/store/useStore";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  onOpenSettings: () => void;
}

export function CommandPalette({ onOpenSettings }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const { settings, updateSettings } = useSettings();
  const { quickLinks } = useQuickLinks();

  const commands: Command[] = [
    {
      id: "settings",
      label: "Open Settings",
      icon: <Settings size={14} />,
      action: () => { setOpen(false); onOpenSettings(); },
      category: "App",
    },
    {
      id: "theme-light",
      label: "Switch to Light Mode",
      icon: <Sun size={14} />,
      action: () => { updateSettings({ theme: "light" }); setOpen(false); },
      category: "Theme",
    },
    {
      id: "theme-dark",
      label: "Switch to Dark Mode",
      icon: <Moon size={14} />,
      action: () => { updateSettings({ theme: "dark" }); setOpen(false); },
      category: "Theme",
    },
    {
      id: "theme-auto",
      label: "Auto Theme (System)",
      icon: <Monitor size={14} />,
      action: () => { updateSettings({ theme: "auto" }); setOpen(false); },
      category: "Theme",
    },
    {
      id: "clean-mode",
      label: settings.cleanMode ? "Disable Clean Mode" : "Enable Clean Mode",
      icon: settings.cleanMode ? <Eye size={14} /> : <EyeOff size={14} />,
      action: () => { updateSettings({ cleanMode: !settings.cleanMode }); setOpen(false); },
      category: "App",
    },
    {
      id: "toggle-pomodoro",
      label: settings.showPomodoro ? "Hide Pomodoro Timer" : "Show Pomodoro Timer",
      icon: <Timer size={14} />,
      action: () => { updateSettings({ showPomodoro: !settings.showPomodoro }); setOpen(false); },
      category: "Widgets",
    },
    {
      id: "toggle-todo",
      label: settings.showTodo ? "Hide Tasks" : "Show Tasks",
      icon: <ListTodo size={14} />,
      action: () => { updateSettings({ showTodo: !settings.showTodo }); setOpen(false); },
      category: "Widgets",
    },
    {
      id: "toggle-notes",
      label: settings.showNotes ? "Hide Notes" : "Show Notes",
      icon: <StickyNote size={14} />,
      action: () => { updateSettings({ showNotes: !settings.showNotes }); setOpen(false); },
      category: "Widgets",
    },
    {
      id: "toggle-quote",
      label: settings.showQuote ? "Hide Quote" : "Show Quote",
      icon: <Quote size={14} />,
      action: () => { updateSettings({ showQuote: !settings.showQuote }); setOpen(false); },
      category: "Widgets",
    },
    {
      id: "toggle-habits",
      label: settings.showHabits ? "Hide Habit Tracker" : "Show Habit Tracker",
      icon: <ListTodo size={14} />,
      action: () => { updateSettings({ showHabits: !settings.showHabits }); setOpen(false); },
      category: "Widgets",
    },
    {
      id: "toggle-worldclock",
      label: settings.showWorldClock ? "Hide World Clock" : "Show World Clock",
      icon: <Timer size={14} />,
      action: () => { updateSettings({ showWorldClock: !settings.showWorldClock }); setOpen(false); },
      category: "Widgets",
    },
    {
      id: "toggle-countdown",
      label: settings.showCountdown ? "Hide Countdowns" : "Show Countdowns",
      icon: <Timer size={14} />,
      action: () => { updateSettings({ showCountdown: !settings.showCountdown }); setOpen(false); },
      category: "Widgets",
    },
    {
      id: "toggle-24hr",
      label: settings.use24Hour ? "Switch to 12-Hour Clock" : "Switch to 24-Hour Clock",
      icon: <Timer size={14} />,
      action: () => { updateSettings({ use24Hour: !settings.use24Hour }); setOpen(false); },
      category: "Display",
    },
    {
      id: "toggle-weather",
      label: settings.showWeather ? "Hide Weather" : "Show Weather",
      icon: <StickyNote size={14} />,
      action: () => { updateSettings({ showWeather: !settings.showWeather }); setOpen(false); },
      category: "Widgets",
    },
    ...quickLinks.map(link => ({
      id: "link-" + link.id,
      label: link.title,
      description: link.url,
      icon: <ExternalLink size={14} />,
      action: () => { window.location.href = link.url; setOpen(false); },
      category: "Links",
    })),
  ];

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(o => !o);
      setQuery("");
    }
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      filtered[selected]?.action();
    }
  };

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 command-overlay flex items-start justify-center pt-24"
            onClick={() => setOpen(false)}
            data-testid="command-palette-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="glass rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
              data-testid="command-palette"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Search size={16} className="text-white/50 shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search commands, links..."
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
                  data-testid="command-palette-input"
                />
                <kbd className="text-white/30 text-xs bg-white/10 px-1.5 py-0.5 rounded">ESC</kbd>
              </div>
              <div className="max-h-80 overflow-y-auto py-2">
                {Object.entries(grouped).map(([cat, cmds]) => (
                  <div key={cat}>
                    <p className="px-4 py-1 text-white/30 text-xs font-medium uppercase tracking-wider">{cat}</p>
                    {cmds.map((cmd, i) => {
                      const globalIdx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            selected === globalIdx
                              ? "bg-white/15 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="text-white/50">{cmd.icon}</span>
                          <span className="flex-1 text-sm">{cmd.label}</span>
                          {cmd.description && (
                            <span className="text-white/30 text-xs truncate max-w-[120px]">{cmd.description}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-8">No commands found</p>
                )}
              </div>
              <div className="border-t border-white/10 px-4 py-2 flex items-center gap-4 text-white/30 text-xs">
                <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">↵</kbd> select</span>
                <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">Esc</kbd> close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
