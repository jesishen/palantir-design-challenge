const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

const MINI_W = 320;
let win, miniBounds, mode = "mini";

function createWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: MINI_W, height: 260,
    x: width - MINI_W - 24, y: 24,           // starts top-right; drag it anywhere
    frame: false, transparent: true, resizable: false, hasShadow: true,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile("index.html");
  // or load your deployed site: win.loadURL("https://your-app.vercel.app");
}

// Big (break) vs small (work) window
ipcMain.on("overlay:mode", (_e, next) => {
  if (!win || next === mode) return;
  mode = next;
  if (mode === "break") {
    miniBounds = win.getBounds();
    const display = screen.getDisplayMatching(miniBounds);
    win.setBounds(display.bounds);             // covers the screen, so you can't click underneath
    win.setAlwaysOnTop(true, "screen-saver");
    win.setMovable(false);
    win.focus();
  } else {
    win.setMovable(true);
    win.setAlwaysOnTop(true, "floating");
    if (miniBounds) win.setBounds(miniBounds); // back to where you'd dragged it
  }
});

// Fit the small window to its content
ipcMain.on("overlay:resize", (_e, w, h) => {
  if (!win || mode !== "mini") return;
  win.setResizable(true);
  win.setContentSize(Math.ceil(w), Math.ceil(h));
  win.setResizable(false);
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
