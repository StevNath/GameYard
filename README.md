# GameYard

A lightweight unified PC game launcher for Windows. Built with Tauri v2, Rust, SQLite, React, and TypeScript.

## Overview

GameYard consolidates games from Steam, Epic Games, Ubisoft Connect, GOG Galaxy, EA App, Battle.net, and local executables into a single interface. Designed for minimal resource usage (<100 MB idle RAM) and fast startup.

## Features

- **Unified Library** — Scan and manage games across 6 major storefronts plus local executables
- **Smart Launch** — Protocol-aware launching with silent background client mode
- **Auto-Kill Clients** — Optional 5-second grace period to terminate storefront clients after game exit, freeing RAM
- **Quick-Switch Pins** — Pin up to 2 games for instant access
- **Icon Extraction** — Native Win32 icon extraction for .exe files
- **Local-First** — SQLite WAL database, no cloud dependency
- **Candy-on-Black UI** — High-contrast dark theme with single cyan accent (#93F1F7)

## Screenshots

### Active Launch Stage (440px sidebar)
![Active Launch Stage](docs/screenshots/active-launch-stage.png)

### Library Index Table
![Library Index Table](docs/screenshots/library-index.png)

### Import Local .EXE
![Import Local EXE](docs/screenshots/import-exe.png)

## Requirements

- Windows 10/11
- WebView2 Runtime (included in Windows 11, auto-installed on Windows 10)

## Installation

Download the latest installer from [Releases](https://github.com/StevNath/GameYard/releases).

> **Note:** The installer is unsigned. Windows Smart App Control may block it. Options:
> - Run on a VM or secondary PC without Smart App Control
> - Use the browser preview: `npm run dev`
> - For production distribution, a code signing certificate is required

## Development

```bash
# Install dependencies
npm install

# Start dev server (browser preview)
npm run dev

# Build frontend
npm run build

# Build Tauri app (requires Rust toolchain)
npm run tauri build
```

### Project Structure

```
src/                    # React + TypeScript frontend
src-tauri/              # Rust backend
  src/
    main.rs             # Tauri commands & app entry
    db.rs               # SQLite schema & queries
    scanners.rs         # Storefront scanners (Steam, Epic, Ubisoft, GOG, EA, Battle.net)
    launcher/           # Process watcher & icon extractor
```

## Architecture

- **Tauri v2** — Native desktop shell with WebView2
- **Rust** — Backend logic, scanners, process watcher, icon extraction
- **SQLite WAL** — Local game catalog database
- **React 19 + Zustand** — Frontend state management
- **Tailwind CSS** — Utility-first styling with Candy-on-Black design system

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Canvas | `#000000` | App background |
| Surface | `#0D0D0D` | Panels, cards |
| Elevated | `#141414` | Modals, dropdowns |
| Border | `#262626` | Dividers, input borders |
| Ink | `#FFFFFF` | Primary text |
| Muted | `#A3A3A3` | Secondary text |
| Accent | `#93F1F7` | Primary CTA, active states |
| Warning | `#F59E0B` | Auth required, updates |

No gradients, no glassmorphism, no em-dashes.

## License

MIT — see [LICENSE](LICENSE) for details.

## Author

Steven Nathanael — [GitHub](https://github.com/StevNath)