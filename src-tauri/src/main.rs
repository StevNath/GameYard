// Prevents additional console window on Windows in release, do not remove!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod launcher;
mod scanners;

use db::{Database, LaunchResult};
use launcher::{process_watcher, icon_extractor};
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};

struct LauncherState {
    watchers: Arc<Mutex<HashMap<String, launcher::process_watcher::WatcherHandle>>>,
}

fn is_executable_path(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("exe"))
}

#[tauri::command]
fn update_game_location(
    game_id: String,
    exe_path: String,
    state: State<'_, Database>,
) -> Result<db::GameItem, String> {
    db::update_game_location(&state, &game_id, Path::new(&exe_path))
}

#[tauri::command]
fn pick_executable() -> Option<String> {
    rfd::FileDialog::new()
        .add_filter("Windows executable", &["exe"])
        .pick_file()
        .filter(|path| is_executable_path(path))
        .map(|path| path.to_string_lossy().to_string())
}

#[tauri::command]
async fn scan_local_drives(
    custom_paths: Option<Vec<String>>,
    app: AppHandle,
    state: State<'_, Database>,
) -> Result<db::ScanSummary, String> {
    println!("=== scan_local_drives CALLED ===");
    let db = (*state).clone();

    // Load saved custom scan paths from database
    let saved_paths = db::list_custom_scan_paths(&db)?;
    let enabled_saved_paths: Vec<String> = saved_paths
        .into_iter()
        .filter(|p| p.enabled)
        .map(|p| p.path)
        .collect();

    // Merge with custom_paths parameter
    let mut all_custom_paths = enabled_saved_paths;
    if let Some(extra_paths) = custom_paths {
        all_custom_paths.extend(extra_paths);
    }

    let final_custom_paths = if all_custom_paths.is_empty() {
        None
    } else {
        Some(all_custom_paths)
    };

    println!("=== spawn_blocking scanners::scan_all ===");
    let discovered = tokio::task::spawn_blocking(move || {
        println!("=== INSIDE spawn_blocking closure ===");
        scanners::scan_all(final_custom_paths.as_ref().map(|paths| paths.as_slice()), &app)
    })
    .await
    .map_err(|e| e.to_string())?;
    println!("=== spawn_blocking completed, {} games discovered ===", discovered.len());

    for game in &discovered {
        db::upsert_discovered_game(&state, game)?;
    }
    db::scan_summary(&state)
}

#[tauri::command]
fn get_library_index(
    filter: Option<db::LibraryFilter>,
    state: State<'_, Database>,
) -> Result<Vec<db::GameItem>, String> {
    db::list_games(&state, filter.as_ref())
}

#[tauri::command]
fn launch_game(
    game_id: String,
    app: AppHandle,
    state: State<'_, Database>,
    launcher_state: State<'_, LauncherState>,
) -> Result<LaunchResult, String> {
    let game = db::get_game(&state, &game_id)?.ok_or_else(|| "game not found".to_string())?;
    if !game.is_installed {
        return Ok(LaunchResult {
            pid: None,
            status: "cloud".to_string(),
            message: "Game is not installed".to_string(),
        });
    }

    let mut command = if game.launch_uri.starts_with("steam://")
        || game.launch_uri.starts_with("com.epicgames.launcher://")
        || game.launch_uri.starts_with("uplay://")
    {
        let mut command = Command::new("cmd");
        command.args(["/C", "start", "", &game.launch_uri]);
        command
    } else {
        Command::new(&game.launch_uri)
    };

    let child = command
        .spawn()
        .map_err(|error| format!("failed to launch game: {error}"))?;
    let pid = child.id();

    let watcher = process_watcher::start_game_watcher(app, (*state).clone(), game, Some(pid));
    launcher_state
        .watchers
        .lock()
        .map_err(|e| e.to_string())?
        .insert(game_id, watcher);

    Ok(LaunchResult {
        pid: Some(pid),
        status: "starting".to_string(),
        message: "Launch dispatched".to_string(),
    })
}

#[tauri::command]
fn cancel_launch(game_id: String, launcher_state: State<'_, LauncherState>) -> bool {
    if let Ok(mut watchers) = launcher_state.watchers.lock() {
        if let Some(watcher) = watchers.remove(&game_id) {
            watcher
                .cancel_flag
                .store(true, std::sync::atomic::Ordering::Relaxed);
            return true;
        }
    }
    false
}

#[tauri::command]
fn set_auto_kill_rule(
    game_id: String,
    enabled: bool,
    state: State<'_, Database>,
) -> Result<bool, String> {
    db::set_auto_kill(&state, &game_id, enabled)
}

#[tauri::command]
fn set_pinned_slot(
    game_id: String,
    slot: i64,
    state: State<'_, Database>,
) -> Result<bool, String> {
    db::set_pin(&state, &game_id, slot)
}

#[tauri::command]
fn update_game_icon(
    game_id: String,
    icon_path: String,
    state: State<'_, Database>,
) -> Result<bool, String> {
    db::update_game_icon(&state, &game_id, &icon_path)
}

#[tauri::command]
fn open_install_folder(game_id: String, state: State<'_, Database>) -> Result<(), String> {
    let game = db::get_game(&state, &game_id)?.ok_or_else(|| "game not found".to_string())?;
    let install_dir = game
        .install_dir
        .ok_or_else(|| "game has no install folder".to_string())?;

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer.exe")
            .arg(install_dir)
            .spawn()
            .map_err(|error| format!("failed to open install folder: {error}"))?;
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = install_dir;
        Err("opening install folders is only implemented on Windows".to_string())
    }
}

#[tauri::command]
fn import_custom_exe(
    exe_path: String,
    title: Option<String>,
    state: State<'_, Database>,
) -> Result<db::GameItem, String> {
    db::import_game(&state, Path::new(&exe_path), title.as_deref())
}

#[tauri::command]
fn add_custom_scan_path(
    path: String,
    state: State<'_, Database>,
) -> Result<i64, String> {
    db::add_custom_scan_path(&state, &path)
}

#[tauri::command]
fn remove_custom_scan_path(
    id: i64,
    state: State<'_, Database>,
) -> Result<bool, String> {
    db::remove_custom_scan_path(&state, id)
}

#[tauri::command]
fn list_custom_scan_paths(
    state: State<'_, Database>,
) -> Result<Vec<db::CustomScanPath>, String> {
    db::list_custom_scan_paths(&state)
}

#[tauri::command]
fn set_custom_scan_path_enabled(
    id: i64,
    enabled: bool,
    state: State<'_, Database>,
) -> Result<bool, String> {
    db::set_custom_scan_path_enabled(&state, id, enabled)
}

#[tauri::command]
fn delete_game(
    game_id: String,
    state: State<'_, Database>,
) -> Result<bool, String> {
    db::delete_game(&state, &game_id)
}

#[tauri::command]
fn uninstall_game(
    game_id: String,
    state: State<'_, Database>,
) -> Result<String, String> {
    db::uninstall_game(&state, &game_id)
}

#[cfg(test)]
mod tests {
    use super::is_executable_path;
    use std::path::Path;

    #[test]
    fn accepts_only_exe_files_for_picker_import() {
        assert!(is_executable_path(Path::new("C:\\Games\\Hades2.exe")));
        assert!(!is_executable_path(Path::new("C:\\Games\\readme.txt")));
        assert!(!is_executable_path(Path::new("C:\\Games\\Hades2")));
    }
}

fn main() {
    println!("=== GAMEYARD STARTING ===");
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();
    println!("=== TRACING INITIALIZED ===");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_local_drives,
            get_library_index,
            launch_game,
            cancel_launch,
            set_auto_kill_rule,
            set_pinned_slot,
            open_install_folder,
            pick_executable,
            import_custom_exe,
            add_custom_scan_path,
            remove_custom_scan_path,
            list_custom_scan_paths,
            set_custom_scan_path_enabled,
            icon_extractor::get_game_icon,
            icon_extractor::clear_icon_cache,
            update_game_location,
            delete_game,
            uninstall_game,
            update_game_icon
        ])
        .setup(|app| {
            let database = db::init(app.handle())?;
            app.manage(database);
            app.manage(LauncherState {
                watchers: Arc::new(Mutex::new(HashMap::new())),
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
