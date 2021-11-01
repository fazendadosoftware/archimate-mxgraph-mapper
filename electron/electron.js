const path = require('path');
const { app, BrowserWindow, Menu, dialog } = require('electron');
const pkg = require('../package.json')
const { name, version } = pkg

const isDev = process.env.IS_DEV == "true" ? true : false;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity: false
    },
  })

  // and load the index.html of the app.
  // win.loadFile("index.html");
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );
  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

const template = [
  {
    role: 'help',
    submenu: [
      {
        label: 'Toggle Developer Tools',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
      },
      {
        label: 'About',
        click (item, focusedWindow) {
          if (focusedWindow) {
            const options = {
              type: 'info',
              title: 'About',
              // detail: 'detaalhes',
              buttons: ['ok'],
              message: `${name} v${version}`
            }
            dialog.showMessageBox(focusedWindow, options, function () {})
          }
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});