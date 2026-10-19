use tauri::{Manager, WebviewWindow};
use std::fs::{File, metadata};
use std::io::Write;

#[cfg(target_os = "windows")]
fn pin_to_bottom(window: &WebviewWindow) {
    use windows_sys::Win32::Foundation::HWND;
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        SetWindowPos, HWND_BOTTOM, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW,
    };

    if let Ok(hwnd) = window.hwnd() {
        let app_hwnd = hwnd.0 as HWND;
        unsafe {
            SetWindowPos(
                app_hwnd,
                HWND_BOTTOM,
                0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW,
            );
        }
    }
}

#[tauri::command]
fn read_family_file() -> Option<String> {
    let dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    std::fs::read_to_string(dir.join("family.json"))
        .ok()
        .or_else(|| Some(include_str!("family_default.json").to_string()))
}
#[tauri::command]
fn read_settings_file() -> Option<String> {
    let dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    std::fs::read_to_string(dir.join("settings.json"))
        .ok()
        .or_else(|| Some(include_str!("settings_default.json").to_string()))
}
#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_family_file, read_settings_file, quit_app])
        .setup(|app| {
            if let Ok(mut exe_path) = std::env::current_exe() {
                exe_path.pop();
                
                let defaults: [(&str, &str); 2] = [
                    ("family.json", include_str!("family_default.json")),
                    ("settings.json", include_str!("settings_default.json")),
                ];
                for (name, body) in defaults {
                    let path = exe_path.join(name);
                    if metadata(&path).is_err() {
                        if let Ok(mut file) = File::create(&path) {
                            let _ = file.write_all(body.as_bytes());
                        }
                    }
                }
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.maximize();
                #[cfg(target_os = "windows")]
                pin_to_bottom(&window);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
