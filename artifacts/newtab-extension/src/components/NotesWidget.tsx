import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { StickyNote } from "lucide-react";
import { useNote, useSettings } from "@/store/useStore";

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function NotesWidget() {
  const { settings } = useSettings();
  const { note, updateNote } = useNote();
  const debouncedUpdate = useRef(debounce(updateNote, 500)).current;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    debouncedUpdate(e.target.value);
  }, [debouncedUpdate]);

  if (!settings.showNotes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card rounded-2xl p-4 text-white min-w-[240px] max-w-[280px]"
      data-testid="notes-widget"
    >
      <div className="flex items-center gap-2 mb-3">
        <StickyNote size={16} className="text-yellow-300/70" />
        <h3 className="font-medium text-sm">Quick Notes</h3>
      </div>
      <textarea
        defaultValue={note.content}
        onChange={handleChange}
        placeholder="Start typing your notes..."
        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg p-2 text-xs outline-none focus:border-white/30 resize-none min-h-[100px] max-h-[160px]"
        data-testid="notes-textarea"
      />
    </motion.div>
  );
}
