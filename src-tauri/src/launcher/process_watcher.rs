use crate::db::{record_play_session, Database, GameItem};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, RefreshKind, System};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, serde::Serialize)]
pub struct ProcessStateEvent {
    pub game_id: String,
    pub status: String,
    pub message: String,
    pub pid: Option<u32>,
}

#[derive(Debug)]
pub struct WatcherHandle {
    pub cancel_flag: Arc<AtomicBool>,
}

pub fn is_process_in_install_dir(exe_path: &Path, install_dir: &Path) -> bool {
    exe_path.starts_with(install_dir)
}

pub fn should_kill_client(exe_name: &str, rule_enabled: bool) -> bool {
    rule_enabled
        && ["steam.exe", "epicgameslauncher.exe", "upc.exe"]
            .contains(&exe_name.to_ascii_lowercase().as_str())
}

pub fn game_exit_grace_elapsed(game_process_gone: bool, elapsed: Duration) -> bool {
    game_process_gone && elapsed.as_secs() >= 5
}

pub fn start_game_watcher(
    app: AppHandle,
    database: Database,
    game: GameItem,
    initial_pid: Option<u32>,
) -> WatcherHandle {
    let cancel_flag = Arc::new(AtomicBool::new(false));
    let watcher_flag = cancel_flag.clone();

    std::thread::spawn(move || {
        watch_loop(app, database, game, initial_pid, watcher_flag);
    });

    WatcherHandle { cancel_flag }
}

fn watch_loop(
    app: AppHandle,
    database: Database,
    game: GameItem,
    initial_pid: Option<u32>,
    cancel_flag: Arc<AtomicBool>,
) {
    let install_dir = match game.install_dir.as_deref().map(PathBuf::from) {
        Some(dir) => dir,
        None => return,
    };

    let start_timestamp = current_timestamp();
    let start_instant = Instant::now();
    let mut tracked_pids = HashSet::new();

    emit_event(
        &app,
        &game.id,
        "starting",
        "Waiting for game process...",
        initial_pid,
    );

    let mut system = System::new_with_specifics(
        RefreshKind::nothing().with_processes(ProcessRefreshKind::everything()),
    );

    let mut absent_since: Option<Instant> = None;
    let poll_interval = Duration::from_millis(1000);

    loop {
        if cancel_flag.load(Ordering::Relaxed) {
            emit_event(&app, &game.id, "ready", "Launch cancelled", None);
            return;
        }

        system.refresh_processes_specifics(
            ProcessesToUpdate::All,
            true,
            ProcessRefreshKind::everything(),
        );

        let mut active_game_pids = Vec::new();
        let mut launcher_pids = Vec::new();

        for (pid, process) in system.processes() {
            let pid_u32 = pid.as_u32();
            if let Some(exe_path) = process.exe() {
                if is_process_in_install_dir(exe_path, &install_dir) {
                    active_game_pids.push(pid_u32);
                    tracked_pids.insert(pid_u32);
                } else if let Some(name) = process.name().to_str() {
                    if should_kill_client(name, game.auto_kill_client) {
                        launcher_pids.push(*pid);
                    }
                }
            }
        }

        if !active_game_pids.is_empty() {
            absent_since = None;
            tracked_pids.extend(active_game_pids.iter().copied());
            emit_event(
                &app,
                &game.id,
                "running",
                "Game running",
                active_game_pids.first().copied(),
            );
        } else if !tracked_pids.is_empty() {
            let timer = absent_since.get_or_insert_with(Instant::now);
            if game_exit_grace_elapsed(true, timer.elapsed()) {
                let end_timestamp = current_timestamp();
                let duration_seconds = start_instant.elapsed().as_secs() as i64;

                let _ = record_play_session(
                    &database,
                    &game.id,
                    &start_timestamp,
                    &end_timestamp,
                    duration_seconds,
                );

                if game.auto_kill_client {
                    emit_event(&app, &game.id, "closing_client", "Closing launcher...", None);
                    for pid in launcher_pids {
                        if let Some(process) = system.process(pid) {
                            process.kill();
                        }
                    }
                }

                emit_event(&app, &game.id, "ready", "Session complete", None);
                return;
            }
        }

        std::thread::sleep(poll_interval);
    }
}

fn emit_event(app: &AppHandle, game_id: &str, status: &str, message: &str, pid: Option<u32>) {
    let _ = app.emit(
        "gameyard://process-state",
        ProcessStateEvent {
            game_id: game_id.to_string(),
            status: status.to_string(),
            message: message.to_string(),
            pid,
        },
    );
}

fn current_timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

#[cfg(test)]
mod tests {
    use super::{is_process_in_install_dir, should_kill_client, game_exit_grace_elapsed};
    use std::path::Path;

    #[test]
    fn accepts_executable_inside_install_directory() {
        assert!(is_process_in_install_dir(
            Path::new(r"D:\Games\Example\bin\game.exe"),
            Path::new(r"D:\Games\Example"),
        ));
    }

    #[test]
    fn rejects_similar_sibling_directory() {
        assert!(!is_process_in_install_dir(
            Path::new(r"D:\Games\ExampleTools\tool.exe"),
            Path::new(r"D:\Games\Example"),
        ));
    }

    #[test]
    fn only_kills_known_launcher_when_rule_enabled() {
        assert!(should_kill_client("steam.exe", true));
        assert!(should_kill_client("EpicGamesLauncher.exe", true));
        assert!(!should_kill_client("game.exe", true));
        assert!(!should_kill_client("steam.exe", false));
    }

    #[test]
    fn ends_session_only_after_five_seconds_without_game_process() {
        assert!(!game_exit_grace_elapsed(true, std::time::Duration::from_secs(4)));
        assert!(game_exit_grace_elapsed(true, std::time::Duration::from_secs(5)));
        assert!(!game_exit_grace_elapsed(false, std::time::Duration::from_secs(60)));
    }
}
