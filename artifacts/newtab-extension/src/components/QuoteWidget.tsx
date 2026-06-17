import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Quote } from "lucide-react";
import { useSettings } from "@/store/useStore";

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Success is not final; failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { text: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { text: "You will face many defeats in life, but never let yourself be defeated.", author: "Maya Angelou" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
];

function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

export function QuoteWidget() {
  const { settings } = useSettings();
  const [quote, setQuote] = useState(getDailyQuote());
  const [fadeKey, setFadeKey] = useState(0);

  if (!settings.showQuote) return null;

  const randomize = () => {
    const idx = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[idx]);
    setFadeKey(k => k + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="text-center max-w-xl mx-auto"
      data-testid="quote-widget"
    >
      <motion.div key={fadeKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <Quote className="w-5 h-5 text-white/30 mx-auto mb-2" />
        <p className="text-white/70 text-sm italic leading-relaxed">"{quote.text}"</p>
        <p className="text-white/40 text-xs mt-1">— {quote.author}</p>
      </motion.div>
      <button
        onClick={randomize}
        className="mt-2 text-white/30 hover:text-white/60 transition-colors"
        data-testid="refresh-quote-button"
      >
        <RefreshCw size={12} />
      </button>
    </motion.div>
  );
}
