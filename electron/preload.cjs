const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("magicWindow", {
  moveBy: (deltaX, deltaY) => ipcRenderer.send("magic-window-move", deltaX, deltaY),
  setOverlayMode: (overlayMode) => ipcRenderer.send("magic-window-layout", overlayMode),
});
