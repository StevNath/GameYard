use crate::db::DiscoveredGame;
use regex::Regex;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

#[cfg(windows)]
use winreg::{enums::*, RegKey};


#[derive(Clone, Serialize)]
pub struct ScanProgress {
    pub source: String,
    pub games_found: usize,
}

pub fn scan_all(custom_paths: Option<&[String]>, app: &AppHandle) -> Vec<DiscoveredGame> {
    println!("=== scan_all ENTERED ===");
    tracing::info!("Starting full library scan");
    let mut games = Vec::new();

    let sources = [
        ("Steam", steam::scan()),
        ("Epic", epic::scan()),
        ("Ubisoft", ubisoft::scan()),
        ("GOG", gog::scan()),
        ("EA", ea::scan()),
        ("Battle.net", battle_net::scan()),
    ];
    println!("=== About to iterate sources ===");

    for (name, found) in sources {
        println!("=== Source {}: found {} games ===", name, found.len());
        tracing::debug!("Scanner {} found {} games", name, found.len());
        let mut found = found;
        games.append(&mut found);
        let _ = app.emit(
            "scan-progress",
            ScanProgress {
                source: name.to_string(),
                games_found: games.len(),
            },
        );
        tracing::info!("Emitted progress for {}: total {} games", name, games.len());
    }
    println!("=== Sources iteration complete, {} total games ===", games.len());

    if let Some(paths) = custom_paths {
        tracing::info!("Scanning custom paths: {:?}", paths);
        let mut custom_games = Vec::new();
        for path in paths {
            custom_games.extend(scan_custom_path(Path::new(path)));
        }
        games.append(&mut custom_games);
        let _ = app.emit(
            "scan-progress",
            ScanProgress {
                source: "Custom Paths".to_string(),
                games_found: games.len(),
            },
        );
    }

    tracing::info!("Scan complete: {} total games discovered", games.len());
    games
}

fn scan_custom_path(path: &Path) -> Vec<DiscoveredGame> {
    let mut games = Vec::new();
    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(_) => return games,
    };

    for entry in entries.flatten() {
        let candidate = entry.path();
        if candidate.is_file()
            && candidate
                .extension()
                .and_then(|value| value.to_str())
                .is_some_and(|value| value.eq_ignore_ascii_case("exe"))
        {
            let Some(title) = candidate.file_stem().and_then(|value| value.to_str()) else {
                continue;
            };
            if ignored_executable(title) {
                continue;
            }
            let install_dir = candidate.parent().map(Path::to_path_buf);
            let size_bytes = install_dir
                .as_ref()
                .map(|dir| calculate_folder_size(dir))
                .unwrap_or_else(|| {
                    fs::metadata(&candidate)
                        .map(|metadata| metadata.len() as i64)
                        .unwrap_or_default()
                });

            games.push(DiscoveredGame {
                id: format!("local_{}", stable_id(&candidate)),
                title: title.to_string(),
                storefront: "Local".to_string(),
                external_app_id: stable_id(&candidate),
                launch_uri: candidate.to_string_lossy().to_string(),
                executable_path: Some(candidate.to_string_lossy().to_string()),
                drive_letter: drive_letter(&candidate),
                install_dir: install_dir.map(|path| path.to_string_lossy().to_string()),
                size_bytes,
            });
        } else if candidate.is_dir() {
            // Check if this directory contains multiple game subdirectories (library folder)
            // like HoyoPlay\games\Genshin Impact, Honkai Star Rail, etc.
            let subdirs: Vec<_> = fs::read_dir(&candidate)
                .map(|entries| {
                    entries
                        .flatten()
                        .filter(|e| e.path().is_dir())
                        .filter(|e| !is_version_folder(e.path().file_name().and_then(|v| v.to_str()).unwrap_or("")))
                        .map(|e| e.path())
                        .collect()
                })
                .unwrap_or_default();

            let mut has_multiple_games = false;
            for subdir in &subdirs {
                if find_best_game_exe(subdir).is_some() {
                    if has_multiple_games {
                        // Found at least 2 subdirs with valid executables -> treat as library folder
                        break;
                    }
                    has_multiple_games = true;
                }
            }

            if has_multiple_games {
                // Scan each subdirectory as a separate game
                for subdir in subdirs {
                    if let Some(exe) = find_best_game_exe(&subdir) {
                        let Some(title) = subdir.file_name().and_then(|value| value.to_str()) else {
                            continue;
                        };
                        let install_dir = Some(subdir.clone());
                        let size_bytes = calculate_folder_size(&subdir);

                        games.push(DiscoveredGame {
                            id: format!("local_{}", stable_id(&subdir)),
                            title: title.to_string(),
                            storefront: "Local".to_string(),
                            external_app_id: stable_id(&subdir),
                            launch_uri: exe.to_string_lossy().to_string(),
                            executable_path: Some(exe.to_string_lossy().to_string()),
                            drive_letter: drive_letter(&subdir),
                            install_dir: install_dir.map(|path| path.to_string_lossy().to_string()),
                            size_bytes,
                        });
                    }
                }
            } else {
                // Single game folder (original behavior)
                if let Some(exe) = find_best_game_exe(&candidate) {
                    let Some(title) = candidate.file_name().and_then(|value| value.to_str()) else {
                        continue;
                    };
                    let install_dir = Some(candidate.to_path_buf());
                    let size_bytes = calculate_folder_size(&candidate);

                    games.push(DiscoveredGame {
                        id: format!("local_{}", stable_id(&candidate)),
                        title: title.to_string(),
                        storefront: "Local".to_string(),
                        external_app_id: stable_id(&candidate),
                        launch_uri: exe.to_string_lossy().to_string(),
                        executable_path: Some(exe.to_string_lossy().to_string()),
                        drive_letter: drive_letter(&candidate),
                        install_dir: install_dir.map(|path| path.to_string_lossy().to_string()),
                        size_bytes,
                    });
                }
            }
        }
    }
    games
}

fn stable_id(path: &Path) -> String {
    path.to_string_lossy()
        .bytes()
        .fold(5381_u64, |hash, byte| hash.wrapping_mul(33).wrapping_add(byte as u64))
        .to_string()
}

fn drive_letter(path: &Path) -> Option<String> {
    let text = path.to_string_lossy();
    let bytes = text.as_bytes();
    (bytes.len() >= 3 && bytes[1] == b':' && (bytes[2] == b'\\' || bytes[2] == b'/'))
        .then(|| text[..3].to_uppercase())
}

pub fn calculate_folder_size(dir: &Path) -> i64 {
    const MAX_DEPTH: usize = 5;
    let mut total_size: u64 = 0;
    let mut stack = vec![(dir.to_path_buf(), 0)];

    while let Some((directory, depth)) = stack.pop() {
        if depth > MAX_DEPTH {
            continue;
        }
        let entries = match fs::read_dir(&directory) {
            Ok(entries) => entries,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push((path, depth + 1));
            } else if path.is_file() {
                if let Ok(metadata) = entry.metadata() {
                    total_size += metadata.len();
                }
            }
        }
    }
    total_size as i64
}

fn find_best_game_exe(install_dir: &Path) -> Option<PathBuf> {
    tracing::debug!("find_best_game_exe scanning: {:?}", install_dir);
    const MAX_DEPTH: usize = 3;

    let folder_name = install_dir
        .file_name()
        .and_then(|v| v.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    let folder_name_simplified = folder_name
        .replace([' ', '-', '_', '.'], "")
        .replace("game", "")
        .replace("games", "");

    struct ExeCandidate {
        path: PathBuf,
        size: u64,
        name_score: i32,
        is_launcher: bool,
    }

    let mut candidates: Vec<ExeCandidate> = Vec::new();
    let mut stack = vec![(install_dir.to_path_buf(), 0)];
    let mut dirs_scanned = 0;
    let mut files_checked = 0;

    while let Some((directory, depth)) = stack.pop() {
        if depth > MAX_DEPTH {
            continue;
        }
        dirs_scanned += 1;
        let entries = match fs::read_dir(&directory) {
            Ok(entries) => entries,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(dirname) = path.file_name().and_then(|v| v.to_str()) {
                    if is_skipped_asset_dir(dirname) {
                        continue;
                    }
                }
                stack.push((path, depth + 1));
                continue;
            }
            files_checked += 1;
            let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
                continue;
            };
            let name_lower = name.to_ascii_lowercase();
            if !name_lower.ends_with(".exe") || ignored_executable(name) {
                continue;
            }

            let exe_stem = name.strip_suffix(".exe").unwrap_or(name);
            let exe_stem_lower = exe_stem.to_ascii_lowercase();

            // Check if this looks like a launcher/utility/system component
            let is_launcher = [
                "launcher", "updater", "patch", "install", "uninstall", "setup",
                "config", "settings", "tool", "utility", "helper", "service",
                "agent", "daemon", "manager", "bootstrapper", "patcher",
                "plugin", "sys", "hyp", "crash", "reporter", "bgm", "cef",
                "web", "browser", "host", "overlay", "wrapper", "useless",
                "questr", "global", "system", "runtime", "redist",
                "webhelper", "epicwebhelper", "hysafemode", "safemode",
                "anticheat", "anti-cheat", "be_service", "be_launcher",
                "battleye_launcher", "eula", "readme", "license", "uninstall",
                "repair", "verify", "dxsetup", "vcredist", "dotnet", "vc_redist",
                "msvc", "directx", "physx", "steamworks", "commonredist",
                "redistributable",
            ].iter().any(|kw| exe_stem_lower.contains(kw));

            // Calculate name similarity score
            let exe_simplified = exe_stem_lower
                .replace([' ', '-', '_', '.'], "")
                .replace("game", "")
                .replace("games", "");

            let name_score = if exe_simplified == folder_name_simplified {
                1000 // Exact match
            } else if exe_simplified.contains(&folder_name_simplified) || folder_name_simplified.contains(&exe_simplified) {
                500 // Partial match
            } else if folder_name_simplified.is_empty() {
                0
            } else {
                // Levenshtein-like similarity
                let common = exe_simplified.chars().filter(|c| folder_name_simplified.contains(*c)).count();
                (common as i32 * 100) / (exe_simplified.len().max(folder_name_simplified.len()) as i32).max(1)
            };

            let size = entry.metadata().map(|metadata| metadata.len()).unwrap_or_default();
            candidates.push(ExeCandidate { path, size, name_score, is_launcher });
        }
    }

    // Sort by: non-launcher first (false < true), then highest name_score, then largest size
    candidates.sort_by(|a, b| {
        a.is_launcher.cmp(&b.is_launcher)
            .then_with(|| b.name_score.cmp(&a.name_score))
            .then_with(|| b.size.cmp(&a.size))
    });

    tracing::debug!(
        "find_best_game_exe complete for {:?}: scanned {} dirs, checked {} files, candidates: {}, best: {:?}",
        install_dir,
        dirs_scanned,
        files_checked,
        candidates.len(),
        candidates.first().map(|c| &c.path)
    );

    candidates.first().map(|c| c.path.clone())
}

fn largest_game_exe(install_dir: &Path) -> Option<PathBuf> {
    // Alias for backward compatibility
    find_best_game_exe(install_dir)
}

fn is_version_folder(name: &str) -> bool {
    let name = name.to_ascii_lowercase();
    // Match version-like folders: 1.19.0.382, 2.0.0, v1.0.0, etc.
    let version_regex = regex::Regex::new(r"^(v?\d+(\.\d+){2,}(?:\.\d+)?)$").unwrap();
    if version_regex.is_match(&name) {
        return true;
    }
    // Also skip common non-game version folders
    matches!(
        name.as_str(),
        "temp" | "tmp" | "cache" | "logs" | "log" | "backup" | "backups" | "old"
    )
}

fn is_skipped_asset_dir(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    matches!(
        lower.as_str(),
        "data" | "assets" | "content" | "mods" | "textures" | "audio" | "movies"
            | "locales" | "engine" | "plugins" | "launcherplugins" | "redist"
            | "support" | "installers" | "tools" | "webcache" | "cef" | "mono"
            | "hyp_questr" | "useless_sys"
    ) || lower.contains("plugin") || lower.contains("launcher")
}

fn ignored_executable(name: &str) -> bool {
    let name = name.to_ascii_lowercase();
    [
        "crash",
        "handler",
        "redist",
        "prereq",
        "setup",
        "unins",
        "eac",
        "easyanticheat",
        "battleye",
        "benchmark",
        "config",
        "epicwebhelper",
        "webhelper",
        "hysafemode",
        "safemode",
        "anticheat",
        "anti-cheat",
        "be_service",
        "be_launcher",
        "battleye_launcher",
        "eula",
        "readme",
        "license",
        "uninstall",
        "repair",
        "verify",
        "dxsetup",
        "vcredist",
        "dotnet",
        "vc_redist",
        "msvc",
        "directx",
        "physx",
        "steamworks",
        "commonredist",
        "redistributable",
    ]
    .iter()
    .any(|keyword| name.contains(keyword))
}

mod steam {
    use super::*;
    use keyvalues_parser::{Value, Vdf};

    #[tracing::instrument]
    pub fn scan() -> Vec<DiscoveredGame> {
        tracing::info!("Steam scanner starting");
        let result = registry_paths().into_iter().flat_map(|path| scan_root(&path)).collect();
        tracing::info!("Steam scanner complete");
        result
    }

    fn registry_paths() -> Vec<PathBuf> {
        let mut paths = Vec::new();
        #[cfg(windows)]
        {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            if let Ok(key) = hkcu.open_subkey("Software\\Valve\\Steam") {
                if let Ok(path) = key.get_value::<String, _>("SteamPath") {
                    paths.push(PathBuf::from(path));
                }
            }
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            if let Ok(key) = hklm.open_subkey("SOFTWARE\\WOW6432Node\\Valve\\Steam") {
                if let Ok(path) = key.get_value::<String, _>("InstallPath") {
                    paths.push(PathBuf::from(path));
                }
            }
        }
        paths
    }

    fn scan_root(root: &Path) -> Vec<DiscoveredGame> {
        let library_file = root.join("steamapps/libraryfolders.vdf");
        let Ok(text) = fs::read_to_string(library_file) else {
            return Vec::new();
        };
        let Ok(vdf) = Vdf::parse(&text) else {
            return Vec::new();
        };
        let mut libraries = vec![root.to_path_buf()];
        collect_library_paths(&vdf.value, &mut libraries);
        libraries.into_iter().flat_map(|library| scan_library(&library)).collect()
    }

    fn collect_library_paths(value: &Value<'_>, libraries: &mut Vec<PathBuf>) {
        let Some(object) = value.get_obj() else {
            return;
        };
        for values in object.values() {
            for value in values {
                if let Some(object) = value.get_obj() {
                    if let Some(path) = string_value(object, "path") {
                        libraries.push(PathBuf::from(path));
                    }
                    collect_library_paths(value, libraries);
                }
            }
        }
    }

    fn scan_library(library: &Path) -> Vec<DiscoveredGame> {
        let steamapps = library.join("steamapps");
        let Ok(entries) = fs::read_dir(&steamapps) else {
            return Vec::new();
        };
        entries
            .flatten()
            .filter_map(|entry| {
                let filename = entry.file_name().to_string_lossy().to_string();
                if !filename.starts_with("appmanifest_") || !filename.ends_with(".acf") {
                    return None;
                }
                let app_id = filename.strip_prefix("appmanifest_")?.strip_suffix(".acf")?;
                let text = fs::read_to_string(entry.path()).ok()?;
                let vdf = Vdf::parse(&text).ok()?;
                let object = vdf.value.get_obj()?;
                let title = string_value(object, "name")?;
                let install_dir_name = string_value(object, "installdir")?;
                let install_dir = steamapps.join("common").join(install_dir_name);
                let executable = largest_game_exe(&install_dir);
                let size_bytes = string_value(object, "SizeOnDisk")
                    .and_then(|value| value.parse::<i64>().ok())
                    .unwrap_or_default();
                Some(DiscoveredGame {
                    id: format!("steam_{app_id}"),
                    title: title.to_string(),
                    storefront: "Steam".to_string(),
                    external_app_id: app_id.to_string(),
                    launch_uri: format!("steam://rungameid/{app_id}"),
                    executable_path: executable.map(|path| path.to_string_lossy().to_string()),
                    install_dir: install_dir.is_dir().then(|| install_dir.to_string_lossy().to_string()),
                    drive_letter: drive_letter(&install_dir),
                    size_bytes,
                })
            })
            .collect()
    }

    fn string_value<'a>(object: &'a keyvalues_parser::Obj<'a>, key: &str) -> Option<&'a str> {
        object.get(key)?.first()?.get_str()
    }
}

mod epic {
    use super::*;
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    struct Manifest {
        #[serde(rename = "AppName")]
        app_name: String,
        #[serde(rename = "DisplayName")]
        display_name: String,
        #[serde(rename = "InstallLocation")]
        install_location: String,
        #[serde(rename = "LaunchExecutable")]
        launch_executable: Option<String>,
        #[serde(rename = "InstallSize", default)]
        install_size: i64,
    }

    #[tracing::instrument]
    pub fn scan() -> Vec<DiscoveredGame> {
        tracing::info!("Epic scanner starting");
        let paths = [
            PathBuf::from(r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests"),
            PathBuf::from(r"C:\Program Files (x86)\Epic Games\Launcher\Portal\Data\Manifests"),
        ];
        let result = paths.into_iter().flat_map(|path| scan_dir(&path)).collect();
        tracing::info!("Epic scanner complete");
        result
    }

    fn scan_dir(path: &Path) -> Vec<DiscoveredGame> {
        let Ok(entries) = fs::read_dir(path) else {
            return Vec::new();
        };
        entries
            .flatten()
            .filter_map(|entry| {
                let is_item = entry
                    .path()
                    .extension()
                    .and_then(|value| value.to_str())
                    .is_some_and(|value| value.eq_ignore_ascii_case("item"));
                if !is_item {
                    return None;
                }
                let manifest: Manifest =
                    serde_json::from_str(&fs::read_to_string(entry.path()).ok()?).ok()?;
                let install_dir = PathBuf::from(&manifest.install_location);
                let executable = manifest
                    .launch_executable
                    .as_deref()
                    .map(|value| install_dir.join(value))
                    .filter(|path| path.is_file())
                    .or_else(|| largest_game_exe(&install_dir));
                Some(DiscoveredGame {
                    id: format!("epic_{}", manifest.app_name),
                    title: manifest.display_name,
                    storefront: "Epic".to_string(),
                    external_app_id: manifest.app_name.clone(),
                    launch_uri: format!(
                        "com.epicgames.launcher://apps/{}?action=launch&silent=true",
                        manifest.app_name
                    ),
                    executable_path: executable.map(|path| path.to_string_lossy().to_string()),
                    install_dir: install_dir.is_dir().then(|| install_dir.to_string_lossy().to_string()),
                    drive_letter: drive_letter(&install_dir),
                    size_bytes: manifest.install_size,
                })
            })
            .collect()
    }
}

mod ubisoft {
    use super::*;

    #[tracing::instrument]
    pub fn scan() -> Vec<DiscoveredGame> {
        tracing::info!("Ubisoft scanner starting");
        #[cfg(not(windows))]
        {
            Vec::new()
        }
        #[cfg(windows)]
        {
            let root = RegKey::predef(HKEY_LOCAL_MACHINE);
            let Ok(installs) =
                root.open_subkey("SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs")
            else {
                tracing::info!("Ubisoft scanner complete: registry key not found");
                return Vec::new();
            };
            let result = installs
                .enum_keys()
                .filter_map(Result::ok)
                .filter_map(|id| {
                    let key = installs.open_subkey(&id).ok()?;
                    let install_dir = PathBuf::from(key.get_value::<String, _>("InstallDir").ok()?);
                    let executable = largest_game_exe(&install_dir);
                    let title = install_dir.file_name()?.to_string_lossy().to_string();
                    Some(DiscoveredGame {
                        id: format!("ubisoft_{id}"),
                        title,
                        storefront: "Ubisoft".to_string(),
                        external_app_id: id.clone(),
                        launch_uri: format!("uplay://launch/{id}/0"),
                        executable_path: executable.map(|path| path.to_string_lossy().to_string()),
                        install_dir: install_dir.is_dir().then(|| install_dir.to_string_lossy().to_string()),
                        drive_letter: drive_letter(&install_dir),
                        size_bytes: 0,
                    })
                })
                .collect();
            tracing::info!("Ubisoft scanner complete");
            result
        }
    }
}

mod gog {
    use super::*;

    #[tracing::instrument]
    pub fn scan() -> Vec<DiscoveredGame> {
        tracing::info!("GOG scanner starting");
        #[cfg(not(windows))]
        {
            Vec::new()
        }
        #[cfg(windows)]
        {
            let config_path = PathBuf::from(r"C:\ProgramData\GOG.com\Galaxy\config.json");
            if !config_path.is_file() {
                tracing::info!("GOG scanner complete: config.json not found");
                return Vec::new();
            }
            let text = match fs::read_to_string(&config_path) {
                Ok(t) => t,
                Err(_) => {
                    tracing::info!("GOG scanner complete: failed to read config.json");
                    return Vec::new();
                }
            };
            let config: serde_json::Value = match serde_json::from_str(&text) {
                Ok(v) => v,
                Err(_) => {
                    tracing::info!("GOG scanner complete: failed to parse config.json");
                    return Vec::new();
                }
            };

            let games_array = config["games"].as_array().cloned().unwrap_or_default();
            let result = games_array
                .iter()
                .filter_map(|game| {
                    let name = game["gameName"].as_str()?;
                    let path = game["path"].as_str()?;
                    let exe = game["exe"].as_str().or_else(|| game["gameName"].as_str());
                    let install_dir = PathBuf::from(path);
                    let executable = exe
                        .and_then(|e| install_dir.join(e).is_file().then_some(install_dir.join(e)))
                        .or_else(|| largest_game_exe(&install_dir));

                    Some(DiscoveredGame {
                        id: format!("gog_{}", stable_id(Path::new(path))),
                        title: name.to_string(),
                        storefront: "GOG".to_string(),
                        external_app_id: stable_id(Path::new(path)),
                        launch_uri: format!(
                            "goggalaxy://launch/{}/0",
                            stable_id(Path::new(path))
                        ),
                        executable_path: executable.map(|path| path.to_string_lossy().to_string()),
                        install_dir: install_dir.is_dir().then(|| install_dir.to_string_lossy().to_string()),
                        drive_letter: drive_letter(&install_dir),
                        size_bytes: 0,
                    })
                })
                .collect();
            tracing::info!("GOG scanner complete");
            result
        }
    }
}

mod ea {
    use super::*;

    #[tracing::instrument]
    pub fn scan() -> Vec<DiscoveredGame> {
        tracing::info!("EA scanner starting");
        #[cfg(not(windows))]
        {
            Vec::new()
        }
        #[cfg(windows)]
        {
            let paths = [
                PathBuf::from(r"C:\ProgramData\Electronic Arts\EA Desktop\InstalledGames"),
                PathBuf::from(r"C:\Program Files (x86)\Origin Games"),
            ];
            let result = paths.into_iter().flat_map(|path| {
                tracing::debug!("EA scanning directory: {:?}", path);
                scan_dir(&path)
            }).collect();
            tracing::info!("EA scanner complete");
            result
        }
    }

    fn scan_dir(path: &Path) -> Vec<DiscoveredGame> {
        let Ok(entries) = fs::read_dir(path) else {
            tracing::debug!("EA scan_dir: failed to read {:?}", path);
            return Vec::new();
        };
        entries
            .flatten()
            .filter_map(|entry| {
                let p = entry.path();
                if !p.is_dir() {
                    return None;
                }
                tracing::debug!("EA scanning game folder: {:?}", p);
                let title = p.file_name()?.to_string_lossy().to_string();
                let executable = largest_game_exe(&p);
                tracing::debug!("EA found game: {} (exe: {:?})", title, executable);
                Some(DiscoveredGame {
                    id: format!("ea_{}", stable_id(&p)),
                    title: title.clone(),
                    storefront: "EA".to_string(),
                    external_app_id: stable_id(&p),
                    launch_uri: format!("ea://launch/{}", stable_id(&p)),
                    executable_path: executable.map(|path| path.to_string_lossy().to_string()),
                    install_dir: p.is_dir().then(|| p.to_string_lossy().to_string()),
                    drive_letter: drive_letter(&p),
                    size_bytes: 0,
                })
            })
            .collect()
    }
}

mod battle_net {
    use super::*;

    #[tracing::instrument]
    pub fn scan() -> Vec<DiscoveredGame> {
        tracing::info!("Battle.net scanner starting");
        #[cfg(not(windows))]
        {
            Vec::new()
        }
        #[cfg(windows)]
        {
            let paths = [
                PathBuf::from(r"C:\Program Files (x86)\Battle.net"),
                PathBuf::from(r"C:\Program Files\Battle.net"),
            ];
            let result = paths.into_iter().flat_map(|path| {
                tracing::debug!("Battle.net scanning directory: {:?}", path);
                scan_dir(&path)
            }).collect();
            tracing::info!("Battle.net scanner complete");
            result
        }
    }

    fn scan_dir(path: &Path) -> Vec<DiscoveredGame> {
        let games_dir = path.join("Games");
        if !games_dir.is_dir() {
            tracing::debug!("Battle.net scan_dir: Games folder not found at {:?}", games_dir);
            return Vec::new();
        }
        let Ok(entries) = fs::read_dir(&games_dir) else {
            tracing::debug!("Battle.net scan_dir: failed to read {:?}", games_dir);
            return Vec::new();
        };
        entries
            .flatten()
            .filter_map(|entry| {
                let p = entry.path();
                if !p.is_dir() {
                    return None;
                }
                tracing::debug!("Battle.net scanning game folder: {:?}", p);
                let title = p.file_name()?.to_string_lossy().to_string();
                let executable = largest_game_exe(&p);
                tracing::debug!("Battle.net found game: {} (exe: {:?})", title, executable);
                Some(DiscoveredGame {
                    id: format!("battlenet_{}", stable_id(&p)),
                    title: title.clone(),
                    storefront: "Battle.net".to_string(),
                    external_app_id: stable_id(&p),
                    launch_uri: format!("battlenet://launch/{}", stable_id(&p)),
                    executable_path: executable.map(|path| path.to_string_lossy().to_string()),
                    install_dir: p.is_dir().then(|| p.to_string_lossy().to_string()),
                    drive_letter: drive_letter(&p),
                    size_bytes: 0,
                })
            })
            .collect()
    }
}
