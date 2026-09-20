const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("magicWindow", {
  moveBy: (deltaX, deltaY) => ipcRenderer.send("magic-window-move", deltaX, deltaY),
  setOverlayMode: (overlayMode) => ipcRenderer.send("magic-window-layout", overlayMode),
  close: () => ipcRenderer.send("magic-window-close"),
});

contextBridge.exposeInMainWorld("magicDesktop", {
  setPermission: (level) => ipcRenderer.send("desktop-control-permission", level),
  execute: (action, params) => ipcRenderer.invoke("desktop-control-action", action, params),
  captureScreen: () => ipcRenderer.invoke("desktop-capture-screen"),
  emergencyStop: () => ipcRenderer.send("desktop-control-kill"),
});

contextBridge.exposeInMainWorld("magicVoice", {
  start: () => ipcRenderer.invoke("magic-voice-start"),
  stop: () => ipcRenderer.send("magic-voice-stop"),
  onTranscript: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("magic-voice-transcript", listener);
    return () => ipcRenderer.removeListener("magic-voice-transcript", listener);
  },
  onError: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on("magic-voice-error", listener);
    return () => ipcRenderer.removeListener("magic-voice-error", listener);
  },
});
