import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, ListTodo } from "lucide-react";
import { useTodos, useSettings } from "@/store/useStore";

export function TodoWidget() {
  const { settings } = useSettings();
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();
  const [input, setInput] = useState("");

  if (!settings.showTodo) return null;

  const pending = todos.filter(t => !t.completed).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input.trim());
      setInput("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card rounded-2xl p-4 text-white min-w-[240px] max-w-[280px]"
      data-testid="todo-widget"
    >
      <div className="flex items-center gap-2 mb-3">
        <ListTodo size={16} className="text-white/70" />
        <h3 className="font-medium text-sm">Tasks</h3>
        {pending > 0 && (
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">{pending}</span>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/50"
          data-testid="todo-input"
        />
        <button type="submit" className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors" data-testid="add-todo-button">
          <Plus size={14} />
        </button>
      </form>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        <AnimatePresence>
          {todos.slice(0, 8).map(todo => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 group"
              data-testid={`todo-item-${todo.id}`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  todo.completed
                    ? "bg-green-400 border-green-400"
                    : "border-white/40 hover:border-white/80"
                }`}
              >
                {todo.completed && <Check size={10} />}
              </button>
              <span className={`flex-1 text-xs ${todo.completed ? "line-through text-white/40" : "text-white/90"}`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400/70 hover:text-red-400 transition-all"
                data-testid={`delete-todo-${todo.id}`}
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {todos.length === 0 && (
          <p className="text-white/40 text-xs text-center py-2">No tasks yet</p>
        )}
      </div>
    </motion.div>
  );
}
