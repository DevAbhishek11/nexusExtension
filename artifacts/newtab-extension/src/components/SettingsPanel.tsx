import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Settings, Sun, Moon, Monitor, Image, Upload, Sliders, Search,
  Eye, EyeOff, Type, Bell, BellOff, Zap, ZapOff, Download, Upload as UploadIcon, Palette, Trash2
} from "lucide-react";
import { useSettings, useCustomWallpapers, useWallpaperSrc, AppSettings } from "@/store/useStore";

const FONTS = ["Inter", "Poppins", "Playfair Display", "JetBrains Mono"];
const SEARCH_ENGINES = [
  { id: "google", label: "Google" },
  { id: "bing", label: "Bing" },
  { id: "duckduckgo", label: "DuckDuckGo" },
  { id: "brave", label: "Brave" },
  { id: "yahoo", label: "Yahoo" },
];
const WALLPAPER_PRESETS = [
  { name: "Gradient Dark", value: null },
  { name: "Mountain", value: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80" },
  { name: "Ocean", value: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80" },
  { name: "Forest", value: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80" },
  { name: "City Night", value: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80" },
  { name: "Aurora", value: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80" },
];

interface SectionProps { title: string; children: React.ReactNode; }
function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3 font-medium">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
  testId?: string;
}
function ToggleRow({ label, description, value, onChange, icon, testId }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-white/50">{icon}</span>}
        <div>
          <p className="text-white/90 text-sm">{label}</p>
          {description && <p className="text-white/40 text-xs">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? "bg-primary" : "bg-white/20"}`}
        data-testid={testId}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-5.5" : "left-0.5"}`} style={{ left: value ? "1.375rem" : "0.125rem" }} />
      </button>
    </div>
  );
}

interface SliderRowProps { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string; }
function SliderRow({ label, value, min, max, onChange, unit = "" }: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/70 text-xs">{label}</span>
        <span className="text-white/50 text-xs">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </div>
  );
}

// Thumbnail that loads its image from IndexedDB asynchronously
function WallpaperThumb({ id, name, isActive, onSelect, onDelete }: {
  id: string; name: string; isActive: boolean;
  onSelect: () => void; onDelete: () => void;
}) {
  const src = useWallpaperSrc(`custom:${id}`);
  return (
    <div className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all group ${isActive ? "border-primary" : "border-transparent hover:border-white/30"}`}>
      <button className="absolute inset-0 w-full h-full" onClick={onSelect}>
        {src
          ? <img src={src} alt={name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-white/10 animate-pulse" />}
        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-0.5 text-center truncate px-1">{name}</div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white/80 hover:text-red-400 hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete"
      >
        <Trash2 size={10} />
      </button>
      {isActive && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const { customWallpapers, addCustomWallpaper, deleteCustomWallpaper } = useCustomWallpapers();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"appearance" | "widgets" | "wallpaper" | "search">("appearance");
  const [uploadState, setUploadState] = useState<"idle" | "processing" | "error">("idle");

  const handleWallpaperUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.replace(/\.[^.]+$/, "") || `Wallpaper ${Date.now()}`;
    e.target.value = "";
    setUploadState("processing");

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        try {
          // Compress: max 1920×1080, JPEG 75% — reduces 4-8MB photos to ~200-400KB
          const MAX_W = 1920;
          const MAX_H = 1080;
          let { width, height } = img;
          if (width > MAX_W || height > MAX_H) {
            const ratio = Math.min(MAX_W / width, MAX_H / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.75);
          // addCustomWallpaper is now async — saves to IndexedDB
          addCustomWallpaper(name, compressed).then(id => {
            updateSettings({ wallpaper: `custom:${id}` });
            setUploadState("idle");
          }).catch(() => {
            setUploadState("error");
            setTimeout(() => setUploadState("idle"), 3000);
          });
        } catch {
          setUploadState("error");
          setTimeout(() => setUploadState("idle"), 3000);
        }
      };
      img.onerror = () => { setUploadState("error"); setTimeout(() => setUploadState("idle"), 3000); };
      img.src = reader.result as string;
    };
    reader.onerror = () => { setUploadState("error"); setTimeout(() => setUploadState("idle"), 3000); };
    reader.readAsDataURL(file);
  }, [addCustomWallpaper, updateSettings]);

  const exportSettings = () => {
    const data = JSON.stringify({ settings, version: 1 }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newtab-settings.json";
    a.click();
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.settings) updateSettings(parsed.settings);
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  };

  const TABS = [
    { id: "appearance" as const, label: "Look", icon: <Palette size={14} /> },
    { id: "widgets" as const, label: "Widgets", icon: <Settings size={14} /> },
    { id: "wallpaper" as const, label: "Wallpaper", icon: <Image size={14} /> },
    { id: "search" as const, label: "Search", icon: <Search size={14} /> },
  ];


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-end"
          data-testid="settings-overlay"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full max-w-sm glass shadow-2xl flex flex-col"
            style={{ background: "rgba(0, 0, 0, 0.75)" }}
            onClick={e => e.stopPropagation()}
            data-testid="settings-panel"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-white/70" />
                <h2 className="text-white font-semibold">Settings</h2>
              </div>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors" data-testid="close-settings">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-white/10 shrink-0">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${tab === t.id ? "text-white border-b-2 border-primary" : "text-white/40 hover:text-white/70"}`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "appearance" && (
                <>
                  <Section title="Theme">
                    <div className="flex gap-2">
                      {([["light", "Light", <Sun size={14} />], ["dark", "Dark", <Moon size={14} />], ["auto", "Auto", <Monitor size={14} />]] as const).map(([val, label, icon]) => (
                        <button
                          key={val}
                          onClick={() => updateSettings({ theme: val as AppSettings["theme"] })}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs transition-all ${settings.theme === val ? "bg-white/30 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                          data-testid={`theme-${val}`}
                        >
                          {icon}
                          {label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Font">
                    <div className="grid grid-cols-2 gap-2">
                      {FONTS.map(font => (
                        <button
                          key={font}
                          onClick={() => updateSettings({ font })}
                          className={`py-2 px-3 rounded-xl text-sm text-left transition-all ${settings.font === font ? "bg-white/30 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                          style={{ fontFamily: font }}
                          data-testid={`font-${font.replace(/ /g, "-").toLowerCase()}`}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Display">
                    <ToggleRow
                      label="Clean Mode"
                      description="Hide all widgets"
                      value={settings.cleanMode}
                      onChange={v => updateSettings({ cleanMode: v })}
                      icon={settings.cleanMode ? <EyeOff size={14} /> : <Eye size={14} />}
                      testId="toggle-clean-mode"
                    />
                    <ToggleRow
                      label="Sound Effects"
                      value={settings.soundEnabled}
                      onChange={v => updateSettings({ soundEnabled: v })}
                      icon={settings.soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                      testId="toggle-sound"
                    />
                    <ToggleRow
                      label="Performance Mode"
                      description="Reduce animations"
                      value={settings.performanceMode}
                      onChange={v => updateSettings({ performanceMode: v })}
                      icon={settings.performanceMode ? <Zap size={14} /> : <ZapOff size={14} />}
                      testId="toggle-performance"
                    />
                  </Section>

                  <Section title="Data">
                    <div className="flex gap-2">
                      <button onClick={exportSettings} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl text-xs transition-all" data-testid="export-settings">
                        <Download size={12} />
                        Export
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl text-xs transition-all cursor-pointer" data-testid="import-settings-label">
                        <UploadIcon size={12} />
                        Import
                        <input type="file" accept=".json" className="hidden" onChange={importSettings} />
                      </label>
                    </div>
                  </Section>
                </>
              )}

              {tab === "widgets" && (
                <>
                  <Section title="Clock">
                    <ToggleRow label="Show Clock" value={settings.showClock} onChange={v => updateSettings({ showClock: v })} testId="toggle-clock" />
                    <ToggleRow label="Greeting" value={settings.showGreeting} onChange={v => updateSettings({ showGreeting: v })} testId="toggle-greeting" />
                    <ToggleRow label="24-Hour Format" description="Show 13:00 instead of 1:00 PM" value={settings.use24Hour} onChange={v => updateSettings({ use24Hour: v })} testId="toggle-24hr" />
                  </Section>
                  <Section title="Core Widgets">
                    <ToggleRow label="Weather" value={settings.showWeather} onChange={v => updateSettings({ showWeather: v })} testId="toggle-weather" />
                    <ToggleRow label="Quick Links" value={settings.showQuickLinks} onChange={v => updateSettings({ showQuickLinks: v })} testId="toggle-links" />
                    <ToggleRow label="Daily Quote" value={settings.showQuote} onChange={v => updateSettings({ showQuote: v })} testId="toggle-quote" />
                  </Section>
                  <Section title="Productivity Widgets">
                    <ToggleRow label="To-do List" value={settings.showTodo} onChange={v => updateSettings({ showTodo: v })} testId="toggle-todo" />
                    <ToggleRow label="Notes" value={settings.showNotes} onChange={v => updateSettings({ showNotes: v })} testId="toggle-notes" />
                    <ToggleRow label="Pomodoro Timer" value={settings.showPomodoro} onChange={v => updateSettings({ showPomodoro: v })} testId="toggle-pomodoro" />
                    <ToggleRow label="Habit Tracker" description="Track daily habits & streaks" value={settings.showHabits} onChange={v => updateSettings({ showHabits: v })} testId="toggle-habits" />
                    <ToggleRow label="Countdowns" description="Upcoming event timers" value={settings.showCountdown} onChange={v => updateSettings({ showCountdown: v })} testId="toggle-countdown" />
                  </Section>
                  <Section title="Info Widgets">
                    <ToggleRow label="World Clock" description="Multiple timezone clocks" value={settings.showWorldClock} onChange={v => updateSettings({ showWorldClock: v })} testId="toggle-worldclock" />
                  </Section>
                  <Section title="Weather Settings">
                    <div>
                      <label className="text-white/50 text-xs block mb-1">City (leave empty for auto)</label>
                      <input
                        value={settings.weatherCity}
                        onChange={e => updateSettings({ weatherCity: e.target.value })}
                        placeholder="e.g. New York"
                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/40"
                        data-testid="weather-city-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(["celsius", "fahrenheit"] as const).map(unit => (
                        <button
                          key={unit}
                          onClick={() => updateSettings({ weatherUnit: unit })}
                          className={`flex-1 py-2 rounded-xl text-xs transition-all ${settings.weatherUnit === unit ? "bg-white/30 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                          data-testid={`unit-${unit}`}
                        >
                          {unit === "celsius" ? "°C Celsius" : "°F Fahrenheit"}
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {tab === "wallpaper" && (
                <>
                  <Section title="Preset Wallpapers">
                    <div className="grid grid-cols-2 gap-2">
                      {WALLPAPER_PRESETS.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => updateSettings({ wallpaper: preset.value })}
                          className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${settings.wallpaper === preset.value ? "border-primary" : "border-transparent hover:border-white/30"}`}
                          data-testid={`wallpaper-preset-${preset.name.toLowerCase().replace(/ /g, "-")}`}
                        >
                          {preset.value ? (
                            <img src={preset.value} alt={preset.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }} />
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-0.5 text-center">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Upload Wallpaper">
                    <button
                      onClick={() => uploadState === "idle" && fileRef.current?.click()}
                      disabled={uploadState === "processing"}
                      className={`w-full py-3 border-2 border-dashed rounded-xl text-sm transition-all flex items-center justify-center gap-2
                        ${uploadState === "processing" ? "border-white/20 text-white/40 cursor-wait" : ""}
                        ${uploadState === "error" ? "border-red-400/60 text-red-400" : ""}
                        ${uploadState === "idle" ? "border-white/30 hover:border-white/60 text-white/60 hover:text-white cursor-pointer" : ""}
                      `}
                      data-testid="upload-wallpaper-button"
                    >
                      {uploadState === "processing" ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" /> Compressing…</>
                      ) : uploadState === "error" ? (
                        <><Upload size={16} /> Save failed — try a smaller image</>
                      ) : (
                        <><Upload size={16} /> Upload Image</>
                      )}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
                    <p className="text-white/30 text-xs text-center">Images are compressed to fit in browser storage</p>
                  </Section>

                  {customWallpapers.length > 0 && (
                    <Section title="Your Uploads">
                      <div className="grid grid-cols-2 gap-2">
                        {customWallpapers.map(cw => (
                          <WallpaperThumb
                            key={cw.id}
                            id={cw.id}
                            name={cw.name}
                            isActive={settings.wallpaper === `custom:${cw.id}`}
                            onSelect={() => updateSettings({ wallpaper: `custom:${cw.id}` })}
                            onDelete={() => {
                              if (settings.wallpaper === `custom:${cw.id}`) updateSettings({ wallpaper: null });
                              deleteCustomWallpaper(cw.id);
                            }}
                          />
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section title="Adjustments">
                    <SliderRow label="Blur" value={settings.wallpaperBlur} min={0} max={20} onChange={v => updateSettings({ wallpaperBlur: v })} unit="px" />
                    <SliderRow label="Brightness" value={settings.wallpaperBrightness} min={30} max={150} onChange={v => updateSettings({ wallpaperBrightness: v })} unit="%" />
                    <SliderRow label="Overlay Opacity" value={settings.wallpaperOverlayOpacity} min={0} max={90} onChange={v => updateSettings({ wallpaperOverlayOpacity: v })} unit="%" />
                  </Section>
                </>
              )}

              {tab === "search" && (
                <Section title="Search Engine">
                  <div className="space-y-2">
                    {SEARCH_ENGINES.map(engine => (
                      <button
                        key={engine.id}
                        onClick={() => updateSettings({ searchEngine: engine.id })}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${settings.searchEngine === engine.id ? "bg-white/25 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}
                        data-testid={`engine-${engine.id}`}
                      >
                        {engine.label}
                        {settings.searchEngine === engine.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
