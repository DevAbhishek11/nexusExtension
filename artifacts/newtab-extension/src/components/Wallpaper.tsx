import { useSettings, useCustomWallpapers } from "@/store/useStore";

export function Wallpaper() {
  const { settings } = useSettings();
  const { resolveWallpaper } = useCustomWallpapers();

  const gradientBg = "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)";

  const overlayStyle = {
    background: `rgba(0,0,0,${settings.wallpaperOverlayOpacity / 100})`,
  };

  const resolvedSrc = resolveWallpaper(settings.wallpaper);

  if (!resolvedSrc) {
    return (
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: gradientBg,
            filter: settings.wallpaperBlur > 0 ? `blur(${settings.wallpaperBlur}px)` : undefined,
          }}
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse at 30% 40%, rgba(120,80,255,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(59,130,246,0.3) 0%, transparent 60%)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      <img
        src={resolvedSrc}
        alt="Wallpaper"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: [
            settings.wallpaperBlur > 0 ? `blur(${settings.wallpaperBlur}px)` : "",
            settings.wallpaperBrightness !== 100 ? `brightness(${settings.wallpaperBrightness}%)` : "",
          ].filter(Boolean).join(" ") || undefined,
        }}
      />
      <div className="absolute inset-0" style={overlayStyle} />
    </div>
  );
}
