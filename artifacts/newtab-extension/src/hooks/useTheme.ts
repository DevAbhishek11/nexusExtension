import { useEffect } from "react";
import { useSettings } from "@/store/useStore";

export function useTheme() {
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: string) => {
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (settings.theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => { mq.removeEventListener("change", handler); };
    } else {
      applyTheme(settings.theme);
      return;
    }
  }, [settings.theme]);

  useEffect(() => {
    const fontMap: Record<string, string> = {
      Inter: "'Inter', sans-serif",
      Poppins: "'Poppins', sans-serif",
      "Playfair Display": "'Playfair Display', serif",
      "JetBrains Mono": "'JetBrains Mono', monospace",
    };
    const fontValue = fontMap[settings.font] || "'Inter', sans-serif";
    document.documentElement.style.setProperty("--app-font-sans", fontValue);
  }, [settings.font]);

  const toggleTheme = () => {
    const order: Array<"light" | "dark" | "auto"> = ["light", "dark", "auto"];
    const idx = order.indexOf(settings.theme);
    updateSettings({ theme: order[(idx + 1) % order.length] });
  };

  return { theme: settings.theme, toggleTheme };
}
