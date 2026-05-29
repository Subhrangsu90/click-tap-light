const {
	app,
	BrowserWindow,
	Tray,
	Menu,
	ipcMain,
	screen,
	nativeImage,
	globalShortcut,
} = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const fs = require("node:fs");

let tray;
let controlWindow;
let settingsWindow;
let hookProcess;
let enabled = true;
let ignoreControlToggleUntil = 0;
const platformSupported = process.platform === "win32";
const defaultSettings = {
	color: "#88a97c",
	secondaryColor: "#f8fbf5",
	colorMode: "same",
	leftColor: "#88a97c",
	rightColor: "#f87171",
	middleColor: "#60a5fa",
	labelText: "Click",
	size: 96,
	duration: 620,
	stroke: 4,
	opacity: 96,
	glow: 32,
	showKeystrokes: true,
	keystrokeDuration: 1100,
	showLabel: true,
	labelPosition: "bottom",
	doubleRing: true,
	followThrough: true,
	highlightLeft: true,
	highlightRight: true,
	highlightMiddle: true,
	controlAlwaysOnTop: true,
};
let settings = { ...defaultSettings };
let controlBounds = null;

const overlays = new Map();
let settingsPath;

const overlayHtml = path.join(__dirname, "overlay", "overlay.html");
const controlHtml = path.join(__dirname, "control", "control.html");
const settingsHtml = path.join(__dirname, "control", "settings.html");
const hookScript = path.join(__dirname, "hooks", "mouse-hook.ps1");
const iconPath = path.join(__dirname, "..", "build", "icon.ico");

function createTrayIcon() {
	const svg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#88a97c"/>
      <circle cx="16" cy="16" r="8" fill="none" stroke="#d7ebd0" stroke-width="3"/>
      <circle cx="16" cy="16" r="3" fill="#f8fbf5"/>
    </svg>`;
	const icon = nativeImage.createFromPath(iconPath);
	return icon.isEmpty()
		? nativeImage.createFromDataURL(
				`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
			)
		: icon;
}

function updateTrayMenu() {
	if (!tray) return;

	tray.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: enabled ? "RippleClick: On" : "RippleClick: Off",
				type: "checkbox",
				checked: enabled,
				click: () => {
					enabled = !enabled;
					broadcastState();
					updateTrayMenu();
				},
			},
			{ type: "separator" },
			{ label: "Open Controller", click: showControlWindow },
			{ label: "Open Settings", click: showSettingsWindow },
			{
				label: "Preview Ripple",
				click: () =>
					emitClick({ button: "left", x: 160, y: 160, test: true }),
			},
			{ type: "separator" },
			{
				label: platformSupported
					? "Mouse Hook: Windows active"
					: "Mouse Hook: Windows only",
				enabled: false,
			},
			{ label: "Toggle Ripple: Ctrl+Alt+H", enabled: false },
			{ label: "Open Controller: Ctrl+Alt+C", enabled: false },
			{ type: "separator" },
			{ label: "Quit", click: () => app.quit() },
		]),
	);
}

function showControlWindow() {
	if (controlWindow) {
		if (controlWindow.isMinimized()) controlWindow.restore();
		controlWindow.show();
		applyControlWindowOptions();
		if (settings.controlAlwaysOnTop) {
			controlWindow.moveTop();
		} else {
			controlWindow.focus();
		}
		return;
	}

	const savedBounds = getUsableControlBounds();
	const savedPosition = savedBounds
		? { x: savedBounds.x, y: savedBounds.y }
		: {};
	controlWindow = new BrowserWindow({
		width: 430,
		height: 174,
		...savedPosition,
		minWidth: 390,
		minHeight: 156,
		title: "RippleClick",
		frame: false,
		transparent: true,
		resizable: false,
		maximizable: false,
		alwaysOnTop: settings.controlAlwaysOnTop,
		autoHideMenuBar: true,
		backgroundColor: "#00000000",
		icon: iconPath,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	controlWindow.loadFile(controlHtml);
	applyControlWindowOptions();
	controlWindow.on("moved", saveControlBounds);
	controlWindow.on("close", (event) => {
		if (!app.isQuitting) {
			event.preventDefault();
			controlWindow.hide();
		}
	});
	controlWindow.on("closed", () => {
		controlWindow = null;
	});
}

function showSettingsWindow() {
	if (settingsWindow) {
		if (settingsWindow.isMinimized()) settingsWindow.restore();
		settingsWindow.show();
		settingsWindow.focus();
		return;
	}

	settingsWindow = new BrowserWindow({
		width: 920,
		height: 680,
		minWidth: 820,
		minHeight: 600,
		title: "RippleClick Settings",
		frame: false,
		transparent: true,
		resizable: true,
		maximizable: false,
		alwaysOnTop: false,
		autoHideMenuBar: true,
		backgroundColor: "#00000000",
		icon: iconPath,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	settingsWindow.loadFile(settingsHtml);
	settingsWindow.on("close", (event) => {
		if (!app.isQuitting) {
			event.preventDefault();
			settingsWindow.hide();
		}
	});
	settingsWindow.on("closed", () => {
		settingsWindow = null;
	});
}

function applyControlWindowOptions() {
	if (!controlWindow || controlWindow.isDestroyed()) return;
	controlWindow.setAlwaysOnTop(
		Boolean(settings.controlAlwaysOnTop),
		"screen-saver",
	);
	if (settings.controlAlwaysOnTop) {
		controlWindow.moveTop();
	}
}

function applyOverlayWindowOptions(win) {
	if (!win || win.isDestroyed()) return;
	win.setIgnoreMouseEvents(true);
	win.setAlwaysOnTop(true, "screen-saver");
	win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	win.moveTop();
}

function getUsableControlBounds() {
	if (!controlBounds) return null;
	const displays = screen.getAllDisplays();
	const insideDisplay = displays.some(({ workArea }) => {
		return (
			controlBounds.x >= workArea.x - 20 &&
			controlBounds.y >= workArea.y - 20 &&
			controlBounds.x <= workArea.x + workArea.width - 80 &&
			controlBounds.y <= workArea.y + workArea.height - 80
		);
	});
	return insideDisplay ? controlBounds : null;
}

function saveControlBounds() {
	if (!controlWindow || controlWindow.isDestroyed()) return;
	controlBounds = controlWindow.getBounds();
	saveState();
}

function isPointInsideControlWindow(point) {
	if (
		!controlWindow ||
		controlWindow.isDestroyed() ||
		!controlWindow.isVisible()
	) {
		return false;
	}

	const bounds = controlWindow.getBounds();
	return (
		point.x >= bounds.x &&
		point.x <= bounds.x + bounds.width &&
		point.y >= bounds.y &&
		point.y <= bounds.y + bounds.height
	);
}

function toggleControlWindow() {
	if (!controlWindow || controlWindow.isDestroyed()) {
		showControlWindow();
		return;
	}

	if (controlWindow.isVisible() && !controlWindow.isMinimized()) {
		if (Date.now() < ignoreControlToggleUntil) {
			if (settings.controlAlwaysOnTop) controlWindow.moveTop();
			return;
		}
		controlWindow.hide();
		return;
	}

	showControlWindow();
}

function createOverlay(display) {
	const id = display.id;
	const existing = overlays.get(id);
	if (existing && !existing.isDestroyed()) return existing;

	const win = new BrowserWindow({
		x: display.bounds.x,
		y: display.bounds.y,
		width: display.bounds.width,
		height: display.bounds.height,
		frame: false,
		transparent: true,
		fullscreenable: false,
		resizable: false,
		movable: false,
		focusable: false,
		skipTaskbar: true,
		hasShadow: false,
		alwaysOnTop: true,
		backgroundColor: "#00000000",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});

	applyOverlayWindowOptions(win);
	win.loadFile(overlayHtml);
	win.once("ready-to-show", () => {
		win.showInactive();
		applyOverlayWindowOptions(win);
		win.webContents.send("state", getStatePayload());
	});
	win.on("closed", () => overlays.delete(id));

	overlays.set(id, win);
	return win;
}

function syncOverlays() {
	const displays = screen.getAllDisplays();
	const liveIds = new Set(displays.map((display) => display.id));

	for (const display of displays) {
		const win = createOverlay(display);
		win.setBounds(display.bounds);
		applyOverlayWindowOptions(win);
	}

	for (const [id, win] of overlays) {
		if (!liveIds.has(id)) {
			win.close();
			overlays.delete(id);
		}
	}
}

function broadcastState() {
	const payload = getStatePayload();
	for (const win of overlays.values()) {
		if (!win.isDestroyed()) win.webContents.send("state", payload);
	}
	if (controlWindow && !controlWindow.isDestroyed()) {
		controlWindow.webContents.send("state", payload);
	}
	if (settingsWindow && !settingsWindow.isDestroyed()) {
		settingsWindow.webContents.send("state", payload);
	}
}

function getStatePayload() {
	return {
		enabled,
		settings,
		platform: {
			supported: platformSupported,
			name: process.platform,
			message: platformSupported
				? "Global click highlighting is active on Windows."
				: "Global click highlighting needs a native mouse hook for this OS. The overlay UI can run, but real click detection is Windows-only in this version.",
		},
		launchAtStartup: getLaunchAtStartup(),
	};
}

function getLaunchAtStartup() {
	if (!platformSupported) return false;
	return app.getLoginItemSettings().openAtLogin;
}

function setLaunchAtStartup(value) {
	if (!platformSupported) return;
	app.setLoginItemSettings({
		openAtLogin: Boolean(value),
		path: process.execPath,
	});
	broadcastState();
}

function loadSavedState() {
	settingsPath = path.join(app.getPath("userData"), "settings.json");
	try {
		const saved = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
		enabled = typeof saved.enabled === "boolean" ? saved.enabled : enabled;
		settings = { ...defaultSettings, ...(saved.settings || {}) };
		controlBounds = saved.controlBounds || null;
	} catch {
		settings = { ...defaultSettings };
	}
}

function saveState() {
	if (!settingsPath) return;
	fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
	fs.writeFileSync(
		settingsPath,
		JSON.stringify({ enabled, settings, controlBounds }, null, 2),
	);
}

function shouldHighlight(button) {
	if (button === "right") return settings.highlightRight;
	if (button === "middle") return settings.highlightMiddle;
	return settings.highlightLeft;
}

function emitClick(click) {
	if (!enabled || !shouldHighlight(click.button)) return;

	const point = click.test
		? click
		: screen.screenToDipPoint({ x: Number(click.x), y: Number(click.y) });
	if (!click.test && isPointInsideControlWindow(point)) {
		if (settings.controlAlwaysOnTop) controlWindow.moveTop();
		return;
	}

	for (const [displayId, win] of overlays) {
		if (win.isDestroyed()) continue;
		const display = screen
			.getAllDisplays()
			.find((item) => item.id === displayId);
		if (!display) continue;

		const { x, y, width, height } = display.bounds;
		const inside =
			point.x >= x &&
			point.x <= x + width &&
			point.y >= y &&
			point.y <= y + height;
		if (inside || click.test) {
			applyOverlayWindowOptions(win);
			win.webContents.send("click", {
				button: click.button || "left",
				x: click.test ? point.x : point.x - x,
				y: click.test ? point.y : point.y - y,
				settings,
			});
		}
	}
}

function emitShortcut(shortcut) {
	if (!enabled || !settings.showKeystrokes || !shortcut.keys) return;

	const payload = {
		keys: shortcut.keys,
		duration: settings.keystrokeDuration,
	};

	for (const win of overlays.values()) {
		if (!win.isDestroyed()) win.webContents.send("shortcut", payload);
	}
}

function startMouseHook() {
	if (hookProcess) return;

	hookProcess = spawn(
		"powershell.exe",
		["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", hookScript],
		{
			windowsHide: true,
			stdio: ["ignore", "pipe", "pipe"],
		},
	);

	let buffer = "";
	hookProcess.stdout.on("data", (chunk) => {
		buffer += chunk.toString();
		const lines = buffer.split(/\r?\n/);
		buffer = lines.pop() || "";
		for (const line of lines) {
			if (!line.trim()) continue;
			try {
				const event = JSON.parse(line);
				if (event.type === "click") emitClick(event);
				if (event.type === "shortcut") emitShortcut(event);
			} catch {
				// Ignore malformed helper output.
			}
		}
	});

	hookProcess.stderr.on("data", (chunk) => {
		console.error(`mouse hook error: ${chunk.toString().trim()}`);
	});

	hookProcess.on("error", (error) => {
		console.error("mouse hook failed to start:", error);
	});

	hookProcess.on("exit", (code, signal) => {
		if (!app.isQuitting) {
			console.error(
				`mouse hook exited; restarting. code=${code} signal=${signal}`,
			);
		}
		hookProcess = null;
		if (!app.isQuitting) setTimeout(startMouseHook, 1200);
	});
}

app.whenReady().then(() => {
	if (platformSupported) app.setAppUserModelId("com.rippleclick.app");
	loadSavedState();

	tray = new Tray(createTrayIcon());
	tray.setToolTip("RippleClick");
	tray.on("click", toggleControlWindow);
	updateTrayMenu();

	syncOverlays();
	showControlWindow();
	if (platformSupported) startMouseHook();

	screen.on("display-added", syncOverlays);
	screen.on("display-removed", syncOverlays);
	screen.on("display-metrics-changed", syncOverlays);

	globalShortcut.register("Control+Alt+H", () => {
		enabled = !enabled;
		saveState();
		broadcastState();
		updateTrayMenu();
	});
	globalShortcut.register("Control+Alt+C", toggleControlWindow);
});

ipcMain.handle("get-state", () => getStatePayload());
ipcMain.on("set-enabled", (_event, value) => {
	enabled = Boolean(value);
	saveState();
	broadcastState();
	updateTrayMenu();
});
ipcMain.on("set-launch-at-startup", (_event, value) => {
	setLaunchAtStartup(value);
});
ipcMain.on("control-interaction", () => {
	ignoreControlToggleUntil = Date.now() + 500;
	if (
		controlWindow &&
		!controlWindow.isDestroyed() &&
		controlWindow.isVisible()
	) {
		if (settings.controlAlwaysOnTop) controlWindow.moveTop();
	}
});
ipcMain.on("set-settings", (_event, value) => {
	settings = { ...settings, ...value };
	saveState();
	applyControlWindowOptions();
	broadcastState();
});
ipcMain.on("reset-settings", () => {
	settings = { ...defaultSettings };
	saveState();
	applyControlWindowOptions();
	broadcastState();
});
ipcMain.on("open-settings", showSettingsWindow);
ipcMain.on("close-settings", () => {
	if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.hide();
});
ipcMain.on("test-click", () =>
	emitClick({ button: "left", x: 180, y: 180, test: true }),
);
ipcMain.on("window-control", (_event, action) => {
	if (!controlWindow || controlWindow.isDestroyed()) return;
	if (action === "minimize") controlWindow.minimize();
	if (action === "close") controlWindow.hide();
});

app.on("before-quit", () => {
	app.isQuitting = true;
	if (hookProcess) hookProcess.kill();
	globalShortcut.unregisterAll();
});

app.on("window-all-closed", (event) => {
	event.preventDefault();
});
