// Prevents additional console window on Windows in release, do not remove!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod launcher;
mod scanners;

use db::{Database, LaunchResult};
use launcher::process_watcher;
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};

struct LauncherState {
    watchers: Arc<Mutex<HashMap<String, launcher::process_watcher::WatcherHandle>>>,
}

#[tauri::command]
fn scan_local_drives(
    custom_paths: Option<Vec<String>>,
    state: State<'_, Database>,
) -> Result<db::ScanSummary, String> {
    let paths = custom_paths.as_ref().map(|paths| paths.as_slice());
    let discovered = scanners::scan_all(paths);
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

fn main() {
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
            import_custom_exe
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
