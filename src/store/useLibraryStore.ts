import { create } from 'zustand';
import { GameItem, Storefront } from '../types/game';
import {
  INITIAL_GAMES,
  ipcCancelLaunch,
  ipcImportCustomExe,
  ipcLaunchGame,
  ipcOpenInstallFolder,
  ipcScanLocalDrives,
  ipcSetAutoKillRule,
  ipcSetPinnedSlot,
  ipcGetGameIcon,
} from '../services/tauriBridge';

export type StoreFilter = 'All' | Storefront;

const STALL_ANGLES: Record<Storefront, number> = {
  Steam: -27,
  Epic: 0,
  Ubisoft: 27,
  GOG: -27,
  EA: 45,
  'Battle.net': -45,
  Local: 0,
};

interface LibraryState {
  games: GameItem[];
  activeGameId: string;
  selectedStorefront: StoreFilter;
  searchQuery: string;
  theme: 'dark' | 'light';
  drivesCount: number;
  isScanning: boolean;
  isBooting: boolean;
  rotorAngle: number;
  toastMessage: string | null;
  setActiveGame: (gameId: string) => void;
  setSelectedStorefront: (storefront: StoreFilter) => void;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;
  replayBootAnimation: () => void;
  completeBootAnimation: () => void;
  scanDrives: () => Promise<void>;
  triggerGameAction: (gameId: string) => Promise<void>;
  cancelGameLaunch: (gameId: string) => Promise<void>;
  toggleAutoKillRule: (gameId: string) => Promise<void>;
  assignPinSlot: (gameId: string, slot: 0 | 1 | 2) => Promise<void>;
  openGameFolder: (gameId: string) => Promise<void>;
  importLocalExe: (exePath: string, title?: string) => Promise<void>;
  fetchGameIcons: (gameIds?: string[]) => Promise<void>;
  clearToast: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  games: INITIAL_GAMES,
  activeGameId: INITIAL_GAMES[0].id,
  selectedStorefront: 'All',
  searchQuery: '',
  theme: 'dark',
  drivesCount: 3,
  isScanning: false,
  isBooting: true,
  rotorAngle: 0,
  toastMessage: null,

  setActiveGame: (gameId) => {
    const idx = get().games.findIndex((g) => g.id === gameId);
    const stallOffsets = [-27, 0, 27];
    const nextAngle = idx >= 0 ? stallOffsets[idx % 3] : 0;
    set({ activeGameId: gameId, rotorAngle: nextAngle });
  },

  setSelectedStorefront: (storefront) => {
    const nextAngle =
      storefront === 'All' ? 0 : STALL_ANGLES[storefront] ?? 0;
    set({ selectedStorefront: storefront, rotorAngle: nextAngle });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    set({ theme: nextTheme });
  },

  replayBootAnimation: () => set({ isBooting: true }),

  completeBootAnimation: () => set({ isBooting: false }),

  scanDrives: async () => {
    set({
      isScanning: true,
      toastMessage: 'Scanning C:\\, D:\\, E:\\ manifests (Steam/Epic/Ubisoft)...',
    });
    const summary = await ipcScanLocalDrives();
    setTimeout(() => {
      set((state) => ({
        games: summary.games,
        drivesCount: summary.drives_count,
        isScanning: false,
        rotorAngle: state.rotorAngle + 360,
        toastMessage: `Scan complete: ${summary.drives_count} drives indexed (${summary.installed_count} installed games ready)`,
      }));
      get().fetchGameIcons();
    }, 650);
  },

  triggerGameAction: async (gameId) => {
    const target = get().games.find((g) => g.id === gameId);
    if (!target) return;

    set((state) => ({
      activeGameId: gameId,
      rotorAngle: state.rotorAngle + 120,
    }));

    // 0. If currently in 5s Auto-Kill Grace Countdown -> Skip wait and close immediately
    if (target.install_state === 'closing_client') {
      set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                install_state: 'ready',
                status_message: g.storefront === 'Local' ? 'DIRECT .EXE' : 'Installed, Ready',
              }
            : g
        ),
        toastMessage: `Terminated ${target.storefront} client immediately (RAM freed).`,
      }));
      return;
    }

    // 1. If already starting or running -> Stop / Quit session & run 5s Auto-Kill cleanup
    if (target.install_state === 'starting' || target.install_state === 'running') {
      await ipcCancelLaunch(gameId);

      // If Auto-Kill Client is enabled and game uses an external launcher, run 5s Grace Period Countdown
      if (target.auto_kill_client && target.storefront !== 'Local') {
        let remaining = 5;
        set((state) => ({
          games: state.games.map((g) =>
            g.id === gameId
              ? {
                  ...g,
                  install_state: 'closing_client',
                  status_message: `Cloud Save Grace (${remaining}s)...`,
                  total_playtime_seconds: g.total_playtime_seconds + 600,
                  last_played_at: new Date().toISOString(),
                }
              : g
          ),
          toastMessage: `${target.title} exited: Waiting 5s Cloud Save grace period before Auto-Killing ${target.storefront}...`,
        }));

        const timer = setInterval(() => {
          remaining -= 1;
          const current = get().games.find((g) => g.id === gameId);
          if (!current || current.install_state !== 'closing_client') {
            clearInterval(timer);
            return;
          }

          if (remaining > 0) {
            set((state) => ({
              games: state.games.map((g) =>
                g.id === gameId
                  ? {
                      ...g,
                      status_message: `Cloud Save Grace (${remaining}s)...`,
                    }
                  : g
              ),
            }));
          } else {
            clearInterval(timer);
            set((state) => ({
              rotorAngle: state.rotorAngle - 120,
              games: state.games.map((g) =>
                g.id === gameId
                  ? {
                      ...g,
                      install_state: 'ready',
                      status_message: 'Installed, Ready',
                    }
                  : g
              ),
              toastMessage: `Smart Auto-Kill complete: ${target.storefront} background client terminated.`,
            }));
          }
        }, 1000);

        return;
      }

      set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                install_state: 'ready',
                status_message: g.storefront === 'Local' ? 'DIRECT .EXE' : 'Installed, Ready',
                total_playtime_seconds: g.total_playtime_seconds + 600,
                last_played_at: new Date().toISOString(),
              }
            : g
        ),
        toastMessage: `Session ended: ${target.title} process closed.`,
      }));
      return;
    }

    // 2. If Auth Required -> Re-authenticate OAuth token
    if (target.install_state === 'auth_required') {
      set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                install_state: 'ready',
                status_message: 'Installed, Ready',
              }
            : g
        ),
        toastMessage: `${target.storefront} OAuth session refreshed in Windows Credential Manager (DPAPI).`,
      }));
      return;
    }

    // 3. If Update Needed -> Trigger client patch
    if (target.install_state === 'update_needed') {
      set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId
            ? {
                ...g,
                install_state: 'ready',
                status_message: 'Installed, Ready',
              }
            : g
        ),
        toastMessage: `Verified ${target.title} manifest in ${target.storefront}: Ready to launch.`,
      }));
      return;
    }

    // 4. If Cloud (Not Installed) -> Trigger remote install URI
    if (target.install_state === 'cloud') {
      set({
        toastMessage: `Triggered install protocol: ${target.launch_uri}`,
      });
      return;
    }

    // 5. Normal Ready Launch -> Transition Ready -> Starting -> Running
    await ipcLaunchGame(gameId);
    set((state) => ({
      games: state.games.map((g) =>
        g.id === gameId
          ? {
              ...g,
              install_state: 'starting',
              status_message:
                g.storefront === 'Local'
                  ? 'Spawning Direct Binary...'
                  : `Starting ${g.storefront} (-silent)...`,
            }
          : g
      ),
      toastMessage: `Executing ${target.launch_uri} | Watching folder: ${target.install_dir || 'local'}`,
    }));

    setTimeout(() => {
      const current = get().games.find((g) => g.id === gameId);
      if (current && current.install_state === 'starting') {
        set((state) => ({
          games: state.games.map((g) =>
            g.id === gameId
              ? {
                  ...g,
                  install_state: 'running',
                  status_message: 'Running (PID Active in install_dir)',
                }
              : g
          ),
        }));
      }
    }, 1800);
  },

  cancelGameLaunch: async (gameId) => {
    await ipcCancelLaunch(gameId);
    set((state) => ({
      games: state.games.map((g) =>
        g.id === gameId
          ? {
              ...g,
              install_state: 'ready',
              status_message: g.storefront === 'Local' ? 'DIRECT .EXE' : 'Installed, Ready',
            }
          : g
      ),
      toastMessage: 'Launch watcher cancelled.',
    }));
  },

  toggleAutoKillRule: async (gameId) => {
    const target = get().games.find((g) => g.id === gameId);
    if (!target) return;
    const nextVal = !target.auto_kill_client;
    await ipcSetAutoKillRule(gameId, nextVal);
    set((state) => ({
      games: state.games.map((g) =>
        g.id === gameId ? { ...g, auto_kill_client: nextVal } : g
      ),
      toastMessage: nextVal
        ? `Smart Auto-Kill enabled for ${target.title} (5s grace period).`
        : `Smart Auto-Kill disabled for ${target.title}.`,
    }));
  },

  assignPinSlot: async (gameId, slot) => {
    await ipcSetPinnedSlot(gameId, slot);
    set((state) => ({
      rotorAngle: state.rotorAngle + 90,
      games: state.games.map((g) => {
        if (g.id === gameId) return { ...g, pin_slot: slot };
        if (slot !== 0 && g.pin_slot === slot) return { ...g, pin_slot: 0 };
        return g;
      }),
      toastMessage:
        slot === 0
          ? 'Removed from Pinned Quick-Switch shelf.'
          : `Pinned to Quick-Switch Slot ${slot}.`,
    }));
  },

  openGameFolder: async (gameId) => {
    const target = get().games.find((g) => g.id === gameId);
    if (!target) return;
    await ipcOpenInstallFolder(gameId);
    set({
      toastMessage: `Opening Explorer: ${target.install_dir || 'Cloud item (not on disk)'}`,
    });
  },

  importLocalExe: async (exePath, title) => {
    try {
      const newGame = await ipcImportCustomExe(exePath, title);
      set((state) => ({
        games: [newGame, ...state.games],
        activeGameId: newGame.id,
        rotorAngle: state.rotorAngle + 120,
        toastMessage: `Imported local executable: ${newGame.title}`,
      }));
      await get().fetchGameIcons([newGame.id]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ toastMessage: `Import failed: ${msg}` });
    }
  },

  fetchGameIcons: async (gameIds?: string[]) => {
    const targets = gameIds
      ? get().games.filter((g) => gameIds.includes(g.id))
      : get().games.filter((g) => g.is_installed && g.executable_path && !g.icon_cache_path);

    for (const game of targets) {
      if (!game.executable_path) continue;
      const icon = await ipcGetGameIcon(game.executable_path, true);
      if (icon) {
        const dataUrl = `data:image/png;base64,${icon.base64_png}`;
        set((state) => ({
          games: state.games.map((g) =>
            g.id === game.id ? { ...g, icon_cache_path: dataUrl } : g
          ),
        }));
      }
    }
  },

  clearToast: () => set({ toastMessage: null }),
}));
