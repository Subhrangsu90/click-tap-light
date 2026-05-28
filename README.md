# ClickLight

ClickLight is a polished Windows tray app that makes every click easy to follow during live demos, screen sharing, UX reviews, training, and walkthroughs.

This is built with Electron because a desktop overlay needs Windows APIs that React Native does not handle cleanly on its own.

## Features

- Always-on-top transparent overlay
- Click-through, so it never blocks your real apps
- Global left, right, and middle click detection
- Tray menu toggle
- Compact controls window
- Adjustable color, ring size, fade speed, and custom label text
- Advanced stroke, glow, opacity, double-ring, center-flash, and label-position controls
- Presets for demo, review, and subtle highlighting
- Hotkeys: `Ctrl+Alt+H` toggles highlighting, `Ctrl+Alt+C` opens controls
- Settings are saved automatically
- Multi-monitor support
- Compact floating controller UI
- Custom ClickLight app and tray icon
- Optional launch at Windows startup
- Optional keyboard shortcut overlay for visible shortcuts like `Ctrl + S`

## Run

```powershell
npm install
npm start
```

The app opens a controls window and adds a tray icon. Close the controls window to keep the tray app running.

To open the controls again, click the ClickLight tray icon near the Windows clock, choose **Show Controls** from its tray menu, or press `Ctrl+Alt+C`.

## Build a Windows Portable App

```powershell
npm run package:win
```

The packaged app will be created under `dist`.

## Notes

- Windows may ask for permission the first time PowerShell runs the mouse-hook helper.
- Some elevated/admin apps can block normal-process global hooks. Run Click Tap Light as administrator if you need highlighting over admin windows.
- The current global click detector is Windows-only. The Electron shell and overlay can be adapted for macOS/Linux, but those platforms need their own native mouse hook helper.
