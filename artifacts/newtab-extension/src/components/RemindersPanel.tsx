import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Trash2, Bell, BellOff, Calendar, CheckCircle2,
  AlertCircle, RefreshCw, ChevronRight,
} from "lucide-react";
import { useReminders, type Reminder } from "@/store/useStore";

declare const chrome: any;

const isExtension =
  typeof chrome !== "undefined" && !!chrome?.runtime?.id;

async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function scheduleWebNotification(reminder: Reminder, onFire?: () => void) {
  const delay = reminder.datetime - Date.now();
  if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return null;
  return window.setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(`🔔 ${reminder.title || "Reminder"}`, {
        body: reminder.description || "You have a scheduled reminder!",
        icon: "/favicon.svg",
      });
    }
    onFire?.();
  }, delay);
}

function syncExtensionReminder(reminder: Reminder) {
  if (!isExtension) return;
  try {
    chrome.runtime.sendMessage({ type: "SCHEDULE_REMINDER", reminder });
  } catch { /* extension not available */ }
}

function cancelExtensionReminder(id: string) {
  if (!isExtension) return;
  try {
    chrome.runtime.sendMessage({ type: "CANCEL_REMINDER", reminderId: id });
  } catch { /* extension not available */ }
}

function formatDateTimeLocal(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateTimeLocal(val: string): number {
  return new Date(val).getTime();
}

function formatRelative(ts: number): string {
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return diff < 0 ? "just passed" : "in a moment";
  if (abs < 3600_000) return diff < 0 ? `${Math.round(abs / 60000)}m ago` : `in ${Math.round(abs / 60000)}m`;
  if (abs < 86400_000) return diff < 0 ? `${Math.round(abs / 3600000)}h ago` : `in ${Math.round(abs / 3600000)}h`;
  return diff < 0 ? `${Math.round(abs / 86400000)}d ago` : `in ${Math.round(abs / 86400000)}d`;
}

interface RemindersPanelProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_FORM: Partial<Reminder> = {
  title: "",
  description: "",
  datetime: Date.now() + 60 * 60 * 1000,
  repeat: "none",
  enabled: true,
};

export function RemindersPanel({ open, onClose }: RemindersPanelProps) {
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Reminder>>(DEFAULT_FORM);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const webTimers = useRef<Record<string, number>>({});

  const selectedReminder = selectedId ? reminders.find((r) => r.id === selectedId) : null;

  // Check notification permission on mount
  useEffect(() => {
    if (!("Notification" in window)) {
      setNotifPermission("unsupported");
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Schedule web notifications for all enabled upcoming reminders
  useEffect(() => {
    if (!open) return;
    // Clear old timers
    Object.values(webTimers.current).forEach(clearTimeout);
    webTimers.current = {};

    if (Notification.permission !== "granted") return;

    reminders.forEach((r) => {
      if (!r.enabled || r.datetime <= Date.now()) return;
      const timer = scheduleWebNotification(r, () => {
        updateReminder(r.id, { enabled: r.repeat !== "none" });
      });
      if (timer) webTimers.current[r.id] = timer;
    });

    return () => {
      Object.values(webTimers.current).forEach(clearTimeout);
    };
  }, [open, reminders, updateReminder]);

  // Sync form when selection changes
  useEffect(() => {
    if (selectedReminder) {
      setForm({
        title: selectedReminder.title,
        description: selectedReminder.description,
        datetime: selectedReminder.datetime,
        repeat: selectedReminder.repeat,
        enabled: selectedReminder.enabled,
      });
    } else {
      setForm({ ...DEFAULT_FORM, datetime: Date.now() + 60 * 60 * 1000 });
    }
  }, [selectedId]);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
  };

  const handleSave = useCallback(() => {
    if (!form.title?.trim()) return;
    if (selectedId) {
      updateReminder(selectedId, form as Partial<Reminder>);
      const updated = { ...reminders.find((r) => r.id === selectedId)!, ...form } as Reminder;
      if (updated.enabled) syncExtensionReminder(updated);
      else cancelExtensionReminder(selectedId);
    } else {
      const newR = addReminder(form);
      if (newR.enabled) syncExtensionReminder(newR);
      setSelectedId(newR.id);
    }
  }, [form, selectedId, updateReminder, addReminder, reminders]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    cancelExtensionReminder(selectedId);
    deleteReminder(selectedId);
    setSelectedId(null);
    setForm({ ...DEFAULT_FORM, datetime: Date.now() + 60 * 60 * 1000 });
  }, [selectedId, deleteReminder]);

  const handleToggleEnabled = useCallback((id: string, current: boolean) => {
    updateReminder(id, { enabled: !current });
    const r = reminders.find((x) => x.id === id);
    if (r) {
      if (!current) syncExtensionReminder({ ...r, enabled: true });
      else cancelExtensionReminder(id);
    }
    if (id === selectedId) setForm((f) => ({ ...f, enabled: !current }));
  }, [updateReminder, reminders, selectedId]);

  const upcoming = reminders.filter((r) => r.enabled && r.datetime > Date.now()).length;
  const past = reminders.filter((r) => r.datetime <= Date.now()).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed left-0 top-0 h-full z-50 flex flex-col glass-panel"
            style={{ width: "min(700px, 98vw)", borderRight: "1px solid rgba(255,255,255,0.09)" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.09)" }}
            >
              <Bell size={16} className="text-blue-300/70" />
              <div className="flex-1">
                <h2 className="text-white font-semibold text-sm">Reminders</h2>
                <p className="text-white/30 text-[10px] mt-0.5">
                  {upcoming} upcoming · {past} past
                </p>
              </div>

              {/* Notification permission status */}
              {notifPermission === "default" && (
                <button
                  onClick={handleRequestPermission}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                  style={{ background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}
                >
                  <Bell size={11} /> Enable notifications
                </button>
              )}
              {notifPermission === "granted" && !isExtension && (
                <div className="flex items-center gap-1 text-green-400/70 text-[10px]">
                  <CheckCircle2 size={11} /> Browser notifs on
                </div>
              )}
              {notifPermission === "granted" && isExtension && (
                <div className="flex items-center gap-1 text-green-400/70 text-[10px]">
                  <CheckCircle2 size={11} /> Background notifs on
                </div>
              )}
              {notifPermission === "denied" && (
                <div className="flex items-center gap-1 text-red-400/60 text-[10px]">
                  <AlertCircle size={11} /> Notifications blocked
                </div>
              )}

              <button
                onClick={() => { setSelectedId(null); setForm({ ...DEFAULT_FORM, datetime: Date.now() + 60 * 60 * 1000 }); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(99,102,241,0.8)" }}
              >
                <Plus size={14} /> New
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0">
              {/* Left: list */}
              <div
                className="w-56 flex-shrink-0 flex flex-col overflow-y-auto p-2"
                style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}
              >
                {reminders.length === 0 && (
                  <div className="text-center py-10 px-3">
                    <Bell size={24} className="text-white/15 mx-auto mb-3" />
                    <p className="text-white/28 text-xs">No reminders yet</p>
                    <p className="text-white/18 text-[10px] mt-1">Create your first reminder</p>
                  </div>
                )}
                {reminders.map((r) => {
                  const isPast = r.datetime <= Date.now();
                  const isSelected = r.id === selectedId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border mb-1 ${
                        isSelected ? "border-blue-500/30 bg-blue-500/10" : "border-transparent hover:bg-white/06"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            !r.enabled ? "bg-white/20" : isPast ? "bg-orange-400" : "bg-green-400"
                          }`}
                        />
                        <p className="text-white/88 text-xs font-medium truncate flex-1">{r.title || "Untitled"}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleEnabled(r.id, r.enabled); }}
                          className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors"
                          title={r.enabled ? "Disable" : "Enable"}
                        >
                          {r.enabled ? <Bell size={10} /> : <BellOff size={10} />}
                        </button>
                      </div>
                      <p className="text-white/32 text-[10px] mt-0.5">
                        {formatRelative(r.datetime)}
                      </p>
                      {r.repeat !== "none" && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <RefreshCw size={8} className="text-indigo-400/60" />
                          <span className="text-indigo-400/60 text-[9px]">{r.repeat}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right: form */}
              <div className="flex-1 flex flex-col min-w-0 p-6 overflow-y-auto">
                <h3 className="text-white/60 text-xs font-medium uppercase tracking-widest mb-5">
                  {selectedId ? "Edit Reminder" : "New Reminder"}
                </h3>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-white/45 text-xs font-medium uppercase tracking-wider mb-1.5 block">Title</label>
                    <input
                      value={form.title ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Reminder title..."
                      className="w-full text-white text-sm font-medium outline-none rounded-xl px-4 py-3 placeholder:text-white/22"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)" }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-white/45 text-xs font-medium uppercase tracking-wider mb-1.5 block">Description</label>
                    <textarea
                      value={form.description ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional details..."
                      rows={3}
                      className="w-full text-white/80 text-sm outline-none rounded-xl px-4 py-3 resize-none placeholder:text-white/22"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)" }}
                    />
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="text-white/45 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                      <Calendar size={11} className="inline mr-1.5" />Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formatDateTimeLocal(form.datetime ?? Date.now() + 3600_000)}
                      onChange={(e) => setForm((f) => ({ ...f, datetime: parseDateTimeLocal(e.target.value) }))}
                      className="w-full text-white text-sm outline-none rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.11)",
                        colorScheme: "dark",
                      }}
                    />
                  </div>

                  {/* Repeat */}
                  <div>
                    <label className="text-white/45 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                      <RefreshCw size={11} className="inline mr-1.5" />Repeat
                    </label>
                    <div className="flex gap-2">
                      {(["none", "daily", "weekly"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setForm((f) => ({ ...f, repeat: r }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                            form.repeat === r
                              ? "bg-indigo-500/80 text-white"
                              : "text-white/40 hover:text-white/70 hover:bg-white/08"
                          }`}
                          style={form.repeat !== r ? { border: "1px solid rgba(255,255,255,0.10)" } : {}}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Enable toggle */}
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <div>
                      <p className="text-white/80 text-sm font-medium">Send notification</p>
                      <p className="text-white/35 text-xs mt-0.5">
                        {isExtension ? "Works in background (extension)" : "Works while tab is open"}
                      </p>
                    </div>
                    <button
                      onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
                      className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${form.enabled ? "bg-indigo-500" : "bg-white/20"}`}
                    >
                      <div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                        style={{ left: form.enabled ? "1.5rem" : "0.25rem" }}
                      />
                    </button>
                  </div>

                  {/* Save / Delete */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={!form.title?.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "rgba(99,102,241,0.85)" }}
                    >
                      <ChevronRight size={15} />
                      {selectedId ? "Update Reminder" : "Create Reminder"}
                    </button>
                    {selectedId && (
                      <button
                        onClick={handleDelete}
                        className="px-4 py-3 rounded-xl transition-all text-sm"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.2)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)")}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Info box for non-extension */}
                  {!isExtension && notifPermission === "granted" && (
                    <div
                      className="rounded-xl px-4 py-3 text-xs"
                      style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "rgba(147,197,253,0.8)" }}
                    >
                      <AlertCircle size={12} className="inline mr-1.5" />
                      Notifications fire while this tab is open. Install as a Chrome extension for background reminders that work even when the browser is closed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
