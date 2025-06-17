const { app, BrowserWindow, Menu, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');

// Custom protocol scheme
const PROTOCOL_SCHEME = 'app';
const APP_URL = `${PROTOCOL_SCHEME}://localhost`;

// Keep a global reference of the window object
let mainWindow;
let isDev = process.env.NODE_ENV === 'development';

// Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

// Register the custom protocol as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: PROTOCOL_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false, // Security: disable node integration
      contextIsolation: true, // Security: enable context isolation
      enableRemoteModule: false, // Security: disable remote module
      webSecurity: true, // Security: enable web security
      preload: path.join(__dirname, 'preload.js') // Preload script for secure IPC
    },
    icon: path.join(__dirname, '..', 'public', 'assets', 'GLLogo_New.png'),
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Load the Next.js app
  if (isDev) {
    // Development: load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    console.log('Loading development app from: http://localhost:3000');
  } else {
    // Production: load from custom protocol
    mainWindow.loadURL(`${APP_URL}/`);
    console.log(`Loading production app from: ${APP_URL}/`);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: Prevent new window creation
  mainWindow.webContents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
}

function setupProtocolHandler() {
  // Handle the custom app:// protocol
  protocol.handle(PROTOCOL_SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      
      // Remove the app:// scheme and get the file path
      let filePath = url.pathname;
      
      // Handle root path
      if (filePath === '/') {
        filePath = '/index.html';
      }
      
      // Handle directory requests (e.g., /modpacks/ -> /modpacks/index.html)
      if (filePath.endsWith('/')) {
        filePath = filePath + 'index.html';
      }
      
      // Resolve the file path relative to the out directory
      const appPath = app.getAppPath();
      const outDir = path.join(appPath, 'out');
      const resolvedPath = path.join(outDir, filePath);
      
      // Security check: ensure the resolved path is within the out directory
      const relativePath = path.relative(outDir, resolvedPath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        console.error('Security error: Path outside app directory:', filePath);
        return new Response('Forbidden', { status: 403 });
      }
      
      // Convert to file URL and fetch
      const fileUrl = pathToFileURL(resolvedPath).href;
      console.log(`Protocol handler: ${request.url} -> ${fileUrl}`);
      
      return net.fetch(fileUrl);
    } catch (error) {
      console.error('Protocol handler error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  });
}

// App event handlers
app.whenReady().then(() => {
  if (!isDev) {
    setupProtocolHandler();
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app events
app.on('before-quit', () => {
  console.log('App is quitting...');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
}); 