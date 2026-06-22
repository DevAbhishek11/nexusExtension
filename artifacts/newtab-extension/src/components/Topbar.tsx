import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Eye, EyeOff, Sun, Moon, Monitor, Keyboard,
  FileText, Bell
} from "lucide-react";
import { useSettings } from "@/store/useStore";
import { MultiTaskPanel } from "./MultiTaskPanel";
import { AmbientPlayer } from "./AmbientPlayer";
import { DevTools } from "./DevTools";

interface TopbarProps {
  onOpenSettings: () => void;
  onOpenPremium?: () => void;
  onOpenNotes: () => void;
  onOpenReminders: () => void;
}

function useSystemStatus() {
  const [status] = useState(() => ({
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));
  return status;
}

export function Topbar({ onOpenSettings, onOpenPremium, onOpenNotes, onOpenReminders }: TopbarProps) {
  const { settings, updateSettings } = useSettings();
  const [showHint, setShowHint] = useState(false);

  const themeIcons = {
    light: <Sun size={13} />,
    dark: <Moon size={13} />,
    auto: <Monitor size={13} />,
  };

  const themeLabels = { light: "Light", dark: "Dark", auto: "Auto" };

  const cycleTheme = () => {
    const order = ["light", "dark", "auto"] as const;
    const idx = order.indexOf(settings.theme as "light" | "dark" | "auto");
    updateSettings({ theme: order[(idx + 1) % order.length] });
  };

  const SHORTCUTS = [
    { key: "Ctrl+K", desc: "Command palette" },
    { key: "Esc",    desc: "Close dialogs" },
    { key: "Ctrl+/", desc: "Toggle clean mode" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3"
      data-testid="topbar"
    >
      {/* Left — branding */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-indigo-500/30" />
          <span className="text-white/70 text-xs font-medium tracking-wide hidden sm:block">Nexus Tab</span>
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-1.5">
        <DevTools />
        <AmbientPlayer />

        {/* Notes & Quick Notes */}
        <button
          onClick={onOpenNotes}
          className="glass p-2 rounded-full text-white/40 hover:text-yellow-300 transition-all hover:scale-105"
          title="Notes & Quick Notes"
          data-testid="open-notes-button"
        >
          <FileText size={13} />
        </button>

        {/* Reminders */}
        <button
          onClick={onOpenReminders}
          className="glass p-2 rounded-full text-white/40 hover:text-blue-300 transition-all hover:scale-105"
          title="Reminders"
          data-testid="open-reminders-button"
        >
          <Bell size={13} />
        </button>

        <MultiTaskPanel />

        {/* Keyboard shortcuts */}
        <div
          className="relative"
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => setShowHint(false)}
        >
          <button
            className="glass p-2 rounded-full text-white/40 hover:text-white transition-all hover:scale-105"
            data-testid="keyboard-shortcut-hint"
            title="Keyboard shortcuts"
          >
            <Keyboard size={13} />
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-10 right-0 glass rounded-xl px-4 py-3 z-50 shadow-2xl min-w-[200px]"
              >
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Shortcuts</p>
                {SHORTCUTS.map(s => (
                  <div key={s.key} className="flex items-center justify-between gap-4 mb-1.5">
                    <kbd className="bg-white/15 text-white/80 text-[11px] px-1.5 py-0.5 rounded font-mono">{s.key}</kbd>
                    <span className="text-white/60 text-xs">{s.desc}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="glass px-2.5 py-1.5 rounded-full text-white/50 hover:text-white transition-all hover:scale-105 flex items-center gap-1.5"
          data-testid="theme-toggle"
          title={`Theme: ${settings.theme}`}
        >
          {themeIcons[settings.theme as keyof typeof themeIcons]}
          <span className="text-[11px] hidden sm:block">{themeLabels[settings.theme as keyof typeof themeLabels]}</span>
        </button>

        {/* Clean mode */}
        <button
          onClick={() => updateSettings({ cleanMode: !settings.cleanMode })}
          className={`glass p-2 rounded-full transition-all hover:scale-105 ${settings.cleanMode ? "text-indigo-300" : "text-white/40 hover:text-white"}`}
          data-testid="clean-mode-toggle"
          title={settings.cleanMode ? "Show widgets" : "Clean mode"}
        >
          {settings.cleanMode ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="glass p-2 rounded-full text-white/40 hover:text-white transition-all hover:scale-105 hover:rotate-45"
          style={{ transition: "all 0.3s ease" }}
          data-testid="open-settings-button"
          title="Settings"
        >
          <Settings size={13} />
        </button>
      </div>
    </motion.div>
  );
}
