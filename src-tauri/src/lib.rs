#![allow(unexpected_cfgs)]

#[tauri::command]
fn set_page_zoom(webview_window: tauri::WebviewWindow, scale: f64) -> Result<f64, String> {
  #[cfg(target_os = "macos")]
  {
    use objc::{msg_send, sel, sel_impl};
    use objc::runtime::Object;
    let ns_view = webview_window.ns_view().map_err(|e| e.to_string())?;
    unsafe {
      let ns_view_ptr = ns_view as *mut Object;
      let subviews: *mut Object = msg_send![ns_view_ptr, subviews];
      let count: usize = msg_send![subviews, count];
      for i in 0..count {
        let subview: *mut Object = msg_send![subviews, objectAtIndex: i];
        let responds: bool = msg_send![subview, respondsToSelector: sel!(setPageZoom:)];
        if responds {
          let _: () = msg_send![subview, setPageZoom: scale];
          return Ok(scale);
        }
      }
      Err("WKWebView not found in subview hierarchy".to_string())
    }
  }
  #[cfg(not(target_os = "macos"))]
  {
    webview_window
      .eval(&format!("document.documentElement.style.zoom = '{}'", scale))
      .map(|_| scale)
      .map_err(|e| e.to_string())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![set_page_zoom])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
