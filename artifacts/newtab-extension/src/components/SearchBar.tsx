import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, Globe, ChevronDown, ArrowRight } from "lucide-react";
import { useSettings } from "@/store/useStore";

const ENGINES: Record<string, { name: string; url: string; placeholder: string; color: string; logo: string }> = {
  google:     { name: "Google",     url: "https://www.google.com/search?q=",          placeholder: "Search Google or enter URL...", color: "#4285F4", logo: "🔍" },
  bing:       { name: "Bing",       url: "https://www.bing.com/search?q=",            placeholder: "Search Bing...",                color: "#00809D", logo: "🅱" },
  duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=",               placeholder: "Search with privacy...",        color: "#DE5833", logo: "🦆" },
  brave:      { name: "Brave",      url: "https://search.brave.com/search?q=",       placeholder: "Search Brave...",               color: "#FB542B", logo: "🦁" },
  yahoo:      { name: "Yahoo",      url: "https://search.yahoo.com/search?p=",       placeholder: "Search Yahoo...",               color: "#720E9E", logo: "Y!" },
  perplexity: { name: "Perplexity", url: "https://www.perplexity.ai/search?q=",     placeholder: "Ask Perplexity AI...",          color: "#20B2AA", logo: "✦" },
  github:     { name: "GitHub",     url: "https://github.com/search?q=",             placeholder: "Search GitHub repositories...", color: "#24292E", logo: "⬡" },
  mdn:        { name: "MDN Docs",   url: "https://developer.mozilla.org/en-US/search?q=", placeholder: "Search MDN...",            color: "#0099FF", logo: "📖" },
};

const QUICK_SUGGESTIONS = [
  "weather today",
  "what time is it",
  "currency converter",
  "ip address lookup",
  "color picker",
];

export function SearchBar() {
  const { settings, updateSettings } = useSettings();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [showEngines, setShowEngines] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const engine = ENGINES[settings.searchEngine] || ENGINES.google;
  const isUrl = /^(https?:\/\/|www\.|localhost)/.test(query);

  const handleSearch = useCallback((q: string = query) => {
    if (!q.trim()) return;
    const trimmed = q.trim();
    if (/^(https?:\/\/|www\.|localhost)/.test(trimmed)) {
      window.location.href = trimmed.startsWith("http") ? trimmed : "https://" + trimmed;
    } else {
      window.location.href = engine.url + encodeURIComponent(trimmed);
    }
  }, [query, engine.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      setTimeout(() => handleSearch(transcript), 100);
    };
    recognition.start();
  };

  // Close engine picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowEngines(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto relative" data-testid="search-bar-container">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
      >
        <motion.div
          className="relative flex items-center rounded-2xl overflow-visible"
          animate={{
            boxShadow: focused
              ? "0 0 0 2px rgba(99,102,241,0.4), 0 20px 60px rgba(0,0,0,0.35)"
              : "0 8px 32px rgba(0,0,0,0.25)",
          }}
          transition={{ duration: 0.2 }}
        >
          <div className={`w-full flex items-center rounded-2xl transition-all duration-200 ${focused ? "glass" : "glass"}`}>
            {/* Engine selector */}
            <button
              type="button"
              onClick={() => setShowEngines(!showEngines)}
              className="flex items-center gap-1.5 pl-4 pr-2 py-4 text-white/50 hover:text-white transition-colors shrink-0 group"
              title="Switch search engine"
              data-testid="engine-selector"
            >
              <span className="text-base">{engine.logo}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${showEngines ? "rotate-180" : ""}`}
              />
            </button>

            <div className="w-px h-5 bg-white/15 shrink-0" />

            {/* Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder={engine.placeholder}
                className="w-full bg-transparent text-white placeholder:text-white/40 py-4 px-4 text-[15px] outline-none border-0"
                autoComplete="off"
                spellCheck={false}
                data-testid="search-input"
              />
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 pr-3">
              <AnimatePresence>
                {query && (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    type="button"
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className="text-white/40 hover:text-white/80 transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
                  >
                    ×
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={startVoiceSearch}
                className="text-white/40 hover:text-white/80 transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
                data-testid="voice-search-button"
                title="Voice search"
              >
                <Mic size={15} />
              </button>

              {isUrl && (
                <div className="text-white/40 flex items-center gap-1">
                  <Globe size={13} />
                </div>
              )}

              <button
                type="submit"
                className="bg-primary/80 hover:bg-primary text-white rounded-xl p-1.5 ml-1 transition-all hover:scale-110"
                title="Search"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.form>

      {/* Engine picker dropdown */}
      <AnimatePresence>
        {showEngines && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 right-0 glass rounded-2xl shadow-2xl z-50 p-2 grid grid-cols-2 gap-1"
            data-testid="engine-dropdown"
          >
            {Object.entries(ENGINES).map(([key, eng]) => (
              <button
                key={key}
                onClick={() => {
                  updateSettings({ searchEngine: key });
                  setShowEngines(false);
                  inputRef.current?.focus();
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  settings.searchEngine === key
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="text-lg w-6 text-center">{eng.logo}</span>
                <span className="font-medium">{eng.name}</span>
                {settings.searchEngine === key && <span className="ml-auto text-indigo-300 text-xs">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick suggestions (shown when focused and empty) */}
      <AnimatePresence>
        {focused && !query && !showEngines && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 right-0 glass rounded-2xl shadow-xl z-40 p-3"
          >
            <p className="text-white/30 text-[10px] uppercase tracking-wider px-1 mb-2">Quick search</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onMouseDown={() => handleSearch(s)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
