const env = Object.assign(process.env, require("./env"), require("./config"));
const { app, BrowserWindow, Menu, globalShortcut } = require("electron");
const fs = require("fs");
const path = require("path");
const assets = path.join(__dirname, env.ASSET_FOLDER);
const cache = path.join(__dirname, env.CACHÉ_FOLDER);
const saved = path.join(__dirname, env.SAVED_FOLDER);

if (!fs.existsSync(assets)) fs.mkdirSync(assets);
if (!fs.existsSync(cache)) fs.mkdirSync(cache);
if (!fs.existsSync(saved)) fs.mkdirSync(saved);
const discord = require("./utils/discord");
const server = require("./wrapper/server");
server();

let pluginName;
switch (process.platform) {
	case "win32": {
		pluginName = "./extensions/pepflashplayer.dll";
		break;
	} case "darwin": {
		pluginName = "./extensions/PepperFlashPlayer.plugin";
		break;
	} case "linux": {
		pluginName = "./extensions/libpepflashplayer.so"
		app.commandLine.appendSwitch("no-sandbox");
		break;
	}
}
app.commandLine.appendSwitch("ppapi-flash-path", path.join(__dirname, pluginName));
app.commandLine.appendSwitch("ppapi-flash-version", "34.0.0.137");

let mainWindow;
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		show: false,
		title: "Wrapper offline",
		icon: path.join(__dirname, "./server/favicon.ico"),
		webPreferences: {
			plugins: true,
			contextIsolation: true
		}
	});
	mainWindow.maximize();
	mainWindow.show();

	process.env.MAIN_WINDOW_ID = mainWindow.id;
	Menu.setApplicationMenu(Menu.buildFromTemplate([]));
	mainWindow.loadURL("http://localhost:4343");
	mainWindow.on("closed", () => mainWindow = null);

	globalShortcut.register("CommandOrControl+Shift+I", () => {
		const window = BrowserWindow.fromId(+process.env.MAIN_WINDOW_ID);
		if (window.webContents.isDevToolsOpened()) {
			window.webContents.closeDevTools();
		} else {
			window.webContents.openDevTools();
		}
	});
	globalShortcut.register("CommandOrControl+-", () => {
		const window = BrowserWindow.fromId(+process.env.MAIN_WINDOW_ID);
		const zoom = window.webContents.getZoomFactor();
		if (zoom - 0.2 > 0.1) {
			window.webContents.setZoomFactor(zoom - 0.2);
		}
	});
	globalShortcut.register("CommandOrControl+=", () => {
		const window = BrowserWindow.fromId(+process.env.MAIN_WINDOW_ID);
		const zoom = window.webContents.getZoomFactor();
		window.webContents.setZoomFactor(zoom + 0.2);
	});

	if (env.NODE_ENV == "development") {
		mainWindow.webContents.openDevTools();
	}
};

app.whenReady().then(() => {
	setTimeout(createWindow, 2000);
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
	if (mainWindow === null) createWindow();
});