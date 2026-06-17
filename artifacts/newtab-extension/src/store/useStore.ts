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

export interface CustomWallpaper {
  id: string;
  name: string;
  dataUrl: string;
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

export function useCustomWallpapers() {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const addCustomWallpaper = useCallback((name: string, dataUrl: string): string => {
    const id = `cw_${Date.now()}`;
    const entry: CustomWallpaper = { id, name, dataUrl, addedAt: Date.now() };
    _customWallpapers = [..._customWallpapers, entry];
    try {
      localStorage.setItem("nt_custom_wallpapers", JSON.stringify(_customWallpapers));
    } catch {
      // If quota exceeded, remove oldest and retry
      _customWallpapers = _customWallpapers.slice(-3);
      try { localStorage.setItem("nt_custom_wallpapers", JSON.stringify(_customWallpapers)); } catch { /* ignore */ }
    }
    notify();
    return id;
  }, []);

  const deleteCustomWallpaper = useCallback((id: string) => {
    _customWallpapers = _customWallpapers.filter(w => w.id !== id);
    localStorage.setItem("nt_custom_wallpapers", JSON.stringify(_customWallpapers));
    notify();
  }, []);

  const resolveWallpaper = useCallback((wallpaper: string | null): string | null => {
    if (!wallpaper) return null;
    if (wallpaper.startsWith("custom:")) {
      const id = wallpaper.slice(7);
      return _customWallpapers.find(w => w.id === id)?.dataUrl ?? null;
    }
    return wallpaper;
  }, []);

  return { customWallpapers: _customWallpapers, addCustomWallpaper, deleteCustomWallpaper, resolveWallpaper };
}
