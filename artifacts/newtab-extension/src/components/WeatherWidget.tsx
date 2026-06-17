import { motion } from "framer-motion";
import { Droplets, Wind, Thermometer, RefreshCw, MapPin } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { useSettings } from "@/store/useStore";

export function WeatherWidget() {
  const { settings } = useSettings();
  const { data, loading, error, refetch } = useWeather(settings.weatherCity, settings.weatherUnit);

  if (!settings.showWeather) return null;

  const unitLabel = settings.weatherUnit === "celsius" ? "°C" : "°F";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card rounded-2xl p-4 text-white min-w-[200px]"
      data-testid="weather-widget"
    >
      {loading && (
        <div className="flex items-center gap-2 text-white/70">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Loading weather...</span>
        </div>
      )}
      {error && (
        <div className="text-sm text-white/60">
          <p>{error}</p>
          <button onClick={refetch} className="text-white/80 hover:text-white text-xs mt-1 underline">
            Try again
          </button>
        </div>
      )}
      {data && !loading && (
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1 text-white/70 text-xs mb-1">
                <MapPin size={10} />
                <span className="truncate max-w-[120px]">{data.city}</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-light">{data.temp}</span>
                <span className="text-lg text-white/80 mb-1">{unitLabel}</span>
              </div>
              <p className="text-sm text-white/80 mt-1">{data.condition}</p>
            </div>
            <button onClick={refetch} className="text-3xl hover:scale-110 transition-transform">
              {data.icon}
            </button>
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <Droplets size={11} />
              <span>{data.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <Wind size={11} />
              <span>{data.windSpeed}km/h</span>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <Thermometer size={11} />
              <span>Feels {data.feelsLike}{unitLabel}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
