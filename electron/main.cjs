const {app, BrowserWindow, ipcMain, screen, desktopCapturer, session, globalShortcut, shell} = require("electron");
const {execFile, spawn} = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

app.commandLine.appendSwitch("enable-speech-input");
app.commandLine.appendSwitch("enable-features", "WebSpeechAPI");

const port = Number(process.env.MAGIC_PORT || 3210);
let desktopPermission = "none";
let desktopKilled = false;
let speechProcess = null;
let speechWindow = null;

function stopWindowsSpeech() {
  if (speechProcess) {
    speechProcess.kill();
    speechProcess = null;
  }
}

function startWindowsSpeech(window) {
  stopWindowsSpeech();
  speechWindow = window;

  const script = `
Add-Type -AssemblyName System.Speech
$engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$engine.SetInputToDefaultAudioDevice()
$engine.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
Register-ObjectEvent -InputObject $engine -EventName SpeechRecognized -Action {
  $result = $EventArgs.Result
  [Console]::WriteLine(("TRANSCRIPT|" + $result.Text + "|" + $result.Confidence.ToString([Globalization.CultureInfo]::InvariantCulture)))
  [Console]::Out.Flush()
} | Out-Null
$engine.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
while ($true) { Start-Sleep -Milliseconds 500 }
`;

  speechProcess = spawn("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script,
  ], { windowsHide: true });

  let output = "";
  speechProcess.stdout.on("data", (chunk) => {
    output += chunk.toString();
    const lines = output.split(/\r?\n/);
    output = lines.pop() || "";
    for (const line of lines) {
      const [kind, text, confidence] = line.split("|");
      if (kind === "TRANSCRIPT" && text && speechWindow && !speechWindow.isDestroyed()) {
        speechWindow.webContents.send("magic-voice-transcript", {
          text,
          confidence: Number(confidence) || 0.8,
        });
      }
    }
  });

  speechProcess.stderr.on("data", (chunk) => {
    const message = chunk.toString().trim();
    if (message && speechWindow && !speechWindow.isDestroyed()) {
      speechWindow.webContents.send("magic-voice-error", message);
    }
  });

  speechProcess.once("error", (error) => {
    if (speechWindow && !speechWindow.isDestroyed()) {
      speechWindow.webContents.send("magic-voice-error", error.message);
    }
    speechProcess = null;
  });

  speechProcess.once("exit", () => {
    speechProcess = null;
  });
}

function runPowerShell(script, args = []) {
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script, ...args], { windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message));
      else resolve(stdout.trim());
    });
  });
}

async function executeDesktopAction(action, params = {}) {
  if (desktopKilled || !["one_action", "one_session", "always"].includes(desktopPermission)) {
    throw new Error("Desktop control is not permitted.");
  }

  const x = Number(params.x);
  const y = Number(params.y);
  if (action === "LAUNCH_APP") {
    const aliases = {
      brave: ["brave.exe", `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`, `${process.env.ProgramFiles}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`, `${process.env["ProgramFiles(x86)"]}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`],
      edge: ["msedge.exe", `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`],
      chrome: ["chrome.exe", `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`],
      firefox: ["firefox.exe", `${process.env.ProgramFiles}\\Mozilla Firefox\\firefox.exe`, `${process.env["ProgramFiles(x86)"]}\\Mozilla Firefox\\firefox.exe`],
      notepad: ["notepad.exe"],
      calculator: ["calc.exe"],
      paint: ["mspaint.exe"],
      explorer: ["explorer.exe"],
      files: ["explorer.exe"],
      terminal: ["powershell.exe"],
      powershell: ["powershell.exe"],
      taskmgr: ["taskmgr.exe"],
    };
    const requested = String(params.app || "").trim().toLowerCase();
    const candidates = aliases[requested] || [String(params.app || "")];
    const target = candidates.find((candidate) => candidate && fs.existsSync(candidate)) || candidates.find((candidate) => /\.exe$/i.test(candidate));
    if (!target) throw new Error(`Could not find application: ${requested || "requested app"}.`);
    const child = spawn(target, [], { detached: true, stdio: "ignore", windowsHide: true });
    await new Promise((resolve, reject) => {
      child.once("error", (error) => reject(new Error(`Windows could not launch ${requested || target}: ${error.message}`)));
      child.once("spawn", resolve);
    });
    child.unref();
    if (desktopPermission === "one_action") desktopPermission = "none";
    return;
  }
  if (action === "OPEN_FILE") {
    const filePath = String(params.path || "").trim();
    if (!filePath) throw new Error("No file path was provided.");
    const errorMessage = await shell.openPath(path.resolve(filePath));
    if (errorMessage) throw new Error(`Could not open file: ${errorMessage}`);
    if (desktopPermission === "one_action") desktopPermission = "none";
    return;
  }
  if (action === "NAVIGATE_URL") {
    const url = String(params.url || "").trim();
    if (!/^https?:\/\//i.test(url)) throw new Error("Navigation requires an http or https URL.");
    const errorMessage = await shell.openExternal(url);
    if (errorMessage) throw new Error(`Could not open URL: ${errorMessage}`);
    if (desktopPermission === "one_action") desktopPermission = "none";
    return;
  }
  const script = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class MagicInput {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  [DllImport("user32.dll")] public static extern void keybd_event(byte key, byte scan, uint flags, UIntPtr extra);
  public const uint LEFTDOWN=0x02, LEFTUP=0x04, RIGHTDOWN=0x08, RIGHTUP=0x10, KEYUP=0x02;
}
'@
$action = $args[0]
switch ($action) {
  'MOVE_MOUSE' { [MagicInput]::SetCursorPos([int]$args[1], [int]$args[2]) }
  'CLICK' { [MagicInput]::SetCursorPos([int]$args[1], [int]$args[2]); [MagicInput]::mouse_event(2,0,0,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds 80; [MagicInput]::mouse_event(4,0,0,0,[UIntPtr]::Zero) }
  'RIGHT_CLICK' { [MagicInput]::SetCursorPos([int]$args[1], [int]$args[2]); [MagicInput]::mouse_event(8,0,0,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds 80; [MagicInput]::mouse_event(16,0,0,0,[UIntPtr]::Zero) }
  'TYPE_TEXT' { Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait($args[1]) }
  'KEY_PRESS' { Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait($args[1]) }
  'WAIT' { Start-Sleep -Milliseconds ([int]$args[1]) }
}`;

  const actionArgs = [action, String(Number.isFinite(x) ? x : 0), String(Number.isFinite(y) ? y : 0), String(params.text || params.key || params.app || params.ms || "")];
  const result = await runPowerShell(script, actionArgs);
  if (desktopPermission === "one_action") desktopPermission = "none";
  return result;
}

ipcMain.on("magic-window-move", (event, deltaX, deltaY) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || !Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;
  const [x, y] = window.getPosition();
  window.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
});

ipcMain.on("desktop-control-permission", (_event, level) => {
  if (["none", "one_action", "one_session", "always", "deny"].includes(level)) {
    desktopPermission = level;
    desktopKilled = level === "deny";
  }
});

ipcMain.handle("desktop-control-action", async (_event, action, params) => executeDesktopAction(action, params));
ipcMain.handle("desktop-capture-screen", async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const wasVisible = window && !window.isDestroyed() && window.isVisible();
  if (wasVisible) {
    window.hide();
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  try {
    const display = screen.getPrimaryDisplay();
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: display.size.width, height: display.size.height },
      fetchWindowIcons: false,
    });
    const source = sources.find((candidate) => candidate.display_id === String(display.id)) || sources[0];
    if (!source || source.thumbnail.isEmpty()) {
      throw new Error("Windows did not return a desktop screenshot.");
    }
    return `data:image/jpeg;base64,${source.thumbnail.toJPEG(60).toString("base64")}`;
  } finally {
    if (wasVisible && window && !window.isDestroyed()) window.show();
  }
});
ipcMain.handle("magic-voice-start", (event) => {
  startWindowsSpeech(BrowserWindow.fromWebContents(event.sender));
  return true;
});
ipcMain.on("magic-voice-stop", () => stopWindowsSpeech());
ipcMain.on("desktop-control-kill", () => {
  desktopKilled = true;
  desktopPermission = "none";
});

ipcMain.on("magic-window-close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.on("magic-window-layout", (event, overlayMode) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || typeof overlayMode !== "boolean") return;

  if (overlayMode) {
    const workArea = screen.getPrimaryDisplay().workArea;
    const width = 430;
    const height = 620;
    window.setMinimumSize(320, 420);
    window.setBounds({
      x: workArea.x + workArea.width - width - 18,
      y: workArea.y + workArea.height - height,
      width,
      height,
    });
  } else {
    window.setMinimumSize(960, 640);
    window.setBounds({
      x: Math.max(0, Math.round((screen.getPrimaryDisplay().workArea.width - 1440) / 2)),
      y: Math.max(0, Math.round((screen.getPrimaryDisplay().workArea.height - 900) / 2)),
      width: 1440,
      height: 900,
    });
  }
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

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media" || permission === "notifications");
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return permission === "media" || permission === "notifications";
  });

  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ["screen"] });
      const primarySource = sources.find((source) => source.display_id) || sources[0];
      callback(primarySource ? { video: primarySource } : {});
    } catch (error) {
      console.error("Unable to select a desktop capture source:", error);
      callback({});
    }
  });

  await waitForServer(`http://127.0.0.1:${port}/api/health`);

  globalShortcut.register("CommandOrControl+Alt+Escape", () => {
    desktopKilled = true;
    desktopPermission = "none";
  });

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
  stopWindowsSpeech();
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") app.quit();
});
