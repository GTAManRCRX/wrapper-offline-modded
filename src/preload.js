const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("appWindow", {
	goHome: () => ipcRenderer.send("go-home"),
	openDiscord: () => ipcRenderer.send("open-discord"),
	openFAQ: () => ipcRenderer.send("open-faq"),
	openGitHub: () => ipcRenderer.send("open-github"),
	openDataFolder: () => ipcRenderer.send("open-data-folder"),
});
