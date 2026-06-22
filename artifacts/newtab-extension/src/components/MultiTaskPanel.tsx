import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Maximize2,
  Minimize2,
  GripVertical,
  Globe,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Copy,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Save,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Expand,
  Shrink,
  ChevronDown,
  Columns,
  Code,
} from "lucide-react";

interface Panel {
  id: string;
  url: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zoom: number;
  deviceMode: "desktop" | "tablet" | "mobile" | "custom";
  currentUrl: string;
  history: string[];
  historyIdx: number;
  zIndex: number;
}

const DEVICE_PRESETS: Record<
  string,
  { label: string; width: number; height: number; icon: React.ReactNode }
> = {
  desktop: {
    label: "Desktop",
    width: 1280,
    height: 800,
    icon: <Monitor size={13} />,
  },
  tablet: {
    label: "iPad",
    width: 768,
    height: 1024,
    icon: <Tablet size={13} />,
  },
  mobile: {
    label: "iPhone",
    width: 390,
    height: 844,
    icon: <Smartphone size={13} />,
  },
  custom: {
    label: "Custom",
    width: 480,
    height: 360,
    icon: <Expand size={13} />,
  },
};

const LAYOUT_PRESETS = [
  { name: "2 Col", cols: 2, rows: 1, icon: <Columns size={14} /> },
  { name: "2 Row", cols: 1, rows: 2, icon: <LayoutTemplate size={14} /> },
  { name: "2x2", cols: 2, rows: 2, icon: <LayoutGrid size={14} /> },
];

const SAVED_WORKSPACES_KEY = "nt_workspaces";
type Workspace = { name: string; panels: Omit<Panel, "zIndex">[] };

function loadWorkspaces(): Workspace[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_WORKSPACES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveWorkspacesToStorage(ws: Workspace[]) {
  localStorage.setItem(SAVED_WORKSPACES_KEY, JSON.stringify(ws));
}

let topZ = 100;

function PanelFrame({
  panel,
  onUpdate,
  onRemove,
  onFocus,
}: {
  panel: Panel;
  onUpdate: (id: string, patch: Partial<Panel>) => void;
  onRemove: (id: string) => void;
  onFocus: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    panelX: number;
    panelY: number;
  } | null>(null);
  const resizeRef = useRef<{
    dir: string;
    startX: number;
    startY: number;
    w: number;
    h: number;
    px: number;
    py: number;
  } | null>(null);
  const [urlInput, setUrlInput] = useState(panel.currentUrl);
  const [showDevices, setShowDevices] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  const device = DEVICE_PRESETS[panel.deviceMode];

  const navigateTo = useCallback(
    (url: string) => {
      const clean = url.startsWith("http") ? url : "https://" + url;
      const newHistory = [
        ...panel.history.slice(0, panel.historyIdx + 1),
        clean,
      ];
      onUpdate(panel.id, {
        currentUrl: clean,
        title: new URL(clean).hostname,
        history: newHistory,
        historyIdx: newHistory.length - 1,
      });
      setUrlInput(clean);
    },
    [panel, onUpdate],
  );

  const goBack = () => {
    if (panel.historyIdx > 0) {
      const url = panel.history[panel.historyIdx - 1];
      onUpdate(panel.id, { currentUrl: url, historyIdx: panel.historyIdx - 1 });
      setUrlInput(url);
    }
  };

  const goForward = () => {
    if (panel.historyIdx < panel.history.length - 1) {
      const url = panel.history[panel.historyIdx + 1];
      onUpdate(panel.id, { currentUrl: url, historyIdx: panel.historyIdx + 1 });
      setUrlInput(url);
    }
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    onFocus(panel.id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panelX: panel.x,
      panelY: panel.y,
    };

    const move = (e: MouseEvent) => {
      if (!dragRef.current) return;
      onUpdate(panel.id, {
        x: Math.max(
          0,
          dragRef.current.panelX + e.clientX - dragRef.current.startX,
        ),
        y: Math.max(
          0,
          dragRef.current.panelY + e.clientY - dragRef.current.startY,
        ),
      });
    };
    const up = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const startResize = (e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(panel.id);
    resizeRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      w: panel.width,
      h: panel.height,
      px: panel.x,
      py: panel.y,
    };

    const move = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      const { dir, w, h, px, py } = resizeRef.current;
      const patch: Partial<Panel> = {};
      if (dir.includes("e")) patch.width = Math.max(320, w + dx);
      if (dir.includes("s")) patch.height = Math.max(200, h + dy);
      if (dir.includes("w")) {
        patch.width = Math.max(320, w - dx);
        patch.x = px + dx;
      }
      if (dir.includes("n")) {
        patch.height = Math.max(200, h - dy);
        patch.y = py + dy;
      }
      onUpdate(panel.id, patch);
    };
    const up = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const copyUrl = () =>
    navigator.clipboard.writeText(panel.currentUrl).catch(() => {});
  const openExternal = () => window.open(panel.currentUrl, "_blank");

  const innerW = panel.deviceMode === "custom" ? panel.width - 2 : device.width;
  const innerH =
    panel.deviceMode === "custom" ? panel.height - 80 : device.height;
  const scale =
    panel.deviceMode !== "custom"
      ? Math.min(
          (panel.width - 2) / device.width,
          (panel.height - 80) / device.height,
          1,
        ) *
        (panel.zoom / 100)
      : panel.zoom / 100;

  const RESIZE_HANDLES = [
    {
      dir: "e",
      cls: "absolute right-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-ew-resize hover:bg-white/30 rounded-l-none rounded-r",
    },
    {
      dir: "w",
      cls: "absolute left-0 top-1/2 -translate-y-1/2 w-2 h-12 cursor-ew-resize hover:bg-white/30 rounded-r-none rounded-l",
    },
    {
      dir: "s",
      cls: "absolute bottom-0 left-1/2 -translate-x-1/2 h-2 w-12 cursor-ns-resize hover:bg-white/30 rounded-t-none rounded-b",
    },
    {
      dir: "n",
      cls: "absolute top-0 left-1/2 -translate-x-1/2 h-2 w-12 cursor-ns-resize hover:bg-white/30 rounded-b-none rounded-t",
    },
    {
      dir: "se",
      cls: "absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-white/30 rounded",
    },
    {
      dir: "sw",
      cls: "absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-white/30 rounded",
    },
    {
      dir: "ne",
      cls: "absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-white/30 rounded",
    },
    {
      dir: "nw",
      cls: "absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-white/30 rounded",
    },
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        zIndex: panel.zIndex,
        position: "absolute",
      }}
      className="pointer-events-auto"
      onMouseDown={() => onFocus(panel.id)}
      data-testid={`panel-${panel.id}`}
    >
      {/* Resize handles */}
      {RESIZE_HANDLES.map((h) => (
        <div
          key={h.dir}
          className={h.cls}
          onMouseDown={(e) => startResize(e, h.dir)}
        />
      ))}

      <div
        className="glass-card rounded-xl overflow-hidden shadow-2xl border border-white/10"
        style={{ height: panel.minimized ? "auto" : panel.height }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 bg-black/30 border-b border-white/10 select-none drag-handle"
          onMouseDown={startDrag}
        >
          {/* Window controls */}
          <button
            onClick={() => onRemove(panel.id)}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 flex-shrink-0"
            title="Close"
          />
          <button
            onClick={() => onUpdate(panel.id, { minimized: !panel.minimized })}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 flex-shrink-0"
            title="Minimize"
          />
          <button
            onClick={() =>
              onUpdate(panel.id, { x: 20, y: 20, width: 900, height: 600 })
            }
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 flex-shrink-0"
            title="Maximize"
          />

          <GripVertical size={11} className="text-white/20 ml-1" />

          {/* Nav */}
          <button
            onClick={goBack}
            disabled={panel.historyIdx <= 0}
            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors p-0.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ArrowLeft size={12} />
          </button>
          <button
            onClick={goForward}
            disabled={panel.historyIdx >= panel.history.length - 1}
            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors p-0.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ArrowRight size={12} />
          </button>
          <button
            onClick={() => onUpdate(panel.id, { currentUrl: panel.currentUrl })}
            className="text-white/40 hover:text-white transition-colors p-0.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <RefreshCw size={12} />
          </button>

          {/* URL bar */}
          <form
            className="flex-1 min-w-0"
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(urlInput);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white/80 text-xs rounded px-2 py-0.5 outline-none border border-transparent focus:border-white/30 truncate"
              data-testid={`url-bar-${panel.id}`}
            />
          </form>

          {/* Device selector */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowDevices(!showDevices);
                setShowZoom(false);
              }}
              className="flex items-center gap-1 text-white/50 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              title="Device"
            >
              {device.icon} this is that icon
              <ChevronDown size={9} />
            </button>
            {showDevices && (
              <div className="absolute top-6 right-0 glass rounded-lg shadow-xl z-50 py-1 min-w-[110px]">
                {Object.entries(DEVICE_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onUpdate(panel.id, {
                        deviceMode: key as Panel["deviceMode"],
                      });
                      setShowDevices(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/10 transition-colors ${panel.deviceMode === key ? "text-white" : "text-white/60"}`}
                  >
                    {preset.icon} {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zoom */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowZoom(!showZoom);
                setShowDevices(false);
              }}
              className="text-white/50 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              title="Zoom"
            >
              {panel.zoom}%
            </button>
            {showZoom && (
              <div className="absolute top-6 right-0 glass rounded-lg shadow-xl z-50 p-2 min-w-[120px]">
                <input
                  type="range"
                  min={25}
                  max={200}
                  step={5}
                  value={panel.zoom}
                  onChange={(e) =>
                    onUpdate(panel.id, { zoom: Number(e.target.value) })
                  }
                  className="w-full accent-primary"
                />
                <div className="flex justify-between mt-1">
                  {[50, 75, 100, 150].map((z) => (
                    <button
                      key={z}
                      onClick={() => onUpdate(panel.id, { zoom: z })}
                      className={`text-xs px-1 py-0.5 rounded ${panel.zoom === z ? "text-white" : "text-white/50"} hover:text-white`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={copyUrl}
            className="text-white/40 hover:text-white transition-colors p-0.5"
            title="Copy URL"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Copy size={12} />
          </button>
          <button
            onClick={openExternal}
            className="text-white/40 hover:text-white transition-colors p-0.5"
            title="Open in new tab"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Content */}
        {!panel.minimized && (
          <div
            className="relative overflow-hidden bg-white"
            style={{ height: panel.height - 40 }}
          >
            {panel.deviceMode !== "custom" ? (
              <div
                className="absolute inset-0 flex items-start justify-center pt-2 bg-gray-900 overflow-hidden"
                style={{ backgroundColor: "rgba(17,24,39,0.95)" }}
              >
                <div
                  className="border border-white/20 rounded overflow-hidden shadow-2xl bg-white origin-top"
                  style={{
                    width: innerW,
                    height: innerH,
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",
                  }}
                >
                  <iframe
                    key={panel.currentUrl}
                    src={panel.currentUrl}
                    title={panel.title}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    data-testid={`iframe-${panel.id}`}
                  />
                </div>
              </div>
            ) : (
              <div
                className="w-full h-full overflow-auto bg-white origin-top-left"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                }}
              >
                <iframe
                  key={panel.currentUrl}
                  src={panel.currentUrl}
                  title={panel.title}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  data-testid={`iframe-custom-${panel.id}`}
                />
              </div>
            )}

            {/* Status bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 bg-black/60 text-white/40 text-[10px]">
              <span>
                {
                  new URL(
                    panel.currentUrl.startsWith("http")
                      ? panel.currentUrl
                      : "https://" + panel.currentUrl,
                  ).hostname
                }
              </span>
              <span className="flex items-center gap-2">
                <span>
                  {panel.width}×{panel.height}
                </span>
                {panel.deviceMode !== "custom" && (
                  <span className="text-primary">
                    {device.label} ({device.width}×{device.height})
                  </span>
                )}
                <span>Zoom: {panel.zoom}%</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddPanelModal({
  onAdd,
  onClose,
}: {
  onAdd: (url: string, title: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const QUICK = [
    { title: "Google", url: "https://www.google.com/webhp?igu=1" },
    { title: "Wikipedia", url: "https://en.m.wikipedia.org" },
    { title: "GitHub", url: "https://github.com" },
    { title: "MDN Docs", url: "https://developer.mozilla.org" },
    { title: "Can I Use", url: "https://caniuse.com" },
    { title: "DevDocs", url: "https://devdocs.io" },
    { title: "CodePen", url: "https://codepen.io" },
    { title: "Stack Overflow", url: "https://stackoverflow.com" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-[200] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass rounded-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        data-testid="add-panel-modal"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Globe size={16} className="text-primary" />
          Open in Panel
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url) onAdd(url, title);
          }}
          className="space-y-3"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (e.g. https://example.com)"
            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            autoFocus
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            {QUICK.map((q) => (
              <button
                key={q.title}
                type="button"
                onClick={() => {
                  setUrl(q.url);
                  setTitle(q.title);
                }}
                className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs text-left transition-all"
              >
                {q.title}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-primary text-white text-sm"
            >
              Open Panel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function MultiTaskPanel() {
  const [visible, setVisible] = useState(false);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(loadWorkspaces);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const addPanel = useCallback(
    (url: string, title: string) => {
      const clean = url.startsWith("http") ? url : "https://" + url;
      topZ += 1;
      const panel: Panel = {
        id: Date.now().toString(),
        url: clean,
        title: title || new URL(clean).hostname,
        x: 40 + panels.length * 40,
        y: 40 + panels.length * 40,
        width: 640,
        height: 480,
        minimized: false,
        zoom: 100,
        deviceMode: "custom",
        currentUrl: clean,
        history: [clean],
        historyIdx: 0,
        zIndex: topZ,
      };
      setPanels((p) => [...p, panel]);
      setShowAddModal(false);
    },
    [panels.length],
  );

  const updatePanel = useCallback((id: string, patch: Partial<Panel>) => {
    setPanels((p) =>
      p.map((panel) => (panel.id === id ? { ...panel, ...patch } : panel)),
    );
  }, []);

  const removePanel = useCallback((id: string) => {
    setPanels((p) => p.filter((panel) => panel.id !== id));
  }, []);

  const focusPanel = useCallback((id: string) => {
    topZ += 1;
    setPanels((p) =>
      p.map((panel) => (panel.id === id ? { ...panel, zIndex: topZ } : panel)),
    );
  }, []);

  const applyLayout = (cols: number, rows: number) => {
    const urls = panels.map((p) => p.currentUrl);
    const vw = window.innerWidth - 80;
    const vh = window.innerHeight - 100;
    const w = Math.floor(vw / cols);
    const h = Math.floor(vh / rows);
    const newPanels: Panel[] = [];
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const url = urls[i] || "https://google.com";
        const clean = url.startsWith("http") ? url : "https://" + url;
        topZ += 1;
        newPanels.push({
          id: (i + 1).toString(),
          url: clean,
          title: new URL(clean).hostname,
          x: 40 + c * (w + 8),
          y: 40 + r * (h + 8),
          width: w,
          height: h,
          minimized: false,
          zoom: 100,
          deviceMode: "custom",
          currentUrl: clean,
          history: [clean],
          historyIdx: 0,
          zIndex: topZ,
        });
        i++;
      }
    }
    setPanels(newPanels);
  };

  const saveWorkspace = () => {
    if (!workspaceName.trim()) return;
    const ws: Workspace = {
      name: workspaceName,
      panels: panels.map(({ zIndex: _, ...p }) => p),
    };
    const updated = [...workspaces.filter((w) => w.name !== workspaceName), ws];
    setWorkspaces(updated);
    saveWorkspacesToStorage(updated);
    setWorkspaceName("");
  };

  const loadWorkspace = (ws: Workspace) => {
    topZ += ws.panels.length;
    setPanels(ws.panels.map((p, i) => ({ ...p, zIndex: 100 + i })));
    setShowWorkspaces(false);
  };

  const deleteWorkspace = (name: string) => {
    const updated = workspaces.filter((w) => w.name !== name);
    setWorkspaces(updated);
    saveWorkspacesToStorage(updated);
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(!visible)}
        className="fixed z-20 glass p-2 rounded-full text-white/60 hover:text-white hover:scale-110 transition-all shadow-lg"
        title="Open Multi-Panel (split screen)"
        data-testid="multitask-open-button"
      >
        <LayoutGrid size={18} />
      </button>
    );
  }

  return (
    <>
      {/* Panel layer */}
      <div
        className="fixed inset-0 z-30 pointer-events-none"
        data-testid="panel-layer"
      >
        <AnimatePresence>
          {panels.map((panel) => (
            <PanelFrame
              key={panel.id}
              panel={panel}
              onUpdate={updatePanel}
              onRemove={removePanel}
              onFocus={focusPanel}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] glass-card rounded-2xl px-3 py-2 flex items-center gap-1 shadow-2xl pointer-events-auto border border-white/15"
        data-testid="multitask-toolbar"
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/80 hover:bg-primary text-white text-xs font-medium transition-all"
          data-testid="add-panel-button"
        >
          <Plus size={13} /> Add Panel
        </button>

        <div className="w-px h-5 bg-white/20" />

        {LAYOUT_PRESETS.map((layout) => (
          <button
            key={layout.name}
            onClick={() => applyLayout(layout.cols, layout.rows)}
            title={`Layout: ${layout.name}`}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/15 text-xs transition-all"
          >
            {layout.icon}
            <span className="text-[10px]">{layout.name}</span>
          </button>
        ))}

        <div className="w-px h-5 bg-white/20" />

        {/* Workspace save/load */}
        <div className="relative">
          <button
            onClick={() => setShowWorkspaces(!showWorkspaces)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/15 text-xs transition-all"
            title="Workspaces"
          >
            <Layers size={13} />
            <span className="text-[10px]">Workspaces</span>
          </button>
          <AnimatePresence>
            {showWorkspaces && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-10 left-0 glass rounded-xl shadow-xl p-3 min-w-[200px] z-50"
              >
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-2">
                  Save Current
                </p>
                <div className="flex gap-1.5 mb-3">
                  <input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Workspace name..."
                    className="flex-1 bg-white/10 text-white text-xs rounded px-2 py-1 outline-none border border-white/20 focus:border-primary"
                    onKeyDown={(e) => e.key === "Enter" && saveWorkspace()}
                  />
                  <button
                    onClick={saveWorkspace}
                    className="bg-primary text-white text-xs px-2 py-1 rounded"
                    title="Save"
                  >
                    <Save size={12} />
                  </button>
                </div>
                {workspaces.length > 0 && (
                  <>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">
                      Saved
                    </p>
                    {workspaces.map((ws) => (
                      <div
                        key={ws.name}
                        className="flex items-center gap-1 mb-1"
                      >
                        <button
                          onClick={() => loadWorkspace(ws)}
                          className="flex-1 flex items-center gap-1.5 text-white/80 hover:text-white text-xs text-left py-1"
                        >
                          <FolderOpen size={11} /> {ws.name}{" "}
                          <span className="text-white/30">
                            ({ws.panels.length}p)
                          </span>
                        </button>
                        <button
                          onClick={() => deleteWorkspace(ws.name)}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-white/20" />

        <button
          onClick={() => panels.forEach((p) => removePanel(p.id))}
          className="px-2 py-1.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 text-xs transition-all"
          title="Close all panels"
        >
          <X size={13} />
        </button>
        <button
          onClick={() => setVisible(false)}
          className="px-2 py-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/15 text-xs transition-all"
          title="Hide toolbar"
        >
          <Shrink size={13} />
        </button>
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <AddPanelModal
            onAdd={addPanel}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
