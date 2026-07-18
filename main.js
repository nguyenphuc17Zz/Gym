const { app, BrowserWindow } = require('electron');
const path = require('path');

// Khởi động ngầm Backend Server (Express + MySQL)
require('./backend/server.js');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'fitdb_icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "FitAI Studio",
    autoHideMenuBar: true
  });

  win.setMenuBarVisibility(false);

  // Đợi Server Backend chạy xong mới load URL
  setTimeout(() => {
    win.loadURL('http://localhost:3001');
  }, 1500);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
