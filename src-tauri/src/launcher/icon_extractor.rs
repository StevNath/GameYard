use std::path::Path;
use std::os::windows::ffi::OsStrExt;
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use windows::Win32::UI::Shell::{ExtractIconExW, SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON, SHGFI_SMALLICON, SHGFI_FLAGS};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, ICONINFO, HICON};
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{CreateCompatibleDC, SelectObject, DeleteDC, DeleteObject, GetObjectW, GetDC, ReleaseDC, GetDIBits, BITMAP, BITMAPINFO, BITMAPINFOHEADER, RGBQUAD, BI_RGB, DIB_RGB_COLORS};
#[cfg(target_os = "windows")]
use windows::Win32::System::Com::{CoInitializeEx, CoUninitialize, COINIT_APARTMENTTHREADED};
#[cfg(target_os = "windows")]
use windows::core::PCWSTR;

use image::{ImageBuffer, Rgba, GenericImageView};
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Clone, serde::Serialize)]
pub struct IconData {
    pub base64_png: String,
    pub width: u32,
    pub height: u32,
}

fn get_icon_cache_dir(app: &AppHandle) -> std::path::PathBuf {
    let mut path = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    path.push("icons");
    let _ = std::fs::create_dir_all(&path);
    path
}

fn cache_key(exe_path: &Path) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    exe_path.hash(&mut hasher);
    let metadata = std::fs::metadata(exe_path).ok();
    if let Some(meta) = metadata {
        meta.modified().ok().hash(&mut hasher);
        meta.len().hash(&mut hasher);
    }
    format!("{:x}.png", hasher.finish())
}

#[cfg(target_os = "windows")]
fn hicon_to_png_base64(hicon: HICON) -> Option<IconData> {
    unsafe {
        let mut icon_info: ICONINFO = std::mem::zeroed();
        if GetIconInfo(hicon, &mut icon_info).is_err() {
            return None;
        }

        let hbm_color = icon_info.hbmColor;
        let hbm_mask = icon_info.hbmMask;

        if hbm_color.0.is_null() || hbm_mask.0.is_null() {
            if !hbm_color.0.is_null() { let _ = DeleteObject(hbm_color); }
            if !hbm_mask.0.is_null() { let _ = DeleteObject(hbm_mask); }
            return None;
        }

        let hdc_screen = GetDC(HWND(std::ptr::null_mut()));
        let hdc_mem = CreateCompatibleDC(hdc_screen);
        if hdc_mem.0.is_null() {
            ReleaseDC(HWND(std::ptr::null_mut()), hdc_screen);
            let _ = DeleteObject(hbm_color);
            let _ = DeleteObject(hbm_mask);
            return None;
        }

        let mut bmp: BITMAP = std::mem::zeroed();
        if GetObjectW(hbm_color, std::mem::size_of::<BITMAP>() as i32, Some(&mut bmp as *mut _ as *mut _)) == 0 {
            let _ = DeleteDC(hdc_mem);
            ReleaseDC(HWND(std::ptr::null_mut()), hdc_screen);
            let _ = DeleteObject(hbm_color);
            let _ = DeleteObject(hbm_mask);
            return None;
        }

        let width = bmp.bmWidth as u32;
        let height = bmp.bmHeight as u32;

        let hbm_old = SelectObject(hdc_mem, hbm_color);

        let mut pixels = vec![0u8; (width * height * 4) as usize];

        let mut bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: width as i32,
                biHeight: -(height as i32),
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                biSizeImage: 0,
                biXPelsPerMeter: 0,
                biYPelsPerMeter: 0,
                biClrUsed: 0,
                biClrImportant: 0,
            },
            bmiColors: [RGBQUAD::default(); 1],
        };

        let lines = GetDIBits(
            hdc_mem,
            hbm_color,
            0,
            height,
            Some(pixels.as_mut_ptr() as *mut _),
            &mut bmi,
            DIB_RGB_COLORS,
        );

        SelectObject(hdc_mem, hbm_old);
        let _ = DeleteDC(hdc_mem);
        ReleaseDC(HWND(std::ptr::null_mut()), hdc_screen);
        let _ = DeleteObject(hbm_color);
        let _ = DeleteObject(hbm_mask);

        if lines == 0 {
            return None;
        }

        let img: ImageBuffer<Rgba<u8>, _> = ImageBuffer::from_raw(width, height, pixels)?;
        let mut buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Png).ok()?;
        let b64 = general_purpose::STANDARD.encode(&buf);

        Some(IconData {
            base64_png: b64,
            width,
            height,
        })
    }
}

#[cfg(target_os = "windows")]
pub fn extract_icon(app: &AppHandle, exe_path: &Path, large: bool) -> Option<IconData> {
    let cache_dir = get_icon_cache_dir(app);
    let key = cache_key(exe_path);
    let cache_path = cache_dir.join(if large { format!("large_{}", key) } else { key });

    if cache_path.exists() {
        if let Ok(bytes) = std::fs::read(&cache_path) {
            let b64 = general_purpose::STANDARD.encode(&bytes);
            if let Ok(img) = image::load_from_memory(&bytes) {
                let (w, h) = img.dimensions();
                return Some(IconData { base64_png: b64, width: w, height: h });
            }
        }
    }

    let exe_wide: Vec<u16> = exe_path.as_os_str().encode_wide().chain(Some(0)).collect();
    let exe_pcwstr = PCWSTR(exe_wide.as_ptr());

    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let mut hicon_large: HICON = HICON::default();
        let mut hicon_small: HICON = HICON::default();
        let count = ExtractIconExW(exe_pcwstr, 0, Some(&mut hicon_large), Some(&mut hicon_small), 1);

        let hicon = if large { hicon_large } else { hicon_small };

        if count > 0 && !hicon.0.is_null() {
            let result = hicon_to_png_base64(hicon);
            let _ = DestroyIcon(hicon);
            if !hicon_small.0.is_null() && hicon_small != hicon {
                let _ = DestroyIcon(hicon_small);
            }
            if !hicon_large.0.is_null() && hicon_large != hicon {
                let _ = DestroyIcon(hicon_large);
            }
            CoUninitialize();

            if let Some(icon_data) = &result {
                let _ = std::fs::write(
                    &cache_path,
                    general_purpose::STANDARD
                        .decode(&icon_data.base64_png)
                        .unwrap_or_default(),
                );
            }
            return result;
        }

        let mut shfi: SHFILEINFOW = std::mem::zeroed();
        let flags = SHGFI_FLAGS(SHGFI_ICON.0 | if large { SHGFI_LARGEICON.0 } else { SHGFI_SMALLICON.0 });
        let ret = SHGetFileInfoW(
            exe_pcwstr,
            windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES(0),
            Some(&mut shfi),
            std::mem::size_of::<SHFILEINFOW>() as u32,
            flags,
        );

        CoUninitialize();

        if ret != 0 && !shfi.hIcon.0.is_null() {
            let result = hicon_to_png_base64(shfi.hIcon);
            let _ = DestroyIcon(shfi.hIcon);
            if let Some(icon_data) = &result {
                let _ = std::fs::write(
                    &cache_path,
                    general_purpose::STANDARD
                        .decode(&icon_data.base64_png)
                        .unwrap_or_default(),
                );
            }
            return result;
        }
    }

    None
}

#[cfg(not(target_os = "windows"))]
pub fn extract_icon(_app: &AppHandle, _exe_path: &Path, _large: bool) -> Option<IconData> {
    None
}

#[tauri::command]
pub fn get_game_icon(
    exe_path: String,
    large: Option<bool>,
    app: AppHandle,
) -> Result<Option<IconData>, String> {
    let path = Path::new(&exe_path);
    if !path.exists() {
        return Ok(None);
    }
    Ok(extract_icon(&app, path, large.unwrap_or(false)))
}

#[tauri::command]
pub fn clear_icon_cache(app: AppHandle) -> Result<(), String> {
    let cache_dir = get_icon_cache_dir(&app);
    if cache_dir.exists() {
        std::fs::remove_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key_generation() {
        let p = Path::new("C:\\Test\\game.exe");
        let k1 = cache_key(p);
        let k2 = cache_key(p);
        assert_eq!(k1, k2);
        assert!(k1.ends_with(".png"));
    }
}