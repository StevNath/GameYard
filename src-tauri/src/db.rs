use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone)]
pub struct Database {
    pub connection: Arc<Mutex<Connection>>,
}

#[derive(Debug, Deserialize, Default)]
pub struct LibraryFilter {
    pub storefront: Option<String>,
    pub query: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct IconTheme {
    pub bg: String,
    pub border: String,
    pub text: String,
}

#[derive(Debug, Serialize)]
pub struct GameItem {
    pub id: String,
    pub title: String,
    pub short_code: String,
    pub storefront: String,
    pub external_app_id: Option<String>,
    pub launch_uri: String,
    pub executable_path: Option<String>,
    pub install_dir: Option<String>,
    pub drive_letter: Option<String>,
    pub size_bytes: i64,
    pub is_installed: bool,
    pub install_state: String,
    pub status_message: String,
    pub icon_cache_path: Option<String>,
    pub cover_cache_path: Option<String>,
    pub total_playtime_seconds: i64,
    pub last_played_at: Option<String>,
    pub pin_slot: i64,
    pub auto_kill_client: bool,
    pub icon_theme: IconTheme,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct ScanSummary {
    pub drives_count: i64,
    pub installed_count: i64,
    pub games: Vec<GameItem>,
}

#[derive(Debug, Serialize)]
pub struct LaunchResult {
    pub pid: Option<u32>,
    pub status: String,
    pub message: String,
}

#[derive(Debug, Clone)]
pub struct DiscoveredGame {
    pub id: String,
    pub title: String,
    pub storefront: String,
    pub external_app_id: String,
    pub launch_uri: String,
    pub executable_path: Option<String>,
    pub install_dir: Option<String>,
    pub drive_letter: Option<String>,
    pub size_bytes: i64,
}

pub fn init(app: &AppHandle) -> Result<Database, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let db_path = app_dir.join("gameyard.db");
    let connection = Connection::open(db_path).map_err(|e| e.to_string())?;
    connection
        .execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             CREATE TABLE IF NOT EXISTS games (
                 id TEXT PRIMARY KEY,
                 title TEXT NOT NULL,
                 short_code TEXT NOT NULL,
                 storefront TEXT NOT NULL,
                 external_app_id TEXT,
                 launch_uri TEXT NOT NULL,
                 executable_path TEXT,
                 install_dir TEXT,
                 drive_letter TEXT,
                 size_bytes INTEGER NOT NULL DEFAULT 0,
                 is_installed INTEGER NOT NULL DEFAULT 1,
                 install_state TEXT NOT NULL DEFAULT 'ready',
                 status_message TEXT NOT NULL DEFAULT '',
                 icon_cache_path TEXT,
                 cover_cache_path TEXT,
                 total_playtime_seconds INTEGER NOT NULL DEFAULT 0,
                 last_played_at TEXT,
                 pin_slot INTEGER NOT NULL DEFAULT 0,
                 auto_kill_client INTEGER NOT NULL DEFAULT 1,
                 created_at TEXT NOT NULL,
                 updated_at TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS play_sessions (
                 session_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
                 started_at TEXT NOT NULL,
                 ended_at TEXT NOT NULL,
                 duration_seconds INTEGER NOT NULL
             );
             CREATE TABLE IF NOT EXISTS store_connections (
                 storefront TEXT PRIMARY KEY,
                 account_display_name TEXT,
                 auth_state TEXT NOT NULL DEFAULT 'disconnected',
                 last_synced_at TEXT
             );
             CREATE INDEX IF NOT EXISTS idx_games_storefront ON games(storefront);
             CREATE INDEX IF NOT EXISTS idx_games_last_played ON games(last_played_at DESC);
             CREATE INDEX IF NOT EXISTS idx_games_pin_slot ON games(pin_slot);",
        )
        .map_err(|e| e.to_string())?;

    Ok(Database {
        connection: Arc::new(Mutex::new(connection)),
    })
}

pub fn list_games(db: &Database, filter: Option<&LibraryFilter>) -> Result<Vec<GameItem>, String> {
    let connection = db.connection.lock().map_err(|e| e.to_string())?;
    let mut games = Vec::new();

    match filter {
        Some(filter) if filter.storefront.is_some() || filter.query.is_some() => {
            let storefront = filter.storefront.as_deref().unwrap_or("");
            let query = filter.query.as_deref().unwrap_or("");
            let pattern = format!("%{query}%");
            let mut statement = connection
                .prepare(
                    "SELECT id, title, short_code, storefront, external_app_id, launch_uri,
                            executable_path, install_dir, drive_letter, size_bytes, is_installed,
                            install_state, status_message, icon_cache_path, cover_cache_path,
                            total_playtime_seconds, last_played_at, pin_slot, auto_kill_client,
                            created_at, updated_at
                     FROM games
                     WHERE (?1 = '' OR storefront = ?1)
                       AND (?2 = '' OR title LIKE ?2 COLLATE NOCASE)
                     ORDER BY last_played_at IS NULL, last_played_at DESC, title COLLATE NOCASE",
                )
                .map_err(|e| e.to_string())?;
            let rows = statement
                .query_map(params![storefront, pattern], row_to_game)
                .map_err(|e| e.to_string())?;
            for row in rows {
                games.push(row.map_err(|e| e.to_string())?);
            }
        }
        _ => {
            let mut statement = connection
                .prepare(
                    "SELECT id, title, short_code, storefront, external_app_id, launch_uri,
                            executable_path, install_dir, drive_letter, size_bytes, is_installed,
                            install_state, status_message, icon_cache_path, cover_cache_path,
                            total_playtime_seconds, last_played_at, pin_slot, auto_kill_client,
                            created_at, updated_at
                     FROM games
                     ORDER BY last_played_at IS NULL, last_played_at DESC, title COLLATE NOCASE",
                )
                .map_err(|e| e.to_string())?;
            let rows = statement
                .query_map([], row_to_game)
                .map_err(|e| e.to_string())?;
            for row in rows {
                games.push(row.map_err(|e| e.to_string())?);
            }
        }
    }

    Ok(games)
}

pub fn scan_summary(db: &Database) -> Result<ScanSummary, String> {
    let connection = db.connection.lock().map_err(|e| e.to_string())?;
    let drives_count: i64 = connection
        .query_row(
            "SELECT COUNT(DISTINCT drive_letter) FROM games WHERE drive_letter IS NOT NULL",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let installed_count: i64 = connection
        .query_row("SELECT COUNT(*) FROM games WHERE is_installed = 1", [], |row| {
            row.get(0)
        })
        .map_err(|e| e.to_string())?;
    drop(connection);

    Ok(ScanSummary {
        drives_count,
        installed_count,
        games: list_games(db, None)?,
    })
}

pub fn get_game(db: &Database, game_id: &str) -> Result<Option<GameItem>, String> {
    let connection = db.connection.lock().map_err(|e| e.to_string())?;
    connection
        .query_row(
            "SELECT id, title, short_code, storefront, external_app_id, launch_uri,
                    executable_path, install_dir, drive_letter, size_bytes, is_installed,
                    install_state, status_message, icon_cache_path, cover_cache_path,
                    total_playtime_seconds, last_played_at, pin_slot, auto_kill_client,
                    created_at, updated_at
             FROM games WHERE id = ?1",
            params![game_id],
            row_to_game,
        )
        .optional()
        .map_err(|e| e.to_string())
}

pub fn set_auto_kill(db: &Database, game_id: &str, enabled: bool) -> Result<bool, String> {
    let connection = db.connection.lock().map_err(|e| e.to_string())?;
    let changed = connection
        .execute(
            "UPDATE games SET auto_kill_client = ?1, updated_at = ?2 WHERE id = ?3",
            params![enabled as i64, now_timestamp(), game_id],
        )
        .map_err(|e| e.to_string())?;
    Ok(changed == 1)
}

pub fn set_pin(db: &Database, game_id: &str, slot: i64) -> Result<bool, String> {
    if !(0..=2).contains(&slot) {
        return Err("pin slot must be 0, 1, or 2".to_string());
    }

    let mut connection = db.connection.lock().map_err(|e| e.to_string())?;
    let transaction = connection.transaction().map_err(|e| e.to_string())?;
    if slot != 0 {
        transaction
            .execute(
                "UPDATE games SET pin_slot = 0, updated_at = ?1 WHERE pin_slot = ?2 AND id <> ?3",
                params![now_timestamp(), slot, game_id],
            )
            .map_err(|e| e.to_string())?;
    }
    let changed = transaction
        .execute(
            "UPDATE games SET pin_slot = ?1, updated_at = ?2 WHERE id = ?3",
            params![slot, now_timestamp(), game_id],
        )
        .map_err(|e| e.to_string())?;
    transaction.commit().map_err(|e| e.to_string())?;
    Ok(changed == 1)
}

pub fn record_play_session(
    db: &Database,
    game_id: &str,
    started_at: &str,
    ended_at: &str,
    duration_seconds: i64,
) -> Result<(), String> {
    if duration_seconds < 0 {
        return Err("session duration cannot be negative".to_string());
    }

    let connection = db.connection.lock().map_err(|e| e.to_string())?;
    let transaction = connection
        .unchecked_transaction()
        .map_err(|e| e.to_string())?;
    transaction
        .execute(
            "INSERT INTO play_sessions (game_id, started_at, ended_at, duration_seconds) VALUES (?1, ?2, ?3, ?4)",
            params![game_id, started_at, ended_at, duration_seconds],
        )
        .map_err(|e| e.to_string())?;
    transaction
        .execute(
            "UPDATE games SET total_playtime_seconds = total_playtime_seconds + ?1, last_played_at = ?2, updated_at = ?3 WHERE id = ?4",
            params![duration_seconds, ended_at, now_timestamp(), game_id],
        )
        .map_err(|e| e.to_string())?;
    transaction.commit().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn upsert_discovered_game(db: &Database, discovered: &DiscoveredGame) -> Result<(), String> {
    let now = now_timestamp();
    let title = discovered.title.trim();
    if title.is_empty() || discovered.external_app_id.trim().is_empty() {
        return Err("discovered game needs title and external app id".to_string());
    }

    let game = GameItem {
        id: discovered.id.clone(),
        title: title.to_string(),
        short_code: short_code_for(title),
        storefront: discovered.storefront.clone(),
        external_app_id: Some(discovered.external_app_id.clone()),
        launch_uri: discovered.launch_uri.clone(),
        executable_path: discovered.executable_path.clone(),
        install_dir: discovered.install_dir.clone(),
        drive_letter: discovered.drive_letter.clone(),
        size_bytes: discovered.size_bytes,
        is_installed: true,
        install_state: "ready".to_string(),
        status_message: "Installed, Ready".to_string(),
        icon_cache_path: None,
        cover_cache_path: None,
        total_playtime_seconds: 0,
        last_played_at: None,
        pin_slot: 0,
        auto_kill_client: true,
        icon_theme: icon_theme_for(&discovered.storefront),
        created_at: now.clone(),
        updated_at: now,
    };
    insert_game(db, &game)
}

pub fn insert_game(db: &Database, game: &GameItem) -> Result<(), String> {
    let connection = db.connection.lock().map_err(|e| e.to_string())?;
    connection
        .execute(
            "INSERT INTO games (
                id, title, short_code, storefront, external_app_id, launch_uri,
                executable_path, install_dir, drive_letter, size_bytes, is_installed,
                install_state, status_message, icon_cache_path, cover_cache_path,
                total_playtime_seconds, last_played_at, pin_slot, auto_kill_client,
                created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
                       ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)
             ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                launch_uri = excluded.launch_uri,
                executable_path = excluded.executable_path,
                install_dir = excluded.install_dir,
                drive_letter = excluded.drive_letter,
                size_bytes = excluded.size_bytes,
                is_installed = excluded.is_installed,
                install_state = excluded.install_state,
                status_message = excluded.status_message,
                updated_at = excluded.updated_at",
            params![
                game.id,
                game.title,
                game.short_code,
                game.storefront,
                game.external_app_id,
                game.launch_uri,
                game.executable_path,
                game.install_dir,
                game.drive_letter,
                game.size_bytes,
                game.is_installed as i64,
                game.install_state,
                game.status_message,
                game.icon_cache_path,
                game.cover_cache_path,
                game.total_playtime_seconds,
                game.last_played_at,
                game.pin_slot,
                game.auto_kill_client as i64,
                game.created_at,
                game.updated_at,
            ],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn row_to_game(row: &rusqlite::Row<'_>) -> rusqlite::Result<GameItem> {
    let storefront: String = row.get(3)?;
    Ok(GameItem {
        id: row.get(0)?,
        title: row.get(1)?,
        short_code: row.get(2)?,
        icon_theme: icon_theme_for(&storefront),
        storefront,
        external_app_id: row.get(4)?,
        launch_uri: row.get(5)?,
        executable_path: row.get(6)?,
        install_dir: row.get(7)?,
        drive_letter: row.get(8)?,
        size_bytes: row.get(9)?,
        is_installed: row.get::<_, i64>(10)? != 0,
        install_state: row.get(11)?,
        status_message: row.get(12)?,
        icon_cache_path: row.get(13)?,
        cover_cache_path: row.get(14)?,
        total_playtime_seconds: row.get(15)?,
        last_played_at: row.get(16)?,
        pin_slot: row.get(17)?,
        auto_kill_client: row.get::<_, i64>(18)? != 0,
        created_at: row.get(19)?,
        updated_at: row.get(20)?,
    })
}

fn icon_theme_for(storefront: &str) -> IconTheme {
    match storefront {
        "Steam" => IconTheme {
            bg: "#1F1B0D".to_string(),
            border: "#52451E".to_string(),
            text: "#FDE68A".to_string(),
        },
        "Epic" => IconTheme {
            bg: "#131820".to_string(),
            border: "#2D384A".to_string(),
            text: "#E2E8F0".to_string(),
        },
        "Ubisoft" => IconTheme {
            bg: "#241808".to_string(),
            border: "#92400E".to_string(),
            text: "#FBBF24".to_string(),
        },
        "GOG" => IconTheme {
            bg: "#1A1A2E".to_string(),
            border: "#4A4AA6".to_string(),
            text: "#A5B4FC".to_string(),
        },
        "EA" => IconTheme {
            bg: "#1C0B1C".to_string(),
            border: "#8B1A8B".to_string(),
            text: "#F0ABFC".to_string(),
        },
        "Battle.net" => IconTheme {
            bg: "#0D1B2A".to_string(),
            border: "#1B4F72".to_string(),
            text: "#60A5FA".to_string(),
        },
        _ => IconTheme {
            bg: "#0F1D22".to_string(),
            border: "#21424D".to_string(),
            text: "#93F1F7".to_string(),
        },
    }
}

pub fn import_game(
    db: &Database,
    exe_path: &Path,
    title: Option<&str>,
) -> Result<GameItem, String> {
    if !exe_path.is_file() {
        return Err("executable file does not exist".to_string());
    }
    if exe_path.extension().and_then(|value| value.to_str()).map(|value| value.eq_ignore_ascii_case("exe")) != Some(true) {
        return Err("only .exe files can be imported".to_string());
    }

    let metadata = fs::metadata(exe_path).map_err(|e| e.to_string())?;
    let path_string = exe_path.to_string_lossy().to_string();
    let clean_title = title
        .filter(|value| !value.trim().is_empty())
        .map(str::trim)
        .map(str::to_string)
        .or_else(|| exe_path.file_stem().and_then(|value| value.to_str()).map(str::to_string))
        .unwrap_or_else(|| "Custom Game".to_string());
    let short_code = short_code_for(&clean_title);
    let now = now_timestamp();
    let game = GameItem {
        id: format!("local_{}", now),
        title: clean_title,
        short_code,
        storefront: "Local".to_string(),
        external_app_id: None,
        launch_uri: path_string.clone(),
        executable_path: Some(path_string),
        install_dir: exe_path.parent().map(|path| path.to_string_lossy().to_string()),
        drive_letter: drive_letter(exe_path),
        size_bytes: metadata.len() as i64,
        is_installed: true,
        install_state: "ready".to_string(),
        status_message: "DIRECT .EXE".to_string(),
        icon_cache_path: None,
        cover_cache_path: None,
        total_playtime_seconds: 0,
        last_played_at: None,
        pin_slot: 0,
        auto_kill_client: false,
        icon_theme: icon_theme_for("Local"),
        created_at: now.clone(),
        updated_at: now,
    };
    insert_game(db, &game)?;
    Ok(game)
}

fn short_code_for(title: &str) -> String {
    let words: Vec<&str> = title.split_whitespace().filter(|word| !word.is_empty()).collect();
    match words.as_slice() {
        [first, second, ..] => format!("{}{}", first.chars().next().unwrap_or('G'), second.chars().next().unwrap_or('A')).to_uppercase(),
        [word] => word.chars().take(2).collect::<String>().to_uppercase(),
        [] => "CG".to_string(),
    }
}

fn drive_letter(path: &Path) -> Option<String> {
    let text = path.to_string_lossy();
    let bytes = text.as_bytes();
    if bytes.len() >= 3 && bytes[1] == b':' && (bytes[2] == b'\\' || bytes[2] == b'/') {
        Some(text[..3].to_uppercase())
    } else {
        None
    }
}

fn now_timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

#[cfg(test)]
mod tests {
    use super::{record_play_session, Database};
    use rusqlite::Connection;
    use std::sync::{Arc, Mutex};

    fn test_database() -> Database {
        let connection = Connection::open_in_memory().expect("open test database");
        connection
            .execute_batch(
                "CREATE TABLE games (
                    id TEXT PRIMARY KEY,
                    total_playtime_seconds INTEGER NOT NULL DEFAULT 0,
                    last_played_at TEXT,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE play_sessions (
                    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_id TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    ended_at TEXT NOT NULL,
                    duration_seconds INTEGER NOT NULL
                );",
            )
            .expect("create test schema");
        connection
            .execute(
                "INSERT INTO games (id, updated_at) VALUES (?1, ?2)",
                ("game-1", "0"),
            )
            .expect("insert test game");
        Database {
            connection: Arc::new(Mutex::new(connection)),
        }
    }

    #[test]
    fn records_session_and_updates_game_totals() {
        let database = test_database();

        record_play_session(&database, "game-1", "100", "145", 45)
            .expect("record play session");

        let connection = database.connection.lock().expect("lock test database");
        let session: (String, String, i64) = connection
            .query_row(
                "SELECT started_at, ended_at, duration_seconds FROM play_sessions WHERE game_id = ?1",
                ["game-1"],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .expect("read play session");
        let game: (i64, String) = connection
            .query_row(
                "SELECT total_playtime_seconds, last_played_at FROM games WHERE id = ?1",
                ["game-1"],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .expect("read game totals");

        assert_eq!(session, ("100".to_string(), "145".to_string(), 45));
        assert_eq!(game.0, 45);
        assert_eq!(game.1, "145");
    }
}
