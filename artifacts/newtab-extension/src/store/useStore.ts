import { useState, useEffect, useCallback } from "react";

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  category?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  content: string;
  updatedAt: number;
}

export interface WorkspacePanel {
  id: string;
  url: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "auto";
  font: string;
  searchEngine: string;
  wallpaper: string | null;
  wallpaperBlur: number;
  wallpaperBrightness: number;
  wallpaperOverlayOpacity: number;
  showWeather: boolean;
  showClock: boolean;
  showGreeting: boolean;
  showQuickLinks: boolean;
  showTodo: boolean;
  showNotes: boolean;
  showPomodoro: boolean;
  showQuote: boolean;
  cleanMode: boolean;
  weatherCity: string;
  weatherUnit: "celsius" | "fahrenheit";
  accentColor: string;
  isPremium: boolean;
  soundEnabled: boolean;
  performanceMode: boolean;
  use24Hour: boolean;
  showHabits: boolean;
  showWorldClock: boolean;
  showCountdown: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "auto",
  font: "Inter",
  searchEngine: "google",
  wallpaper: null,
  wallpaperBlur: 0,
  wallpaperBrightness: 100,
  wallpaperOverlayOpacity: 30,
  showWeather: true,
  showClock: true,
  showGreeting: true,
  showQuickLinks: true,
  showTodo: false,
  showNotes: false,
  showPomodoro: false,
  showQuote: true,
  cleanMode: false,
  weatherCity: "",
  weatherUnit: "celsius",
  accentColor: "blue",
  isPremium: false,
  soundEnabled: false,
  performanceMode: false,
  use24Hour: false,
  showHabits: false,
  showWorldClock: false,
  showCountdown: false,
};

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: "1", title: "Gmail", url: "https://mail.google.com", icon: "https://www.google.com/favicon.ico", category: "Work" },
  { id: "2", title: "YouTube", url: "https://youtube.com", icon: "https://youtube.com/favicon.ico", category: "Entertainment" },
  { id: "3", title: "GitHub", url: "https://github.com", icon: "https://github.com/favicon.ico", category: "Work" },
  { id: "4", title: "Twitter", url: "https://twitter.com", icon: "https://twitter.com/favicon.ico", category: "Social" },
  { id: "5", title: "Reddit", url: "https://reddit.com", icon: "https://reddit.com/favicon.ico", category: "Social" },
  { id: "6", title: "Notion", url: "https://notion.so", icon: "https://notion.so/favicon.ico", category: "Work" },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

// CustomWallpaper metadata only — image data lives in IndexedDB, not localStorage
export interface CustomWallpaper {
  id: string;
  name: string;
  addedAt: number;
}

// Global state - simple singleton approach for performance
let _settings: AppSettings = loadFromStorage("nt_settings", DEFAULT_SETTINGS);
let _quickLinks: QuickLink[] = loadFromStorage("nt_links", DEFAULT_QUICK_LINKS);
let _todos: TodoItem[] = loadFromStorage("nt_todos", []);
let _note: Note = loadFromStorage("nt_note", { id: "1", content: "", updatedAt: Date.now() });
let _customWallpapers: CustomWallpaper[] = loadFromStorage("nt_custom_wallpapers", []);

const listeners = new Set<() => void>();
function notify() { listeners.forEach(l => l()); }

export function useSettings() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    _settings = { ..._settings, ...patch };
    saveToStorage("nt_settings", _settings);
    notify();
  }, []);

  return { settings: _settings, updateSettings };
}

export function useQuickLinks() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const addLink = useCallback((link: Omit<QuickLink, "id">) => {
    const newLink = { ...link, id: Date.now().toString() };
    _quickLinks = [..._quickLinks, newLink];
    saveToStorage("nt_links", _quickLinks);
    notify();
  }, []);

  const updateLink = useCallback((id: string, patch: Partial<QuickLink>) => {
    _quickLinks = _quickLinks.map(l => l.id === id ? { ...l, ...patch } : l);
    saveToStorage("nt_links", _quickLinks);
    notify();
  }, []);

  const deleteLink = useCallback((id: string) => {
    _quickLinks = _quickLinks.filter(l => l.id !== id);
    saveToStorage("nt_links", _quickLinks);
    notify();
  }, []);

  const reorderLinks = useCallback((links: QuickLink[]) => {
    _quickLinks = links;
    saveToStorage("nt_links", _quickLinks);
    notify();
  }, []);

  return { quickLinks: _quickLinks, addLink, updateLink, deleteLink, reorderLinks };
}

export function useTodos() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const addTodo = useCallback((text: string) => {
    const item: TodoItem = { id: Date.now().toString(), text, completed: false, createdAt: Date.now() };
    _todos = [item, ..._todos];
    saveToStorage("nt_todos", _todos);
    notify();
  }, []);

  const toggleTodo = useCallback((id: string) => {
    _todos = _todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveToStorage("nt_todos", _todos);
    notify();
  }, []);

  const deleteTodo = useCallback((id: string) => {
    _todos = _todos.filter(t => t.id !== id);
    saveToStorage("nt_todos", _todos);
    notify();
  }, []);

  return { todos: _todos, addTodo, toggleTodo, deleteTodo };
}

export function useNote() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const updateNote = useCallback((content: string) => {
    _note = { ..._note, content, updatedAt: Date.now() };
    saveToStorage("nt_note", _note);
    notify();
  }, []);

  return { note: _note, updateNote };
}

// ============================================================
// Multi-Notes (full notes with headings + color)
// ============================================================
export interface NoteItem {
  id: string;
  title: string;
  content: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple" | "default";
  createdAt: number;
  updatedAt: number;
}

export interface QuickNoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  datetime: number;
  repeat: "none" | "daily" | "weekly";
  enabled: boolean;
}

let _notes: NoteItem[] = loadFromStorage("nt_notes", []);
let _quickNotes: QuickNoteItem[] = loadFromStorage("nt_quick_notes", []);
let _reminders: Reminder[] = loadFromStorage("nt_reminders_web", []);

export function useNotes() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const addNote = useCallback((partial?: Partial<Omit<NoteItem, "id" | "createdAt" | "updatedAt">>): NoteItem => {
    const note: NoteItem = {
      id: Date.now().toString(),
      title: partial?.title ?? "Untitled",
      content: partial?.content ?? "",
      color: partial?.color ?? "default",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    _notes = [note, ..._notes];
    saveToStorage("nt_notes", _notes);
    notify();
    return note;
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Omit<NoteItem, "id" | "createdAt">>) => {
    _notes = _notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n);
    saveToStorage("nt_notes", _notes);
    notify();
  }, []);

  const deleteNote = useCallback((id: string) => {
    _notes = _notes.filter(n => n.id !== id);
    saveToStorage("nt_notes", _notes);
    notify();
  }, []);

  return { notes: _notes, addNote, updateNote, deleteNote };
}

export function useQuickNotes() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const addQuickNote = useCallback((partial?: Partial<Omit<QuickNoteItem, "id" | "createdAt" | "updatedAt">>): QuickNoteItem => {
    const note: QuickNoteItem = {
      id: Date.now().toString(),
      title: partial?.title ?? "Quick Note",
      content: partial?.content ?? "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    _quickNotes = [note, ..._quickNotes];
    saveToStorage("nt_quick_notes", _quickNotes);
    notify();
    return note;
  }, []);

  const updateQuickNote = useCallback((id: string, patch: Partial<Omit<QuickNoteItem, "id" | "createdAt">>) => {
    _quickNotes = _quickNotes.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n);
    saveToStorage("nt_quick_notes", _quickNotes);
    notify();
  }, []);

  const deleteQuickNote = useCallback((id: string) => {
    _quickNotes = _quickNotes.filter(n => n.id !== id);
    saveToStorage("nt_quick_notes", _quickNotes);
    notify();
  }, []);

  return { quickNotes: _quickNotes, addQuickNote, updateQuickNote, deleteQuickNote };
}

export function useReminders() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const addReminder = useCallback((partial?: Partial<Omit<Reminder, "id">>): Reminder => {
    const r: Reminder = {
      id: Date.now().toString(),
      title: partial?.title ?? "Reminder",
      description: partial?.description ?? "",
      datetime: partial?.datetime ?? Date.now() + 60 * 60 * 1000,
      repeat: partial?.repeat ?? "none",
      enabled: partial?.enabled ?? true,
    };
    _reminders = [r, ..._reminders];
    saveToStorage("nt_reminders_web", _reminders);
    notify();
    return r;
  }, []);

  const updateReminder = useCallback((id: string, patch: Partial<Omit<Reminder, "id">>) => {
    _reminders = _reminders.map(r => r.id === id ? { ...r, ...patch } : r);
    saveToStorage("nt_reminders_web", _reminders);
    notify();
  }, []);

  const deleteReminder = useCallback((id: string) => {
    _reminders = _reminders.filter(r => r.id !== id);
    saveToStorage("nt_reminders_web", _reminders);
    notify();
  }, []);

  return { reminders: _reminders, addReminder, updateReminder, deleteReminder };
}

export function useCustomWallpapers() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  // Returns the new ID on success; throws on failure
  const addCustomWallpaper = useCallback(async (name: string, dataUrl: string): Promise<string> => {
    const { saveWallpaperToDB } = await import("@/utils/wallpaperDB");
    const id = `cw_${Date.now()}`;
    // Save image data to IndexedDB (no size limit issues)
    await saveWallpaperToDB(id, dataUrl);
    // Save only tiny metadata to localStorage
    const meta: CustomWallpaper = { id, name, addedAt: Date.now() };
    _customWallpapers = [..._customWallpapers, meta];
    saveToStorage("nt_custom_wallpapers", _customWallpapers);
    notify();
    return id;
  }, []);

  const deleteCustomWallpaper = useCallback(async (id: string) => {
    const { deleteWallpaperFromDB } = await import("@/utils/wallpaperDB");
    await deleteWallpaperFromDB(id);
    _customWallpapers = _customWallpapers.filter(w => w.id !== id);
    saveToStorage("nt_custom_wallpapers", _customWallpapers);
    notify();
  }, []);

  return { customWallpapers: _customWallpapers, addCustomWallpaper, deleteCustomWallpaper };
}

// Hook to resolve a wallpaper reference to an actual src string (async for custom: IDs)
export function useWallpaperSrc(wallpaper: string | null): string | null {
  const [src, setSrc] = useState<string | null>(() =>
    // If it's a preset URL (not a custom: ref), use it immediately
    wallpaper && !wallpaper.startsWith("custom:") ? wallpaper : null
  );

  useEffect(() => {
    if (!wallpaper) { setSrc(null); return; }
    if (!wallpaper.startsWith("custom:")) { setSrc(wallpaper); return; }

    const id = wallpaper.slice(7);
    let cancelled = false;
    import("@/utils/wallpaperDB").then(({ loadWallpaperFromDB }) =>
      loadWallpaperFromDB(id)
    ).then(dataUrl => {
      if (!cancelled) setSrc(dataUrl);
    }).catch(() => {
      if (!cancelled) setSrc(null);
    });
    return () => { cancelled = true; };
  }, [wallpaper]);

  return src;
}
