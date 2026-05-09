# JS Event Loop Visualizer

Educational SPA built with vanilla JavaScript that illustrates the JavaScript event loop. Deployable on GitHub Pages.

## Structure

- `index.html` — SPA shell with sidebar nav and hash-based routing
- `js/hub.js` — Live event loop visualization with step-through execution
- `js/playground.js` — Interactive code editor with event loop stepper (6 presets + custom code)
- `js/nodejs.js` — libuv phase diagram with auto-cycling phase indicator
- `js/browser.js` — Browser rendering pipeline and Web API reference
- `js/memory.js` — Hoisting, TDZ, closure, and scope chain reference

## How to Use

Open `index.html` in a browser or deploy to GitHub Pages. No build step — standalone HTML + vanilla JS.

## Key Features

- **Hash-routed SPA** (`#hub`, `#playground`, `#nodejs`, `#browser`, `#memory`)
- **Hub**: step forward/back/reset/auto-play through pre-built event loop scenarios with animated call stack, microtask/macrotask queues, and console output
- **Playground**: 6 preset code examples + custom code input. Run step-by-step or auto-play. See the event loop phases in action
- **Node.js**: Cycling phase indicator shows libuv's 6 phases with microtask checkpoints between each
- **Browser**: Rendering pipeline (Style → Layout → Paint → Composite) with trigger annotations
- **Memory**: Hoisting table, TDZ visualization, closure memory, scope chain
