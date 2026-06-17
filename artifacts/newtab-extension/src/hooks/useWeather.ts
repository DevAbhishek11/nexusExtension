import { useState, useEffect, useCallback } from "react";

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Open-Meteo free API (no key needed) with wttr.in for city search
async function fetchWeatherByCity(city: string, unit: "celsius" | "fahrenheit"): Promise<WeatherData> {
  const cached = weatherCache.get(city + unit);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Use wttr.in JSON API - no key needed
  const unitParam = unit === "fahrenheit" ? "&u" : "&m";
  const resp = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1${unitParam}`);
  if (!resp.ok) throw new Error("Weather unavailable");
  const json = await resp.json();
  const current = json.current_condition[0];
  const area = json.nearest_area[0];

  const temp = unit === "fahrenheit"
    ? Number(current.temp_F)
    : Number(current.temp_C);
  const feelsLike = unit === "fahrenheit"
    ? Number(current.FeelsLikeF)
    : Number(current.FeelsLikeC);

  const data: WeatherData = {
    city: area.areaName[0].value + ", " + area.country[0].value,
    temp,
    condition: current.weatherDesc[0].value,
    icon: getWeatherEmoji(Number(current.weatherCode)),
    humidity: Number(current.humidity),
    windSpeed: Number(current.windspeedKmph),
    feelsLike,
  };

  weatherCache.set(city + unit, { data, timestamp: Date.now() });
  return data;
}

async function fetchWeatherByCoords(lat: number, lon: number, unit: "celsius" | "fahrenheit"): Promise<WeatherData> {
  return fetchWeatherByCity(`${lat},${lon}`, unit);
}

function getWeatherEmoji(code: number): string {
  if (code === 113) return "☀️";
  if (code === 116) return "⛅";
  if (code === 119 || code === 122) return "☁️";
  if ([143, 248, 260].includes(code)) return "🌫️";
  if ([176, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(code)) return "🌧️";
  if ([179, 182, 185, 227, 230, 281, 284, 311, 314, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(code)) return "🌨️";
  if ([200, 386, 389, 392, 395].includes(code)) return "⛈️";
  return "🌤️";
}

export function useWeather(city: string, unit: "celsius" | "fahrenheit") {
  const [state, setState] = useState<WeatherState>({ data: null, loading: false, error: null });

  const fetchWeather = useCallback(async (cityName: string) => {
    if (!cityName) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchWeatherByCity(cityName, unit);
      setState({ data, loading: false, error: null });
    } catch {
      setState(s => ({ ...s, loading: false, error: "Weather unavailable" }));
    }
  }, [unit]);

  const fetchByLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation not supported" }));
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, unit);
          setState({ data, loading: false, error: null });
        } catch {
          setState(s => ({ ...s, loading: false, error: "Weather unavailable" }));
        }
      },
      () => setState(s => ({ ...s, loading: false, error: "Location access denied" }))
    );
  }, [unit]);

  useEffect(() => {
    if (city) {
      fetchWeather(city);
    } else {
      fetchByLocation();
    }
  }, [city, fetchWeather, fetchByLocation]);

  return { ...state, refetch: city ? () => fetchWeather(city) : fetchByLocation };
}
