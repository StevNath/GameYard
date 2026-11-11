export type Storefront = 'Steam' | 'Epic' | 'Ubisoft' | 'GOG' | 'Local';

export type InstallState =
  | 'ready'
  | 'starting'
  | 'running'
  | 'closing_client'
  | 'auth_required'
  | 'update_needed'
  | 'cloud';

export interface IconTheme {
  bg: string;
  border: string;
  text: string;
}

export interface GameItem {
  id: string;
  title: string;
  short_code: string;
  storefront: Storefront;
  external_app_id: string | null;
  launch_uri: string;
  executable_path: string | null;
  install_dir: string | null;
  drive_letter: string | null;
  size_bytes: number;
  is_installed: boolean;
  install_state: InstallState;
  status_message: string;
  icon_cache_path: string | null;
  cover_cache_path: string | null;
  total_playtime_seconds: number;
  last_played_at: string | null;
  pin_slot: 0 | 1 | 2;
  auto_kill_client: boolean;
  icon_theme: IconTheme;
  created_at: string;
  updated_at: string;
}

export interface ScanSummary {
  drives_count: number;
  installed_count: number;
  games: GameItem[];
}

export interface LaunchResult {
  pid?: number;
  status: InstallState;
  message: string;
}

export interface StoreConnection {
  storefront: Storefront;
  account_display_name: string;
  auth_state: 'connected' | 'expired' | 'disconnected';
  last_synced_at: string | null;
}
