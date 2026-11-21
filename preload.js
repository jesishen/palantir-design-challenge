const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlay", {
  setMode: (mode) => ipcRenderer.send("overlay:mode", mode),
    resize: (width, height) => ipcRenderer.send("overlay:resize", width, height),
});
