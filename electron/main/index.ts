import { app, BrowserWindow, ipcMain, nativeImage, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { FlaskManager } from "../src/flask-manager";

const isDev = !app.isPackaged;
const AUTH_URL = "https://gnovium.com";

const iconPath = path.join(__dirname, "../renderer/icon.png");

app.setName("Gnovium");

// (reload handled by chokidar in dev script)

// ─────────────────────────────────────────────
// Flask backend manager
// ─────────────────────────────────────────────

const backendDir = isDev
  ? path.resolve(__dirname, "../../..", "backend")
  : path.resolve(process.resourcesPath, "backend");

const flaskManager = new FlaskManager({
  backendDir,
  port: 5000,
  pythonPath: isDev ? "python" : undefined,
});

// ─────────────────────────────────────────────
// Auth token storage
// ─────────────────────────────────────────────

interface ElectronAuthData {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  };
}

function authFilePath(): string {
  return path.join(app.getPath("userData"), "auth.json");
}

function readAuthData(): ElectronAuthData | null {
  try {
    const raw = fs.readFileSync(authFilePath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeAuthData(data: ElectronAuthData): void {
  fs.writeFileSync(authFilePath(), JSON.stringify(data, null, 2), "utf-8");
}

function clearAuthData(): void {
  try {
    fs.unlinkSync(authFilePath());
  } catch {
    // file didn't exist — that's fine
  }
}

// ─────────────────────────────────────────────
// Profile storage (local overrides)
// ─────────────────────────────────────────────

interface ProfileData {
  name: string;
  avatar_path: string | null;
  previous_avatars: string[];
}

function profileFilePath(): string {
  return path.join(app.getPath("userData"), "profile.json");
}

function readProfileData(): ProfileData | null {
  try {
    const raw = fs.readFileSync(profileFilePath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeProfileData(data: ProfileData): void {
  const dir = path.dirname(profileFilePath());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(profileFilePath(), JSON.stringify(data, null, 2), "utf-8");
}

function ensureAvatarDir(): string {
  const dir = path.join(app.getPath("userData"), "avatars");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ─────────────────────────────────────────────
// Windows
// ─────────────────────────────────────────────

let loadingWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;

/** Show the loading/splash screen while Flask starts up. */
function createLoadingWindow(): void {
  const { height: screenH } = require("electron").screen.getPrimaryDisplay().workAreaSize;

  loadingWindow = new BrowserWindow({
    width: 900,
    height: screenH,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    movable: true,
    frame: false,
    backgroundColor: "#000000",
    titleBarStyle: "hidden",
    show: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  loadingWindow.once("ready-to-show", () => {
    loadingWindow?.show();
  });

  const loadingPath = path.join(__dirname, "../renderer/loading.html");
  loadingWindow.loadFile(loadingPath);
}

/** Open a browser window to the web sign-in page for Electron auth. */
function createAuthWindow(): Promise<ElectronAuthData> {
  return new Promise((resolve, reject) => {
    const { height: screenH } = require("electron").screen.getPrimaryDisplay().workAreaSize;

    authWindow = new BrowserWindow({
      width: 900,
      height: screenH,
      minWidth: 500,
      minHeight: 600,
      resizable: true,
      title: "Sign in to Gnovium",
      backgroundColor: "#09090b",
      show: false,
      icon: iconPath,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    authWindow.once("ready-to-show", () => {
      authWindow?.show();
      if (loadingWindow && !loadingWindow.isDestroyed()) {
        loadingWindow.close();
        loadingWindow = null;
      }
    });

    authWindow.on("closed", () => {
      authWindow = null;
    });

    // Intercept navigation to auth callback URL
    authWindow.webContents.on("did-finish-load", () => {
      const url = authWindow?.webContents.getURL();
      if (!url?.includes("/auth/electron/callback")) return;

      const parsed = new URL(url);
      const queryAuth = parsed.searchParams.get("auth");
      if (queryAuth) {
        finishAuth(queryAuth);
        return;
      }

      authWindow?.webContents
        .executeJavaScript("window.location.hash")
        .then((hash: string) => {
          const authParam = hash.replace("#auth=", "");
          if (authParam) {
            finishAuth(decodeURIComponent(authParam));
          } else {
            reject(new Error("Auth callback URL missing auth data"));
          }
        })
        .catch(reject);
    });

    function finishAuth(raw: string): void {
      try {
        const authData: ElectronAuthData = JSON.parse(raw);
        writeAuthData(authData);
        authWindow?.close();
        resolve(authData);
      } catch (err) {
        reject(
          err instanceof Error
            ? err
            : new Error("Failed to parse auth data")
        );
      }
    }

    const signinUrl = `${AUTH_URL}/signin?mode=electron`;
    authWindow.loadURL(signinUrl);
  });
}

/** Create the main application window. */
function createMainWindow(): void {
  const { width: screenW, height: screenH } = require("electron").screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: screenH,
    minWidth: 900,
    minHeight: 500,
    resizable: true,
    title: "Gnovium",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#09090b",
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Center horizontally
  mainWindow.setPosition(Math.round((screenW - 1200) / 2), 0);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
      loadingWindow = null;
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const uiPath = path.join(__dirname, "../renderer/index.html");
  mainWindow.loadFile(uiPath);
}

// ─────────────────────────────────────────────
// Loading progress helpers
// ─────────────────────────────────────────────

function sendLoadingProgress(percent: number, status: string): void {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send("loading-progress", { percent, status });
  }
}

function sendLoadingComplete(): void {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send("loading-complete");
  }
}

function sendLoadingError(message: string): void {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send("loading-error", message);
  }
}

// ─────────────────────────────────────────────
// IPC handlers
// ─────────────────────────────────────────────

ipcMain.handle("getApiPort", () => {
  return flaskManager.getPort();
});

ipcMain.handle("getAppVersion", () => {
  return app.getVersion();
});

ipcMain.handle("isLocalMode", () => {
  return true;
});

ipcMain.handle("isFlaskReady", () => {
  return flaskManager.isReady();
});

ipcMain.handle("getAuthData", () => {
  return readAuthData();
});

ipcMain.handle("isAuthenticated", () => {
  return readAuthData() !== null;
});

ipcMain.handle("logout", () => {
  clearAuthData();
});

ipcMain.handle("getProfileData", () => {
  return readProfileData();
});

ipcMain.handle("saveProfile", (_event, data: { name?: string; avatarPath?: string | null }) => {
  const existing = readProfileData() || { name: "", avatar_path: null, previous_avatars: [] };
  const profile: ProfileData = {
    name: data.name !== undefined ? data.name : existing.name,
    avatar_path: data.avatarPath !== undefined ? data.avatarPath : existing.avatar_path,
    previous_avatars: existing.previous_avatars,
  };
  if (existing.avatar_path && data.avatarPath && existing.avatar_path !== data.avatarPath) {
    profile.previous_avatars.push(existing.avatar_path);
  }
  writeProfileData(profile);

  // Also update auth.json user fields if available
  try {
    const auth = readAuthData();
    if (auth) {
      auth.user = {
        ...auth.user,
        name: profile.name || auth.user.name,
        avatar_url: profile.avatar_path || auth.user.avatar_url,
      };
      writeAuthData(auth);
    }
  } catch { /* ok */ }

  return profile;
});

ipcMain.handle("selectAvatarFile", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp"] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle("copyToAvatarDir", (_event, sourcePath: string) => {
  const avatarDir = ensureAvatarDir();
  const name = `${Date.now()}_${path.basename(sourcePath)}`;
  const dest = path.join(avatarDir, name);
  fs.copyFileSync(sourcePath, dest);
  return dest;
});

ipcMain.handle("selectImageFile", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle("copyFileToDir", (_event, sourcePath: string, dirName: string) => {
  const baseDir = path.join(app.getPath("userData"), dirName);
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  const name = `${Date.now()}_${path.basename(sourcePath)}`;
  const dest = path.join(baseDir, name);
  fs.copyFileSync(sourcePath, dest);
  return dest;
});

ipcMain.handle("reauthenticate", async () => {
  try {
    return await createAuthWindow();
  } catch {
    return null;
  }
});

ipcMain.handle("getCloudApiUrl", () => {
  return "https://api.gnovium.com/api/v1";
});

// ─────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────

app.whenReady().then(async () => {
  if (process.platform === "darwin") {
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }

  // 1. Show loading screen immediately
  createLoadingWindow();

  // 2. Start Flask backend with progress updates
  try {
    sendLoadingProgress(20, "Starting backend engine…");

    flaskManager.onLog((line) => {
      if (line.includes("Running on") || line.includes("FLASK")) {
        sendLoadingProgress(80, "Backend is running");
      }
    });

    await flaskManager.start();

    sendLoadingProgress(100, "Ready");
    await new Promise((r) => setTimeout(r, 400));

    sendLoadingComplete();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start backend";
    console.error("[Gnovium] Startup error:", message);
    sendLoadingError(message);
    await new Promise((r) => setTimeout(r, 3000));
  }

  // 3. Check auth — if not authenticated, open web sign-in
  const existingAuth = readAuthData();
  if (!existingAuth) {
    try {
      sendLoadingProgress(50, "Authentication required");
      await createAuthWindow();
    } catch (err) {
      console.error("[Gnovium] Auth failed:", err);
    }
  }

  // 4. Create the main app window
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    await shutdown();
    app.quit();
  }
});

app.on("before-quit", async (event) => {
  if (flaskManager.isReady()) {
    event.preventDefault();
    await shutdown();
    app.quit();
  }
});

async function shutdown(): Promise<void> {
  console.log("[Gnovium] Shutting down…");
  try {
    await flaskManager.stop();
  } catch (err) {
    console.error("[Gnovium] Error stopping Flask:", err);
  }
}

// ─────────────────────────────────────────────
// Dev tools (only in dev mode)
// ─────────────────────────────────────────────

if (isDev) {
  try {
    const { installExtension, REACT_DEVELOPER_TOOLS } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name: string) => console.log(`[DevTools] Installed: ${name}`))
      .catch((err: unknown) => console.warn("[DevTools] Install failed:", err));
  } catch {
    // electron-devtools-installer not available — that's fine
  }
}
