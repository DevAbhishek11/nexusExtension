import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallpaper } from "@/components/Wallpaper";
import { NotesPanel } from "@/components/NotesPanel";
import { RemindersPanel } from "@/components/RemindersPanel";
import { Clock } from "@/components/Clock";
import { SearchBar } from "@/components/SearchBar";
import { WeatherWidget } from "@/components/WeatherWidget";
import { QuickLinks } from "@/components/QuickLinks";
import { TodoWidget } from "@/components/TodoWidget";
import { NotesWidget } from "@/components/NotesWidget";
import { PomodoroWidget } from "@/components/PomodoroWidget";
import { QuoteWidget } from "@/components/QuoteWidget";
import { CommandPalette } from "@/components/CommandPalette";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AdBanner } from "@/components/AdBanner";
import { Topbar } from "@/components/Topbar";
import { MultiTaskPanel } from "@/components/MultiTaskPanel";
import { PremiumModal } from "@/components/PremiumModal";
import { DevTools } from "@/components/DevTools";
import { HabitTracker } from "@/components/HabitTracker";
import { WorldClock } from "@/components/WorldClock";
import { AmbientPlayer } from "@/components/AmbientPlayer";
import { CountdownWidget } from "@/components/CountdownWidget";
import { useSettings } from "@/store/useStore";
import { useTheme } from "@/hooks/useTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 22 },
  },
};

export function NewTab() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const { settings } = useSettings();
  useTheme();

  const hasTopWidgets =
    settings.showWeather ||
    settings.showPomodoro ||
    settings.showTodo ||
    settings.showNotes;

  const hasBottomWidgets =
    settings.showHabits ||
    settings.showWorldClock ||
    settings.showCountdown;

  return (
    <div className="min-h-screen w-full overflow-hidden relative" data-testid="newtab-page">
      <Wallpaper />

      <Topbar
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPremium={() => setPremiumOpen(true)}
        onOpenNotes={() => setNotesOpen(true)}
        onOpenReminders={() => setRemindersOpen(true)}
      />

      <main className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <AnimatePresence mode="wait">
          {!settings.cleanMode ? (
            <motion.div
              key="full"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
              className="w-full max-w-5xl flex flex-col items-center gap-6"
            >
              {/* Clock */}
              <motion.div variants={itemVariants} className="w-full flex justify-center">
                <Clock />
              </motion.div>

              {/* Search */}
              <motion.div variants={itemVariants} className="w-full flex justify-center">
                <SearchBar />
              </motion.div>

              {/* Top widgets row: weather, pomodoro, todo, notes */}
              {hasTopWidgets && (
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap gap-4 justify-center w-full"
                >
                  {settings.showWeather && <WeatherWidget />}
                  {settings.showPomodoro && <PomodoroWidget />}
                  {settings.showTodo && <TodoWidget />}
                  {settings.showNotes && <NotesWidget />}
                </motion.div>
              )}

              {/* Quick Links */}
              {settings.showQuickLinks && (
                <motion.div variants={itemVariants} className="w-full">
                  <QuickLinks />
                </motion.div>
              )}

              {/* Bottom widgets row: habits, world clock, countdowns */}
              {hasBottomWidgets && (
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap gap-4 justify-center w-full"
                >
                  {settings.showHabits && <HabitTracker />}
                  {settings.showWorldClock && <WorldClock />}
                  {settings.showCountdown && <CountdownWidget />}
                </motion.div>
              )}

              {/* Quote */}
              {settings.showQuote && (
                <motion.div variants={itemVariants} className="w-full flex justify-center">
                  <QuoteWidget />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="clean"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-2xl flex flex-col items-center gap-6"
            >
              <Clock />
              <SearchBar />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CommandPalette onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NotesPanel open={notesOpen} onClose={() => setNotesOpen(false)} />
      <RemindersPanel open={remindersOpen} onClose={() => setRemindersOpen(false)} />
      <AdBanner onUpgrade={() => setPremiumOpen(true)} />
      <PremiumModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  );
}
