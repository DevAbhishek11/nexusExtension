import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Play, Pause, Music2, Wind } from "lucide-react";

interface Sound {
  id: string;
  name: string;
  emoji: string;
  description: string;
  url: string;
}

const SOUNDS: Sound[] = [
  { id: "rain", name: "Rain", emoji: "🌧️", description: "Heavy rainfall", url: "https://www.soundjay.com/nature/sounds/rain-01.mp3" },
  { id: "forest", name: "Forest", emoji: "🌲", description: "Birds & wind", url: "https://www.soundjay.com/nature/sounds/forest-birdsong-01.mp3" },
  { id: "ocean", name: "Ocean", emoji: "🌊", description: "Waves crashing", url: "https://www.soundjay.com/nature/sounds/ocean-wave-01.mp3" },
  { id: "fire", name: "Fireplace", emoji: "🔥", description: "Crackling fire", url: "https://www.soundjay.com/nature/sounds/campfire-01.mp3" },
  { id: "cafe", name: "Café", emoji: "☕", description: "Coffee shop ambiance", url: "https://www.soundjay.com/misc/sounds/crowd-talking-01.mp3" },
  { id: "white", name: "White Noise", emoji: "📡", description: "Pure white noise", url: "https://www.soundjay.com/misc/sounds/static-01.mp3" },
];

// Tone generator fallback using Web Audio API
function createToneURL(type: OscillatorType, freq: number, gain: number): AudioContext | null { return null; }

function useTonePlayer(soundId: string | null, volume: number) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc?: OscillatorNode; gain?: GainNode; noise?: AudioBufferSourceNode; noiseGain?: GainNode } | null>(null);

  const stop = useCallback(() => {
    try {
      nodesRef.current?.osc?.stop();
      nodesRef.current?.noise?.stop();
    } catch {}
    nodesRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
  }, []);

  const play = useCallback((id: string, vol: number) => {
    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    if (id === "white") {
      // White noise
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = vol / 100 * 0.3;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      nodesRef.current = { noise: source, noiseGain: gain };
    } else if (id === "rain") {
      // Rain-like noise with filter
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.value = vol / 100 * 0.4;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      nodesRef.current = { noise: source, noiseGain: gain };
    } else if (id === "ocean") {
      // Ocean wave simulation
      const bufferSize = ctx.sampleRate * 6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(i / ctx.sampleRate * 0.5) * 0.5;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 600;
      const gain = ctx.createGain();
      gain.gain.value = vol / 100 * 0.5;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      nodesRef.current = { noise: source, noiseGain: gain };
    } else if (id === "fire") {
      // Crackling fire with low rumble
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.998 ? 1.0 : 0.02);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      const gain = ctx.createGain();
      gain.gain.value = vol / 100 * 0.4;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      nodesRef.current = { noise: source, noiseGain: gain };
    } else {
      // Generic noise for others
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = vol / 100 * 0.2;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      nodesRef.current = { noise: source, noiseGain: gain };
    }
  }, [stop]);

  const setVol = useCallback((vol: number) => {
    if (nodesRef.current?.noiseGain) {
      nodesRef.current.noiseGain.gain.value = vol / 100 * 0.3;
    }
    if (nodesRef.current?.gain) {
      nodesRef.current.gain.gain.value = vol / 100 * 0.3;
    }
  }, []);

  return { play, stop, setVol };
}

export function AmbientPlayer() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const { play, stop, setVol } = useTonePlayer(activeId, volume);

  const toggleSound = (id: string) => {
    if (activeId === id) {
      stop();
      setActiveId(null);
    } else {
      stop();
      play(id, muted ? 0 : volume);
      setActiveId(id);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    setVol(muted ? 0 : v);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setVol(next ? 0 : volume);
  };

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-[8.5rem] right-6 z-20 glass p-3 rounded-full transition-all shadow-lg hover:scale-110 ${activeId ? "text-primary border-primary/40" : "text-white/60 hover:text-white"}`}
        title="Ambient Sounds"
        data-testid="ambient-player-toggle"
      >
        {activeId ? (
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Music2 size={18} />
          </motion.div>
        ) : (
          <Wind size={18} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed right-6 bottom-[11rem] z-40 glass-card rounded-2xl shadow-2xl w-72 border border-white/15 overflow-hidden"
            data-testid="ambient-panel"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music2 size={14} className="text-primary" />
                <span className="text-white font-semibold text-sm">Ambient Sounds</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
            </div>

            {/* Volume */}
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-3">
              <VolumeX size={12} className="text-white/30 shrink-0" />
              <input
                type="range" min={0} max={100} value={volume}
                onChange={e => handleVolume(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <Volume2 size={12} className="text-white/30 shrink-0" />
              <span className="text-white/40 text-xs w-8 text-right">{volume}%</span>
            </div>

            {/* Sounds grid */}
            <div className="grid grid-cols-3 gap-2 p-3">
              {SOUNDS.map(sound => {
                const isActive = activeId === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => toggleSound(sound.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all text-center ${
                      isActive
                        ? "bg-primary/30 border border-primary/50 text-white scale-105 shadow-lg shadow-primary/20"
                        : "bg-white/8 border border-white/10 text-white/60 hover:text-white hover:bg-white/15 hover:border-white/20"
                    }`}
                    data-testid={`ambient-${sound.id}`}
                  >
                    <span className="text-xl">{sound.emoji}</span>
                    <span className="text-[11px] font-medium leading-tight">{sound.name}</span>
                    {isActive && (
                      <motion.div
                        className="flex gap-0.5 items-end h-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            className="w-0.5 bg-primary rounded-full"
                            animate={{ height: [4, 8 + i * 2, 4] }}
                            transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>

            {activeId && (
              <div className="px-4 py-2 border-t border-white/10 text-center">
                <p className="text-white/40 text-xs">
                  Playing: {SOUNDS.find(s => s.id === activeId)?.name}
                  {" "}&bull;{" "}
                  <button onClick={() => { stop(); setActiveId(null); }} className="text-red-400 hover:text-red-300">Stop</button>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
