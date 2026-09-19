const {app, BrowserWindow, ipcMain} = require("electron");
const path = require("path");
const http = require("http");

const port = Number(process.env.MAGIC_PORT || 3210);

ipcMain.on("magic-window-move", (event, deltaX, deltaY) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || !Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
  const [x, y] = window.getPosition();
  window.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
});

function waitForServer(url, attempts = 80) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (attempts-- <= 0) {
          reject(new Error("Magic AI server did not start in time."));
          return;
        }
        setTimeout(check, 250);
      });
    };
    check();
  });
}

async function createWindow() {
  process.env.NODE_ENV = "production";
  process.env.MAGIC_APP_ROOT = app.getAppPath();
  process.env.PORT = String(port);
  require(path.join(app.getAppPath(), "dist", "server.cjs"));

  await waitForServer(`http://127.0.0.1:${port}/api/health`);

  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(app.getAppPath(), "electron", "preload.cjs"),
    },
  });

  await window.loadURL(`http://127.0.0.1:${port}/?desktop=1`);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error(error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
