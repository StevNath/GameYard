import { invoke } from '@tauri-apps/api/core';
import { GameItem, LaunchResult, ScanSummary, Storefront, IconData } from '../types/game';

const GB = 1024 * 1024 * 1024;
const HOUR = 3600;

export const INITIAL_GAMES: GameItem[] = [
  {
    id: 'steam_1245620',
    title: 'Elden Ring',
    short_code: 'ER',
    storefront: 'Steam',
    external_app_id: '1245620',
    launch_uri: 'steam://rungameid/1245620',
    executable_path: 'D:\\SteamLibrary\\steamapps\\common\\ELDEN RING\\Game\\eldenring.exe',
    install_dir: 'D:\\SteamLibrary\\steamapps\\common\\ELDEN RING',
    drive_letter: 'D:\\',
    size_bytes: Math.round(68.4 * GB),
    is_installed: true,
    install_state: 'ready',
    status_message: 'Installed, Ready',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(142.5 * HOUR),
    last_played_at: '2026-11-11T14:20:00Z',
    pin_slot: 1,
    auto_kill_client: true,
    icon_theme: { bg: '#1F1B0D', border: '#52451E', text: '#FDE68A' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-11T14:20:00Z',
  },
  {
    id: 'local_valorant',
    title: 'Valorant',
    short_code: 'V',
    storefront: 'Local',
    external_app_id: null,
    launch_uri: 'C:\\Riot Games\\VALORANT\\live\\VALORANT.exe',
    executable_path: 'C:\\Riot Games\\VALORANT\\live\\VALORANT.exe',
    install_dir: 'C:\\Riot Games\\VALORANT\\live',
    drive_letter: 'C:\\',
    size_bytes: Math.round(44.2 * GB),
    is_installed: true,
    install_state: 'ready',
    status_message: 'DIRECT .EXE',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(318.0 * HOUR),
    last_played_at: '2026-11-10T22:15:00Z',
    pin_slot: 2,
    auto_kill_client: false,
    icon_theme: { bg: '#141F18', border: '#2A4733', text: '#86EFAC' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-10T22:15:00Z',
  },
  {
    id: 'steam_1030300',
    title: 'Hollow Knight: Silksong',
    short_code: 'HK',
    storefront: 'Steam',
    external_app_id: '1030300',
    launch_uri: 'steam://rungameid/1030300',
    executable_path: 'D:\\SteamLibrary\\steamapps\\common\\Silksong\\Silksong.exe',
    install_dir: 'D:\\SteamLibrary\\steamapps\\common\\Silksong',
    drive_letter: 'D:\\',
    size_bytes: Math.round(9.8 * GB),
    is_installed: true,
    install_state: 'starting',
    status_message: 'Syncing Steam Cloud (42%)',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(28.4 * HOUR),
    last_played_at: '2026-11-11T16:00:00Z',
    pin_slot: 0,
    auto_kill_client: true,
    icon_theme: { bg: '#0F1D22', border: '#21424D', text: '#93F1F7' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-11T16:00:00Z',
  },
  {
    id: 'steam_1091500',
    title: 'Cyberpunk 2077',
    short_code: 'CP',
    storefront: 'Steam',
    external_app_id: '1091500',
    launch_uri: 'steam://rungameid/1091500',
    executable_path: 'E:\\SteamGames\\steamapps\\common\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe',
    install_dir: 'E:\\SteamGames\\steamapps\\common\\Cyberpunk 2077',
    drive_letter: 'E:\\',
    size_bytes: Math.round(86.1 * GB),
    is_installed: true,
    install_state: 'ready',
    status_message: 'Installed, Ready',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(94.2 * HOUR),
    last_played_at: '2026-11-08T19:40:00Z',
    pin_slot: 0,
    auto_kill_client: true,
    icon_theme: { bg: '#211F0B', border: '#4D4716', text: '#FDE047' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-08T19:40:00Z',
  },
  {
    id: 'steam_2358720',
    title: 'Black Myth: Wukong',
    short_code: 'WK',
    storefront: 'Steam',
    external_app_id: '2358720',
    launch_uri: 'steam://rungameid/2358720',
    executable_path: 'E:\\SteamGames\\steamapps\\common\\BlackMythWukong\\b1\\Binaries\\Win64\\b1-Win64-Shipping.exe',
    install_dir: 'E:\\SteamGames\\steamapps\\common\\BlackMythWukong',
    drive_letter: 'E:\\',
    size_bytes: Math.round(128.6 * GB),
    is_installed: true,
    install_state: 'ready',
    status_message: 'Installed, Ready',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(61.8 * HOUR),
    last_played_at: '2026-11-06T21:10:00Z',
    pin_slot: 0,
    auto_kill_client: true,
    icon_theme: { bg: '#1F150E', border: '#4A3121', text: '#FDBA74' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-06T21:10:00Z',
  },
  {
    id: 'ubisoft_6100',
    title: "Assassin's Creed Mirage",
    short_code: 'AC',
    storefront: 'Ubisoft',
    external_app_id: '6100',
    launch_uri: 'uplay://launch/6100/0',
    executable_path: 'D:\\Ubisoft Game Launcher\\games\\Assassins Creed Mirage\\ACMirage.exe',
    install_dir: 'D:\\Ubisoft Game Launcher\\games\\Assassins Creed Mirage',
    drive_letter: 'D:\\',
    size_bytes: Math.round(42.5 * GB),
    is_installed: true,
    install_state: 'auth_required',
    status_message: 'Ubisoft OAuth expired',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(19.5 * HOUR),
    last_played_at: '2026-10-29T18:00:00Z',
    pin_slot: 0,
    auto_kill_client: true,
    icon_theme: { bg: '#241808', border: '#92400E', text: '#FBBF24' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-10-29T18:00:00Z',
  },
  {
    id: 'epic_alanwake2',
    title: 'Alan Wake 2',
    short_code: 'AW',
    storefront: 'Epic',
    external_app_id: 'AlanWake2',
    launch_uri: 'com.epicgames.launcher://apps/AlanWake2?action=launch&silent=true',
    executable_path: 'D:\\EpicGames\\AlanWake2\\AlanWake2.exe',
    install_dir: 'D:\\EpicGames\\AlanWake2',
    drive_letter: 'D:\\',
    size_bytes: Math.round(89.3 * GB),
    is_installed: true,
    install_state: 'update_needed',
    status_message: 'Epic patch pending (2.4 GB)',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(34.0 * HOUR),
    last_played_at: '2026-10-24T20:30:00Z',
    pin_slot: 0,
    auto_kill_client: true,
    icon_theme: { bg: '#131820', border: '#2D384A', text: '#E2E8F0' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-10-24T20:30:00Z',
  },
  {
    id: 'steam_1174180',
    title: 'Red Dead Redemption 2',
    short_code: 'R2',
    storefront: 'Steam',
    external_app_id: '1174180',
    launch_uri: 'steam://install/1174180',
    executable_path: null,
    install_dir: null,
    drive_letter: null,
    size_bytes: Math.round(119.4 * GB),
    is_installed: false,
    install_state: 'cloud',
    status_message: 'Not Installed (Cloud)',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: Math.round(212.7 * HOUR),
    last_played_at: '2026-09-15T15:00:00Z',
    pin_slot: 0,
    auto_kill_client: true,
    icon_theme: { bg: '#211010', border: '#4D2222', text: '#FCA5A5' },
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-09-15T15:00:00Z',
  },
];

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function ipcScanLocalDrives(customPaths?: string[]): Promise<ScanSummary> {
  if (isTauriRuntime()) {
    return await invoke<ScanSummary>('scan_local_drives', { customPaths });
  }
  return {
    drives_count: 3,
    installed_count: INITIAL_GAMES.filter((g) => g.is_installed).length,
    games: INITIAL_GAMES,
  };
}

export async function ipcGetLibraryIndex(filter?: {
  storefront?: string;
  query?: string;
}): Promise<GameItem[]> {
  if (isTauriRuntime()) {
    return await invoke<GameItem[]>('get_library_index', { filter });
  }
  return INITIAL_GAMES;
}

export async function ipcLaunchGame(gameId: string): Promise<LaunchResult> {
  if (isTauriRuntime()) {
    return await invoke<LaunchResult>('launch_game', { gameId });
  }
  return {
    pid: Math.floor(10000 + Math.random() * 40000),
    status: 'starting',
    message: 'Dispatched URI via silent protocol runner',
  };
}

export async function ipcCancelLaunch(gameId: string): Promise<boolean> {
  if (isTauriRuntime()) {
    return await invoke<boolean>('cancel_launch', { gameId });
  }
  return true;
}

export async function ipcSetAutoKillRule(gameId: string, enabled: boolean): Promise<boolean> {
  if (isTauriRuntime()) {
    return await invoke<boolean>('set_auto_kill_rule', { gameId, enabled });
  }
  return enabled;
}

export async function ipcSetPinnedSlot(gameId: string, slot: 0 | 1 | 2): Promise<boolean> {
  if (isTauriRuntime()) {
    return await invoke<boolean>('set_pinned_slot', { gameId, slot });
  }
  return true;
}

export async function ipcOpenInstallFolder(gameId: string): Promise<void> {
  if (isTauriRuntime()) {
    await invoke<void>('open_install_folder', { gameId });
  }
}

export async function ipcPickExecutable(): Promise<string | null> {
  if (isTauriRuntime()) {
    return await invoke<string | null>('pick_executable');
  }
  return null;
}

export async function ipcImportCustomExe(exePath: string, title?: string): Promise<GameItem> {
  if (isTauriRuntime()) {
    return await invoke<GameItem>('import_custom_exe', { exePath, title });
  }
  const fileName = exePath.split(/[/\\]/).pop() || 'CustomGame.exe';
  const cleanTitle = title || fileName.replace(/\.exe$/i, '');
  const words = cleanTitle.split(/\s+/).filter(Boolean);
  const shortCode =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : cleanTitle.slice(0, 2).toUpperCase();
  const driveMatch = exePath.match(/^[A-Za-z]:\\/);
  const lastSlash = Math.max(exePath.lastIndexOf('\\'), exePath.lastIndexOf('/'));

  return {
    id: `local_${Date.now()}`,
    title: cleanTitle,
    short_code: shortCode,
    storefront: 'Local' as Storefront,
    external_app_id: null,
    launch_uri: exePath,
    executable_path: exePath,
    install_dir: lastSlash > 0 ? exePath.slice(0, lastSlash) : 'C:\\Games',
    drive_letter: driveMatch ? driveMatch[0].toUpperCase() : 'C:\\',
    size_bytes: Math.round(14.6 * GB),
    is_installed: true,
    install_state: 'ready',
    status_message: 'DIRECT .EXE',
    icon_cache_path: null,
    cover_cache_path: null,
    total_playtime_seconds: 0,
    last_played_at: new Date().toISOString(),
    pin_slot: 0,
    auto_kill_client: false,
    icon_theme: { bg: '#0F1D22', border: '#21424D', text: '#93F1F7' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function formatBytesToGB(bytes: number): string {
  const gb = bytes / GB;
  return `${gb.toFixed(1)} GB`;
}

export function formatPlaytimeHours(seconds: number): string {
  const hours = seconds / HOUR;
  return `${hours.toFixed(1)}h`;
}

export async function ipcGetGameIcon(exePath: string, large?: boolean): Promise<IconData | null> {
  if (isTauriRuntime()) {
    return await invoke<IconData | null>('get_game_icon', { exePath, large });
  }
  return null;
}

export async function ipcClearIconCache(): Promise<void> {
  if (isTauriRuntime()) {
    await invoke<void>('clear_icon_cache');
  }
}
