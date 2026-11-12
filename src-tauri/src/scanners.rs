use crate::db::DiscoveredGame;
use std::fs;
use std::path::{Path, PathBuf};

#[cfg(windows)]
use winreg::{enums::*, RegKey};

pub fn scan_all(custom_paths: Option<&[String]>) -> Vec<DiscoveredGame> {
    let mut games = Vec::new();
    games.extend(steam::scan());
    games.extend(epic::scan());
    games.extend(ubisoft::scan());

    if let Some(paths) = custom_paths {
        for path in paths {
            games.extend(scan_custom_path(Path::new(path)));
        }
    }
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
            && candidate.extension().and_then(|value| value.to_str()).is_some_and(|value| value.eq_ignore_ascii_case("exe"))
        {
            let Some(title) = candidate.file_stem().and_then(|value| value.to_str()) else { continue };
            let install_dir = candidate.parent().map(Path::to_path_buf);
            games.push(DiscoveredGame {
                id: format!("local_{}", stable_id(&candidate)),
                title: title.to_string(),
                storefront: "Local".to_string(),
                external_app_id: stable_id(&candidate),
                launch_uri: candidate.to_string_lossy().to_string(),
                executable_path: Some(candidate.to_string_lossy().to_string()),
                drive_letter: drive_letter(&candidate),
                install_dir: install_dir.map(|path| path.to_string_lossy().to_string()),
                size_bytes: fs::metadata(&candidate).map(|metadata| metadata.len() as i64).unwrap_or_default(),
            });
        }
    }
    games
}

fn stable_id(path: &Path) -> String {
    path.to_string_lossy().bytes().fold(5381_u64, |hash, byte| hash.wrapping_mul(33).wrapping_add(byte as u64)).to_string()
}

fn drive_letter(path: &Path) -> Option<String> {
    let text = path.to_string_lossy();
    let bytes = text.as_bytes();
    (bytes.len() >= 3 && bytes[1] == b':' && (bytes[2] == b'\\' || bytes[2] == b'/')).then(|| text[..3].to_uppercase())
}

fn largest_game_exe(install_dir: &Path) -> Option<PathBuf> {
    let mut best: Option<(u64, PathBuf)> = None;
    let mut stack = vec![install_dir.to_path_buf()];
    while let Some(directory) = stack.pop() {
        let entries = match fs::read_dir(directory) {
            Ok(entries) => entries,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
                continue;
            }
            let Some(name) = path.file_name().and_then(|value| value.to_str()) else { continue };
            if !name.to_ascii_lowercase().ends_with(".exe") || ignored_executable(name) {
                continue;
            }
            let size = entry.metadata().map(|metadata| metadata.len()).unwrap_or_default();
            if best.as_ref().is_none_or(|(best_size, _)| size > *best_size) {
                best = Some((size, path));
            }
        }
    }
    best.map(|(_, path)| path)
}

fn ignored_executable(name: &str) -> bool {
    let name = name.to_ascii_lowercase();
    ["crash", "handler", "redist", "prereq", "setup", "unins", "eac", "easyanticheat", "battleye", "benchmark", "config"]
        .iter()
        .any(|keyword| name.contains(keyword))
}

mod steam {
    use super::*;
    use keyvalues_parser::{Value, Vdf};

    pub fn scan() -> Vec<DiscoveredGame> {
        registry_paths().into_iter().flat_map(|path| scan_root(&path)).collect()
    }

    fn registry_paths() -> Vec<PathBuf> {
        let mut paths = Vec::new();
        #[cfg(windows)]
        {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            if let Ok(key) = hkcu.open_subkey("Software\\Valve\\Steam") {
                if let Ok(path) = key.get_value::<String, _>("SteamPath") { paths.push(PathBuf::from(path)); }
            }
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            if let Ok(key) = hklm.open_subkey("SOFTWARE\\WOW6432Node\\Valve\\Steam") {
                if let Ok(path) = key.get_value::<String, _>("InstallPath") { paths.push(PathBuf::from(path)); }
            }
        }
        paths
    }

    fn scan_root(root: &Path) -> Vec<DiscoveredGame> {
        let library_file = root.join("steamapps/libraryfolders.vdf");
        let Ok(text) = fs::read_to_string(library_file) else { return Vec::new() };
        let Ok(vdf) = Vdf::parse(&text) else { return Vec::new() };
        let mut libraries = vec![root.to_path_buf()];
        collect_library_paths(&vdf.value, &mut libraries);
        libraries.into_iter().flat_map(|library| scan_library(&library)).collect()
    }

    fn collect_library_paths(value: &Value<'_>, libraries: &mut Vec<PathBuf>) {
        let Some(object) = value.get_obj() else { return };
        for values in object.values() {
            for value in values {
                if let Some(object) = value.get_obj() {
                    if let Some(path) = string_value(object, "path") { libraries.push(PathBuf::from(path)); }
                    collect_library_paths(value, libraries);
                }
            }
        }
    }

    fn scan_library(library: &Path) -> Vec<DiscoveredGame> {
        let steamapps = library.join("steamapps");
        let Ok(entries) = fs::read_dir(&steamapps) else { return Vec::new() };
        entries.flatten().filter_map(|entry| {
            let filename = entry.file_name().to_string_lossy().to_string();
            if !filename.starts_with("appmanifest_") || !filename.ends_with(".acf") { return None; }
            let app_id = filename.strip_prefix("appmanifest_")?.strip_suffix(".acf")?;
            let text = fs::read_to_string(entry.path()).ok()?;
            let vdf = Vdf::parse(&text).ok()?;
            let object = vdf.value.get_obj()?;
            let title = string_value(object, "name")?;
            let install_dir_name = string_value(object, "installdir")?;
            let install_dir = steamapps.join("common").join(install_dir_name);
            let executable = largest_game_exe(&install_dir);
            let size_bytes = string_value(object, "SizeOnDisk").and_then(|value| value.parse::<i64>().ok()).unwrap_or_default();
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
        }).collect()
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
        #[serde(rename = "AppName")] app_name: String,
        #[serde(rename = "DisplayName")] display_name: String,
        #[serde(rename = "InstallLocation")] install_location: String,
        #[serde(rename = "LaunchExecutable")] launch_executable: Option<String>,
        #[serde(rename = "InstallSize", default)] install_size: i64,
    }

    pub fn scan() -> Vec<DiscoveredGame> {
        let paths = [
            PathBuf::from(r"C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests"),
            PathBuf::from(r"C:\Program Files (x86)\Epic Games\Launcher\Portal\Data\Manifests"),
        ];
        paths.into_iter().flat_map(|path| scan_dir(&path)).collect()
    }

    fn scan_dir(path: &Path) -> Vec<DiscoveredGame> {
        let Ok(entries) = fs::read_dir(path) else { return Vec::new() };
        entries.flatten().filter_map(|entry| {
            let is_item = entry.path().extension().and_then(|value| value.to_str()).is_some_and(|value| value.eq_ignore_ascii_case("item"));
            if !is_item { return None; }
            let manifest: Manifest = serde_json::from_str(&fs::read_to_string(entry.path()).ok()?).ok()?;
            let install_dir = PathBuf::from(&manifest.install_location);
            let executable = manifest.launch_executable.as_deref().map(|value| install_dir.join(value)).filter(|path| path.is_file()).or_else(|| largest_game_exe(&install_dir));
            Some(DiscoveredGame {
                id: format!("epic_{}", manifest.app_name),
                title: manifest.display_name,
                storefront: "Epic".to_string(),
                external_app_id: manifest.app_name.clone(),
                launch_uri: format!("com.epicgames.launcher://apps/{}?action=launch&silent=true", manifest.app_name),
                executable_path: executable.map(|path| path.to_string_lossy().to_string()),
                install_dir: install_dir.is_dir().then(|| install_dir.to_string_lossy().to_string()),
                drive_letter: drive_letter(&install_dir),
                size_bytes: manifest.install_size,
            })
        }).collect()
    }
}

mod ubisoft {
    use super::*;

    pub fn scan() -> Vec<DiscoveredGame> {
        #[cfg(not(windows))]
        { return Vec::new(); }
        #[cfg(windows)]
        {
            let root = RegKey::predef(HKEY_LOCAL_MACHINE);
            let Ok(installs) = root.open_subkey("SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs") else { return Vec::new() };
            installs.enum_keys().filter_map(Result::ok).filter_map(|id| {
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
            }).collect()
        }
    }
}
