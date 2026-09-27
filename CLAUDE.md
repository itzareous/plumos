# Plumos

A web "home screen OS" for a home server: wallpaper, greeting, glass widgets,
an app grid, a dock of built-in apps and ⌘K search. Inspired by umbrelOS, but
all artwork, copy and code here are original.

## Commands

- `npm run dev` — Vite dev server (also serves `/api/*`, see `server/api.mjs`)
- `npm run typecheck` — must pass before committing
- `npm run build && npm start` — production build served by `server/index.mjs` on :8080
- `npm run wallpapers [id]` — re-render wallpapers from `scripts/wallpapers/*.mjs` to `public/wallpapers/`

## Stack

React 19 + TypeScript, Vite 8, Tailwind CSS v4 (CSS-first config in `src/index.css`),
`motion` (Framer Motion) for animation, `zustand` for state, `lucide-react` for glyphs.
Import from `@/…` (maps to `src/`). No other runtime deps without a good reason.

## Layout

- `src/components/home/` — home screen: `Home`, `Greeting`, `AppGrid`, `Dock`, `SearchButton`, `CommandPalette`, `Wallpaper`
- `src/components/widgets/` — home widgets; register new ones in `registry.ts`
- `src/components/ui/` — shared primitives: `Glass` (liquid glass), `Button`/`IconButton`,
  `controls.tsx` (`Input`, `Switch`, `Segmented`, `ProgressBar`, `Card`, `Row`, `SectionTitle`, `Badge`),
  `Sheet.tsx` (`SheetHost`, `SheetPage`), `ContextMenu`, `Toaster`
- `src/components/icons/` — `art.tsx` (hand-drawn 100×100 icon artwork keyed by id), `AppIcon`, `Logo`, `FolderIcon`
- `src/system-apps/<id>/index.tsx` — built-in apps opened as sheets; registered in `system-apps/registry.ts`
- `src/apps/` — app catalog (`catalog.ts`) and types (`types.ts`)
- `src/stores/` — zustand stores: `settings` (persisted), `apps` (installed apps, persisted),
  `system` (live stats + history), `windows` (open sheet, palette), `toasts`
- `src/lib/` — helpers: `format.ts`, `launch.ts`, `wallpapers.ts`, `greeting.ts`, `cn.ts`
- `server/` — zero-dependency Node server; `system.mjs` reads real CPU/memory/disk stats

## Conventions

- Built-in apps are sheets. A sheet component receives `{ params }` (strings) and
  usually renders `<SheetPage title=…>`; apps with a sidebar render their own layout
  inside the sheet (leave ~64px clear at the top-right for the close button).
  Open one with `useWindows.getState().open('files', { path: '/Home/Photos' })`.
- Everything is dark UI on top of the wallpaper. Use `glass-dark` for menus/dialogs,
  `<Glass>` for surfaces sitting directly on the wallpaper, and white-alpha fills
  (`bg-white/[0.06]`, `ring-white/10`) inside sheets. Accent colour: `bg-accent`/`text-accent`.
- Text on the wallpaper gets the `text-on-wallpaper` class.
- When there is no backend, everything must still work with realistic demo data
  (see `stores/system.ts` for the pattern).
- Artwork must be original: no third-party logos, trademarks or copied UI. App icons
  evoke their category with our own shapes.
- Keep components small and files focused; match the existing code style
  (no semicolons, single quotes, 2-space indent, 120 cols).
