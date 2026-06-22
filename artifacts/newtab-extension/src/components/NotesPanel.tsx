import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, FileText, Zap, Search } from "lucide-react";
import { useNotes, useQuickNotes, type NoteItem } from "@/store/useStore";

const NOTE_COLORS = [
  { id: "default" as const, dot: "rgba(255,255,255,0.35)", border: "rgba(255,255,255,0.15)", bg: "rgba(255,255,255,0.04)" },
  { id: "yellow" as const,  dot: "#fbbf24", border: "rgba(251,191,36,0.32)", bg: "rgba(251,191,36,0.08)" },
  { id: "blue" as const,    dot: "#60a5fa", border: "rgba(96,165,250,0.32)",  bg: "rgba(96,165,250,0.08)"  },
  { id: "green" as const,   dot: "#34d399", border: "rgba(52,211,153,0.32)",  bg: "rgba(52,211,153,0.08)"  },
  { id: "pink" as const,    dot: "#f472b6", border: "rgba(244,114,182,0.32)", bg: "rgba(244,114,182,0.08)" },
  { id: "purple" as const,  dot: "#c084fc", border: "rgba(192,132,252,0.32)", bg: "rgba(192,132,252,0.08)" },
] as const;

type ColorId = typeof NOTE_COLORS[number]["id"];

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface NotesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotesPanel({ open, onClose }: NotesPanelProps) {
  const [tab, setTab] = useState<"notes" | "quick">("notes");
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const { quickNotes, addQuickNote, updateQuickNote, deleteQuickNote } = useQuickNotes();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [localColor, setLocalColor] = useState<ColorId>("default");
  const titleRef = useRef<HTMLInputElement>(null);

  const isNotes = tab === "notes";
  const items = isNotes ? notes : quickNotes;
  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;

  useEffect(() => {
    if (selectedItem) {
      setLocalTitle(selectedItem.title);
      setLocalContent(selectedItem.content);
      if ("color" in selectedItem) setLocalColor((selectedItem as NoteItem).color || "default");
      else setLocalColor("default");
    } else {
      setLocalTitle(""); setLocalContent(""); setLocalColor("default");
    }
  }, [selectedId, tab]);

  const saveDebounced = useRef(
    debounce((id: string, title: string, content: string, color: ColorId, isNote: boolean) => {
      if (isNote) updateNote(id, { title, content, color });
      else updateQuickNote(id, { title, content });
    }, 500)
  ).current;

  const handleTitleChange = (v: string) => {
    setLocalTitle(v);
    if (selectedId) saveDebounced(selectedId, v, localContent, localColor, isNotes);
  };
  const handleContentChange = (v: string) => {
    setLocalContent(v);
    if (selectedId) saveDebounced(selectedId, localTitle, v, localColor, isNotes);
  };
  const handleColorChange = useCallback((c: ColorId) => {
    setLocalColor(c);
    if (selectedId && isNotes) updateNote(selectedId, { color: c });
  }, [selectedId, isNotes, updateNote]);

  const createNew = useCallback(() => {
    const item = isNotes ? addNote() : addQuickNote();
    setSelectedId(item.id);
    setTimeout(() => titleRef.current?.focus(), 60);
  }, [isNotes, addNote, addQuickNote]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    if (isNotes) deleteNote(selectedId);
    else deleteQuickNote(selectedId);
    setSelectedId(null);
  }, [selectedId, isNotes, deleteNote, deleteQuickNote]);

  const handleTabChange = useCallback((t: "notes" | "quick") => {
    setTab(t);
    setSelectedId(null);
    setSearchQuery("");
  }, []);

  const colorMeta = NOTE_COLORS.find((c) => c.id === localColor) || NOTE_COLORS[0];
  const editorStyle = selectedItem
    ? { background: colorMeta.bg, borderLeft: `3px solid ${colorMeta.border}` }
    : {};

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
            style={{ width: "min(740px, 98vw)", borderRight: "1px solid rgba(255,255,255,0.09)" }}
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
              {/* Tabs */}
              <div className="flex items-center gap-1 flex-1">
                {(["notes", "quick"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTabChange(t)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      tab === t
                        ? "bg-white/14 text-white shadow-sm"
                        : "text-white/38 hover:text-white/70 hover:bg-white/07"
                    }`}
                  >
                    {t === "notes" ? <FileText size={13} /> : <Zap size={13} />}
                    {t === "notes" ? "Notes" : "Quick Notes"}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        tab === t ? "bg-white/15 text-white/70" : "bg-white/08 text-white/30"
                      }`}
                    >
                      {(t === "notes" ? notes : quickNotes).length}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={createNew}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(99,102,241,0.8)" }}
              >
                <Plus size={14} />
                New
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
                className="w-56 flex-shrink-0 flex flex-col"
                style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}
              >
                {/* Search */}
                <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    <Search size={12} className="text-white/30 flex-shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="flex-1 bg-transparent text-white/80 text-xs outline-none placeholder:text-white/25"
                    />
                  </div>
                </div>

                {/* Note list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filtered.length === 0 && (
                    <div className="text-center py-10 px-3">
                      <p className="text-white/28 text-xs">
                        {searchQuery ? "No matches" : `No ${isNotes ? "notes" : "quick notes"}`}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={createNew}
                          className="mt-2 text-indigo-400/80 hover:text-indigo-300 text-xs transition-colors"
                        >
                          + Create one
                        </button>
                      )}
                    </div>
                  )}
                  {filtered.map((item) => {
                    const c =
                      isNotes
                        ? NOTE_COLORS.find((x) => x.id === (item as NoteItem).color) || NOTE_COLORS[0]
                        : null;
                    const isSelected = item.id === selectedId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border ${
                          isSelected
                            ? "border-white/18 bg-white/10"
                            : "border-transparent hover:bg-white/06"
                        }`}
                        style={
                          isSelected && c
                            ? { borderColor: c.border, background: c.bg }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-2">
                          {c && (
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: c.dot }}
                            />
                          )}
                          <p className="text-white/88 text-xs font-medium truncate">
                            {item.title || "Untitled"}
                          </p>
                        </div>
                        <p className="text-white/32 text-[10px] mt-0.5 truncate">
                          {item.content || "Empty"}
                        </p>
                        <p className="text-white/20 text-[9px] mt-1">{formatDate(item.updatedAt)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: editor */}
              <div className="flex-1 flex flex-col min-w-0" style={editorStyle}>
                {selectedItem ? (
                  <>
                    {/* Title */}
                    <div
                      className="px-6 pt-5 pb-3 flex-shrink-0"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <input
                        ref={titleRef}
                        value={localTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Note title..."
                        className="w-full bg-transparent text-white text-xl font-semibold outline-none placeholder:text-white/22 leading-snug"
                      />
                      <p className="text-white/22 text-[10px] mt-1.5">
                        Last edited {formatDate(selectedItem.updatedAt)}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 px-6 py-4">
                      <textarea
                        value={localContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder="Start writing your note..."
                        className="w-full h-full bg-transparent text-white/80 text-sm leading-relaxed outline-none resize-none placeholder:text-white/22"
                      />
                    </div>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      {/* Color picker (notes only) */}
                      {isNotes ? (
                        <div className="flex items-center gap-1.5">
                          {NOTE_COLORS.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleColorChange(c.id)}
                              title={c.id}
                              className={`rounded-full transition-all border-2 ${
                                localColor === c.id
                                  ? "scale-125 border-white/60"
                                  : "border-transparent hover:scale-110"
                              }`}
                              style={{
                                width: "18px",
                                height: "18px",
                                background: c.dot,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/20 text-[10px]">Quick note</span>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-white/22 text-[10px]">Auto-saved</span>
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-xs"
                          style={{ color: "rgba(252,165,165,0.7)" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)";
                            (e.currentTarget as HTMLElement).style.color = "#fca5a5";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = "rgba(252,165,165,0.7)";
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Empty state */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      {isNotes ? (
                        <FileText size={28} className="text-white/18" />
                      ) : (
                        <Zap size={28} className="text-white/18" />
                      )}
                    </div>
                    <p className="text-white/38 text-sm font-medium mb-1">
                      {items.length === 0
                        ? `No ${isNotes ? "notes" : "quick notes"} yet`
                        : "Select a note to edit"}
                    </p>
                    <p className="text-white/22 text-xs mb-5">
                      {items.length === 0 ? "Create your first one to get started." : "Or create a new one."}
                    </p>
                    <button
                      onClick={createNew}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
                      style={{ background: "rgba(99,102,241,0.8)" }}
                    >
                      <Plus size={14} /> New {isNotes ? "Note" : "Quick Note"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
