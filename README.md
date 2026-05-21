# Emonor

Emoji-tagged personal GIF library with one-click copy.

**[Live Demo →](https://dennougorilla.github.io/emonor/)**

## Features

- **Emoji tags** — Categorize GIFs with intuitive emoji labels (😂 Funny, 🔥 Hype, ❤️ Love, etc.)
- **1-click copy** — Click any GIF card to copy its URL to clipboard instantly
- **Offline-ready** — All data stored in localStorage, works without internet
- **Zero dependencies** — No runtime dependencies, pure vanilla TypeScript
- **No account required** — No sign-up, no backend, instant start
- **Import/Export** — Full data portability via JSON
- **Keyboard shortcuts** — `N` to add, `1`-`7` to filter, `0` to reset

## Tech Stack

| Category | Technology |
|----------|-----------|
| Language | Vanilla TypeScript (ES Modules, strict) |
| Build | Vite |
| Testing | Vitest + jsdom + coverage-v8 |
| Styling | Vanilla CSS with custom properties |
| Storage | localStorage |

## Quick Start

```bash
git clone https://github.com/dennougorilla/emonor.git
cd emonor
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Tests + coverage report |
| `npm run typecheck` | Type check without emitting |

## Architecture

Three-layer architecture with strict dependency direction:

```
src/
├── core/       ← Pure functions, zero side effects
├── services/   ← Side effects (localStorage, clipboard)
├── ui/         ← DOM component factories
└── main.ts     ← Composition root
```

- **core/** — Business logic, reducers, validators. Never imports from other layers.
- **services/** — localStorage persistence, clipboard API. Injectable and mockable.
- **ui/** — Factory functions returning `{ element, destroy }`. Subscribes to store.

## License

[MIT](LICENSE)
