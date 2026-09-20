const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("magicWindow", {
  moveBy: (deltaX, deltaY) => ipcRenderer.send("magic-window-move", deltaX, deltaY),
  setOverlayMode: (overlayMode) => ipcRenderer.send("magic-window-layout", overlayMode),
  close: () => ipcRenderer.send("magic-window-close"),
});

contextBridge.exposeInMainWorld("magicDesktop", {
  setPermission: (level) => ipcRenderer.send("desktop-control-permission", level),
  execute: (action, params) => ipcRenderer.invoke("desktop-control-action", action, params),
  emergencyStop: () => ipcRenderer.send("desktop-control-kill"),
});
