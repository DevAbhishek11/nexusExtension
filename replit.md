# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

### Chrome New Tab Extension (`artifacts/newtab-extension`)
A modern, feature-rich Chrome New Tab Extension built with React + Vite + Tailwind CSS.

**Features:**
- Beautiful glassmorphism UI with dark/light/auto theme support
- Live clock with greeting, day, and full date
- Google search bar (switchable to Bing, DuckDuckGo, Brave, Yahoo)
- Weather widget using wttr.in (no API key needed), auto-location or manual city
- Quick links with drag-and-drop reorder, categories, favicon auto-fetch
- Pomodoro timer widget
- To-do list widget
- Notes widget
- Daily quotes widget
- Command palette (Ctrl+K) for quick navigation
- Settings panel: wallpaper presets + upload, blur/brightness/overlay controls
- Font selector: Inter, Poppins, Playfair Display, JetBrains Mono
- Multi-task panel: open websites in draggable floating panels
- Clean mode (hide all widgets)
- Premium modal with Razorpay ₹49 one-time payment
- Ad banner (idle-triggered, non-intrusive, hidden for premium users)
- Import/export settings
- Chrome Manifest V3 ready (`public/manifest.json`, `public/background.js`)

**Key files:**
- `src/pages/NewTab.tsx` — main page
- `src/store/useStore.ts` — global state (localStorage)
- `src/components/` — all widget components
- `src/hooks/` — useTheme, useWeather, useClock, useIdleDetect
- `public/manifest.json` — Chrome Extension manifest V3

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/newtab-extension run dev` — run New Tab extension dev server

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
