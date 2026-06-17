import { useState, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { Plus, ExternalLink, Pencil, Trash2, GripVertical, X, Check, FolderOpen } from "lucide-react";
import { useQuickLinks, useSettings, QuickLink } from "@/store/useStore";

interface LinkFormData {
  title: string;
  url: string;
  category: string;
}

function getFavicon(url: string) {
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

function LinkCard({ link, onEdit, onDelete }: {
  link: QuickLink;
  onEdit: (link: QuickLink) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const favicon = link.icon || getFavicon(link.url);

  return (
    <Reorder.Item value={link} id={link.id} className="relative group">
      <div
        className="relative glass-card rounded-xl p-3 cursor-pointer hover:scale-105 transition-all duration-200 flex flex-col items-center gap-2 w-20"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        data-testid={`quick-link-${link.id}`}
      >
        {showActions && (
          <div className="absolute -top-2 -right-2 flex gap-1 z-10">
            <button
              onClick={e => { e.stopPropagation(); onEdit(link); }}
              className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
              data-testid={`edit-link-${link.id}`}
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(link.id); }}
              className="w-5 h-5 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
              data-testid={`delete-link-${link.id}`}
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
        <div className="drag-handle absolute top-1 left-1 opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical size={10} className="text-white/60" />
        </div>
        <a
          href={link.url}
          className="flex flex-col items-center gap-2 w-full"
          onClick={e => e.stopPropagation()}
        >
          {favicon ? (
            <img
              src={favicon}
              alt={link.title}
              className="w-8 h-8 rounded-lg object-contain bg-white/10"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <ExternalLink size={14} className="text-white" />
            </div>
          )}
          <span className="text-white/90 text-xs text-center leading-tight truncate w-full font-medium">
            {link.title}
          </span>
        </a>
      </div>
    </Reorder.Item>
  );
}

function LinkModal({ link, onSave, onClose }: {
  link?: QuickLink | null;
  onSave: (data: LinkFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<LinkFormData>({
    title: link?.title || "",
    url: link?.url || "",
    category: link?.category || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title && form.url) onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl p-6 w-full max-w-sm mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">{link ? "Edit Link" : "Add Link"}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
            data-testid="link-title-input"
          />
          <input
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="URL (e.g. https://example.com)"
            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
            data-testid="link-url-input"
          />
          <input
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="Category (optional)"
            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/50"
            data-testid="link-category-input"
          />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1" data-testid="save-link-button">
              <Check size={14} />
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function QuickLinks() {
  const { settings } = useSettings();
  const { quickLinks, addLink, updateLink, deleteLink, reorderLinks } = useQuickLinks();
  const [editingLink, setEditingLink] = useState<QuickLink | null | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(quickLinks.map(l => l.category).filter(Boolean)));

  const handleSave = useCallback((data: LinkFormData) => {
    if (editingLink?.id) {
      updateLink(editingLink.id, data);
    } else {
      addLink(data);
    }
    setEditingLink(undefined);
  }, [editingLink, addLink, updateLink]);

  if (!settings.showQuickLinks) return null;

  const filtered = filterCategory
    ? quickLinks.filter(l => l.category === filterCategory)
    : quickLinks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full"
      data-testid="quick-links"
    >
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${!filterCategory ? "bg-white/30 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? null : (cat || null))}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-all ${filterCategory === cat ? "bg-white/30 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
            >
              <FolderOpen size={10} />
              {cat}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Reorder.Group
          axis="x"
          values={filtered}
          onReorder={reorderLinks}
          className="flex gap-3 flex-wrap justify-center"
          layoutScroll
        >
          {filtered.map(link => (
            <LinkCard
              key={link.id}
              link={link}
              onEdit={l => setEditingLink(l)}
              onDelete={deleteLink}
            />
          ))}
        </Reorder.Group>
        <button
          onClick={() => setEditingLink(null)}
          className="glass-card rounded-xl p-3 w-20 h-20 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all text-white/60 hover:text-white cursor-pointer"
          data-testid="add-link-button"
        >
          <Plus size={20} />
          <span className="text-xs">Add</span>
        </button>
      </div>

      {editingLink !== undefined && (
        <LinkModal
          link={editingLink}
          onSave={handleSave}
          onClose={() => setEditingLink(undefined)}
        />
      )}
    </motion.div>
  );
}
