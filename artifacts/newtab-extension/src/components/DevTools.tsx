import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code, X, Hash, Clock, FileJson, Shuffle, Type, Palette, Link,
  Calculator, RefreshCw, Copy, Check, ChevronDown, Regex
} from "lucide-react";

type ToolId = "json" | "base64" | "timestamp" | "regex" | "color" | "lorem" | "hash" | "uuid" | "css-gradient" | "url" | "diff";

interface Tool { id: ToolId; icon: React.ReactNode; label: string; }
const TOOLS: Tool[] = [
  { id: "json", icon: <FileJson size={14} />, label: "JSON" },
  { id: "base64", icon: <Hash size={14} />, label: "Base64" },
  { id: "timestamp", icon: <Clock size={14} />, label: "Timestamp" },
  { id: "regex", icon: <Regex size={14} />, label: "Regex" },
  { id: "color", icon: <Palette size={14} />, label: "Color" },
  { id: "lorem", icon: <Type size={14} />, label: "Lorem" },
  { id: "hash", icon: <Hash size={14} />, label: "Hash" },
  { id: "uuid", icon: <Shuffle size={14} />, label: "UUID" },
  { id: "css-gradient", icon: <Palette size={14} />, label: "Gradient" },
  { id: "url", icon: <Link size={14} />, label: "URL" },
  { id: "diff", icon: <Code size={14} />, label: "Diff" },
];

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return { copied, copy };
}

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text)}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function Textarea({ value, onChange, placeholder, rows = 5, mono = true }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; rows?: number; mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange?.(e.target.value)}
      readOnly={!onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full bg-black/30 border border-white/15 text-white/90 placeholder:text-white/30 rounded-lg p-2 text-xs outline-none focus:border-primary resize-none ${mono ? "font-mono" : ""}`}
    />
  );
}

// JSON Formatter
function JsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch (e) { setError((e as Error).message); }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <span className="text-white/50 text-xs">Indent:</span>
        {[2, 4].map(n => (
          <button key={n} onClick={() => setIndent(n)}
            className={`text-xs px-2 py-0.5 rounded ${indent === n ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>{n}</button>
        ))}
        <button onClick={format} className="ml-auto px-3 py-1 bg-primary text-white text-xs rounded-lg hover:opacity-90">Format</button>
        <button onClick={minify} className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20">Minify</button>
      </div>
      <Textarea value={input} onChange={setInput} placeholder='{"key": "value"...' rows={5} />
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      {output && (
        <div className="relative">
          <Textarea value={output} rows={6} />
          <div className="absolute top-1.5 right-1.5"><CopyButton text={output} /></div>
        </div>
      )}
    </div>
  );
}

// Base64
function Base64Tool() {
  const [input, setInput] = useState("");
  const [encoded, setEncoded] = useState("");
  const [decoded, setDecoded] = useState("");
  const [decodeError, setDecodeError] = useState("");

  const encode = () => setEncoded(btoa(unescape(encodeURIComponent(input))));
  const decode = () => {
    try {
      setDecoded(decodeURIComponent(escape(atob(input))));
      setDecodeError("");
    } catch { setDecodeError("Invalid Base64"); }
  };

  return (
    <div className="space-y-2">
      <Textarea value={input} onChange={setInput} placeholder="Enter text or Base64..." rows={3} />
      <div className="flex gap-2">
        <button onClick={encode} className="flex-1 py-1.5 bg-primary text-white text-xs rounded-lg">Encode →</button>
        <button onClick={decode} className="flex-1 py-1.5 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20">← Decode</button>
      </div>
      {encoded && (
        <div className="relative"><Textarea value={encoded} rows={2} />
          <div className="absolute top-1 right-1"><CopyButton text={encoded} /></div>
        </div>
      )}
      {decodeError && <p className="text-red-400 text-xs">{decodeError}</p>}
      {decoded && (
        <div className="relative"><Textarea value={decoded} rows={2} />
          <div className="absolute top-1 right-1"><CopyButton text={decoded} /></div>
        </div>
      )}
    </div>
  );
}

// Timestamp Converter
function TimestampTool() {
  const [ts, setTs] = useState(String(Math.floor(Date.now() / 1000)));
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16));

  const tsNum = Number(ts);
  const fromTs = isNaN(tsNum) ? null : new Date(tsNum < 1e12 ? tsNum * 1000 : tsNum);
  const { copy } = useCopy();

  const now = () => {
    const n = Math.floor(Date.now() / 1000);
    setTs(String(n));
  };

  const fromDate = () => {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) setTs(String(Math.floor(d.getTime() / 1000)));
  };

  const fields = fromTs ? [
    { label: "ISO 8601", value: fromTs.toISOString() },
    { label: "UTC", value: fromTs.toUTCString() },
    { label: "Local", value: fromTs.toLocaleString() },
    { label: "Unix (s)", value: String(Math.floor(fromTs.getTime() / 1000)) },
    { label: "Unix (ms)", value: String(fromTs.getTime()) },
  ] : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={ts}
          onChange={e => setTs(e.target.value)}
          placeholder="Unix timestamp"
          className="flex-1 bg-black/30 border border-white/15 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-primary font-mono"
        />
        <button onClick={now} className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg flex items-center gap-1">
          <RefreshCw size={11} /> Now
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="datetime-local"
          value={dateStr}
          onChange={e => setDateStr(e.target.value)}
          className="flex-1 bg-black/30 border border-white/15 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-primary"
        />
        <button onClick={fromDate} className="px-3 py-1.5 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20">→ Unix</button>
      </div>
      {fields.map(f => (
        <div key={f.label} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
          <span className="text-white/40 text-xs w-20 shrink-0">{f.label}</span>
          <span className="text-white/90 text-xs font-mono flex-1 text-right truncate">{f.value}</span>
          <button onClick={() => copy(f.value)} className="ml-2 text-white/30 hover:text-white transition-colors shrink-0"><Copy size={11} /></button>
        </div>
      ))}
    </div>
  );
}

// Regex Tester
function RegexTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Hello World! Test 123.");
  const [replaceWith, setReplaceWith] = useState("");

  let matches: RegExpMatchArray[] = [];
  let error = "";
  let replaced = "";

  try {
    if (pattern) {
      const re = new RegExp(pattern, flags);
      const all = [...text.matchAll(new RegExp(pattern, flags.includes("g") ? flags : flags + "g"))];
      matches = all;
      if (replaceWith !== "") replaced = text.replace(re, replaceWith);
    }
  } catch (e) { error = (e as Error).message; }

  const highlighted = pattern && !error
    ? text.replace(new RegExp(pattern, flags.includes("g") ? flags : flags + "g"), m => `__MATCH__${m}__ENDMATCH__`)
    : text;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 flex bg-black/30 border border-white/15 rounded-lg overflow-hidden">
          <span className="text-white/40 px-2 py-1.5 text-xs font-mono">/</span>
          <input
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="pattern"
            className="flex-1 bg-transparent text-white text-xs py-1.5 outline-none font-mono"
          />
          <span className="text-white/40 px-1 py-1.5 text-xs font-mono">/</span>
          <input
            value={flags}
            onChange={e => setFlags(e.target.value)}
            className="w-10 bg-transparent text-primary text-xs py-1.5 outline-none font-mono"
          />
        </div>
      </div>
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <Textarea value={text} onChange={setText} placeholder="Test string..." rows={3} />
      {!error && pattern && (
        <div className="bg-black/20 rounded-lg p-2 text-xs">
          {highlighted.split("__MATCH__").map((part, i) => {
            if (i === 0) return <span key={i} className="text-white/70 font-mono">{part}</span>;
            const [match, rest] = part.split("__ENDMATCH__");
            return (
              <span key={i}>
                <span className="bg-yellow-400/30 text-yellow-200 rounded px-0.5 font-mono">{match}</span>
                <span className="text-white/70 font-mono">{rest}</span>
              </span>
            );
          })}
          <p className="text-white/40 mt-1">{matches.length} match{matches.length !== 1 ? "es" : ""}</p>
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={replaceWith}
          onChange={e => setReplaceWith(e.target.value)}
          placeholder="Replace with..."
          className="flex-1 bg-black/30 border border-white/15 text-white text-xs rounded-lg px-2 py-1.5 outline-none font-mono"
        />
      </div>
      {replaced && (
        <div className="relative">
          <Textarea value={replaced} rows={2} />
          <div className="absolute top-1 right-1"><CopyButton text={replaced} /></div>
        </div>
      )}
    </div>
  );
}

// Color Tool
function ColorTool() {
  const [color, setColor] = useState("#4F46E5");
  const { copy } = useCopy();

  const hex = color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  const hsl = (() => {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      else if (max === gn) h = ((bn - rn) / d + 2) / 6;
      else h = ((rn - gn) / d + 4) / 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  })();

  const variants = [
    { name: "Lighter", bg: `rgba(${r},${g},${b},0.3)` },
    { name: "Base", bg: hex },
    { name: "Darker", bg: `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})` },
    { name: "Complementary", bg: `rgb(${255 - r},${255 - g},${255 - b})` },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-center">
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent"
        />
        <input
          value={color}
          onChange={e => setColor(e.target.value)}
          className="flex-1 bg-black/30 border border-white/15 text-white text-sm rounded-lg px-3 py-2 outline-none font-mono focus:border-primary"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {variants.map(v => (
          <div
            key={v.name}
            className="flex-1 min-w-[60px] h-12 rounded-lg cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: v.bg }}
            onClick={() => copy(v.bg)}
            title={`Click to copy: ${v.bg}`}
          />
        ))}
      </div>
      {[
        { label: "HEX", value: hex },
        { label: "RGB", value: rgb },
        { label: "HSL", value: hsl },
      ].map(f => (
        <div key={f.label} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
          <span className="text-white/40 text-xs w-10">{f.label}</span>
          <span className="text-white/90 text-xs font-mono">{f.value}</span>
          <button onClick={() => copy(f.value)} className="text-white/30 hover:text-white"><Copy size={11} /></button>
        </div>
      ))}
    </div>
  );
}

// Lorem Ipsum
function LoremTool() {
  const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
  const [paragraphs, setParagraphs] = useState(2);
  const [type, setType] = useState<"words" | "sentences" | "paragraphs">("paragraphs");
  const [count, setCount] = useState(5);

  const generate = () => {
    const words = LOREM.replace(/[.,]/g, "").split(" ");
    if (type === "words") {
      const arr = [];
      for (let i = 0; i < count; i++) arr.push(words[i % words.length]);
      return arr.join(" ");
    }
    if (type === "sentences") {
      const sentences = LOREM.split(". ");
      return Array.from({ length: count }, (_, i) => sentences[i % sentences.length]).join(". ") + ".";
    }
    return Array.from({ length: paragraphs }).map(() => LOREM).join("\n\n");
  };

  const result = generate();

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {(["words", "sentences", "paragraphs"] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-1 text-xs rounded ${type === t ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {type !== "paragraphs" ? (
        <input type="number" value={count} onChange={e => setCount(Number(e.target.value))} min={1} max={100}
          className="w-full bg-black/30 border border-white/15 text-white text-xs rounded-lg px-2 py-1.5 outline-none" />
      ) : (
        <input type="number" value={paragraphs} onChange={e => setParagraphs(Number(e.target.value))} min={1} max={10}
          className="w-full bg-black/30 border border-white/15 text-white text-xs rounded-lg px-2 py-1.5 outline-none" />
      )}
      <div className="relative">
        <Textarea value={result} rows={5} mono={false} />
        <div className="absolute top-1 right-1"><CopyButton text={result} /></div>
      </div>
    </div>
  );
}

// UUID Generator
function UuidTool() {
  const gen = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

  const [uuids, setUuids] = useState(() => Array.from({ length: 5 }, gen));
  const { copy } = useCopy();

  return (
    <div className="space-y-2">
      <button onClick={() => setUuids(Array.from({ length: 5 }, gen))}
        className="w-full py-1.5 bg-primary text-white text-xs rounded-lg flex items-center justify-center gap-1">
        <RefreshCw size={12} /> Generate 5 UUIDs
      </button>
      {uuids.map((id, i) => (
        <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
          <span className="text-white/80 text-xs font-mono">{id}</span>
          <button onClick={() => copy(id)} className="text-white/30 hover:text-white ml-2"><Copy size={11} /></button>
        </div>
      ))}
    </div>
  );
}

// CSS Gradient Generator
function GradientTool() {
  const [type, setType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(135);
  const [colors, setColors] = useState(["#4F46E5", "#7C3AED", "#EC4899"]);
  const { copy } = useCopy();

  const css = type === "linear"
    ? `linear-gradient(${angle}deg, ${colors.join(", ")})`
    : `radial-gradient(circle, ${colors.join(", ")})`;

  const addColor = () => setColors(c => [...c, "#" + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0")]);
  const removeColor = (i: number) => setColors(c => c.filter((_, j) => j !== i));
  const updateColor = (i: number, v: string) => setColors(c => c.map((col, j) => j === i ? v : col));

  return (
    <div className="space-y-3">
      <div className="h-20 rounded-xl border border-white/15" style={{ background: css }} />
      <div className="flex gap-2">
        {(["linear", "radial"] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-1 text-xs rounded ${type === t ? "bg-primary text-white" : "bg-white/10 text-white/60"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {type === "linear" && (
        <div>
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>Angle</span><span>{angle}°</span>
          </div>
          <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(Number(e.target.value))}
            className="w-full accent-primary" />
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-1">
            <input type="color" value={c} onChange={e => updateColor(i, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0" />
            {colors.length > 2 && (
              <button onClick={() => removeColor(i)} className="text-white/30 hover:text-red-400"><X size={10} /></button>
            )}
          </div>
        ))}
        <button onClick={addColor} className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 text-lg">+</button>
      </div>
      <div className="relative bg-black/30 rounded-lg p-2">
        <code className="text-xs text-green-300 font-mono block break-all">{css}</code>
        <div className="absolute top-1 right-1"><CopyButton text={css} /></div>
      </div>
    </div>
  );
}

// URL Encoder
function UrlTool() {
  const [input, setInput] = useState("");
  const encoded = (() => { try { return encodeURIComponent(input); } catch { return ""; } })();
  const decoded = (() => { try { return decodeURIComponent(input); } catch { return "Invalid"; } })();

  const parseUrl = (() => {
    try {
      const u = new URL(input.startsWith("http") ? input : "https://" + input);
      return {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || "—",
        pathname: u.pathname,
        search: u.search || "—",
        hash: u.hash || "—",
      };
    } catch { return null; }
  })();

  return (
    <div className="space-y-2">
      <Textarea value={input} onChange={setInput} placeholder="Enter URL or text..." rows={2} />
      {input && (
        <>
          <div className="relative bg-black/20 rounded-lg p-2">
            <p className="text-white/40 text-[10px] mb-1">ENCODED</p>
            <code className="text-xs text-green-300 font-mono break-all">{encoded}</code>
            <div className="absolute top-1 right-1"><CopyButton text={encoded} /></div>
          </div>
          <div className="relative bg-black/20 rounded-lg p-2">
            <p className="text-white/40 text-[10px] mb-1">DECODED</p>
            <code className="text-xs text-yellow-300 font-mono break-all">{decoded}</code>
            <div className="absolute top-1 right-1"><CopyButton text={decoded} /></div>
          </div>
          {parseUrl && (
            <div className="space-y-1">
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Parsed URL</p>
              {Object.entries(parseUrl).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                  <span className="text-white/40 text-xs capitalize w-20">{k}</span>
                  <span className="text-white/80 text-xs font-mono truncate">{v}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Hash Tool (using SubtleCrypto)
function HashTool() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const { copy } = useCopy();

  const compute = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const results: Record<string, string> = {};
    for (const algo of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"]) {
      const buf = await crypto.subtle.digest(algo, data);
      results[algo] = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    setHashes(results);
  };

  return (
    <div className="space-y-2">
      <Textarea value={input} onChange={setInput} placeholder="Enter text to hash..." rows={3} />
      <button onClick={compute} className="w-full py-1.5 bg-primary text-white text-xs rounded-lg">Compute Hashes</button>
      {Object.entries(hashes).map(([algo, hash]) => (
        <div key={algo} className="bg-black/20 rounded-lg p-2">
          <p className="text-white/40 text-[10px] mb-1">{algo}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-green-300 font-mono break-all">{hash}</code>
            <button onClick={() => copy(hash)} className="text-white/30 hover:text-white shrink-0"><Copy size={11} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Text Diff
function DiffTool() {
  const [a, setA] = useState("Hello World\nFoo bar");
  const [b, setB] = useState("Hello World!\nFoo baz");

  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const maxLen = Math.max(aLines.length, bLines.length);
  const lines = Array.from({ length: maxLen }, (_, i) => ({
    a: aLines[i] ?? "",
    b: bLines[i] ?? "",
    same: aLines[i] === bLines[i],
  }));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-white/40 text-[10px] mb-1">ORIGINAL</p>
          <Textarea value={a} onChange={setA} rows={4} />
        </div>
        <div>
          <p className="text-white/40 text-[10px] mb-1">MODIFIED</p>
          <Textarea value={b} onChange={setB} rows={4} />
        </div>
      </div>
      <div className="space-y-0.5 max-h-40 overflow-y-auto">
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-2 gap-1 text-xs font-mono">
            <div className={`px-2 py-0.5 rounded-sm ${line.same ? "text-white/50" : "bg-red-500/15 text-red-300"}`}>
              {line.a || " "}
            </div>
            <div className={`px-2 py-0.5 rounded-sm ${line.same ? "text-white/50" : "bg-green-500/15 text-green-300"}`}>
              {line.b || " "}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TOOL_COMPONENTS: Record<ToolId, React.ReactNode> = {
  json: <JsonTool />,
  base64: <Base64Tool />,
  timestamp: <TimestampTool />,
  regex: <RegexTool />,
  color: <ColorTool />,
  lorem: <LoremTool />,
  hash: <HashTool />,
  uuid: <UuidTool />,
  "css-gradient": <GradientTool />,
  url: <UrlTool />,
  diff: <DiffTool />,
};

export function DevTools() {
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId>("json");

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-6 z-20 glass p-3 rounded-full text-white/60 hover:text-white hover:scale-110 transition-all shadow-lg"
        title="Developer Tools"
        data-testid="devtools-toggle-button"
      >
        <Code size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed right-6 bottom-36 z-40 glass-card rounded-2xl shadow-2xl w-96 max-h-[70vh] flex flex-col border border-white/15 overflow-hidden"
            data-testid="devtools-panel"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-primary" />
                <span className="text-white font-semibold text-sm">Dev Tools</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tool tabs */}
            <div className="flex gap-0.5 p-2 flex-wrap border-b border-white/10 shrink-0">
              {TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                    activeTool === tool.id
                      ? "bg-primary text-white"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  data-testid={`tool-tab-${tool.id}`}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {TOOL_COMPONENTS[activeTool]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
