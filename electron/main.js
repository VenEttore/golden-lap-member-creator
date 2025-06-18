const { app, BrowserWindow, Menu, protocol, net, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');

// Custom protocol scheme
const PROTOCOL_SCHEME = 'app';
const APP_URL = `${PROTOCOL_SCHEME}://localhost`;

// Keep a global reference of the window object
let mainWindow;
let isDev = process.env.NODE_ENV === 'development';

// OPTIMIZATION: Improve app startup performance
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');

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
      preload: path.join(__dirname, 'preload.js'), // Preload script for secure IPC
      // OPTIMIZATION: Better rendering performance
      offscreen: false,
      paintWhenInitiallyHidden: false,
      backgroundThrottling: false
    },
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // OPTIMIZATION: Set up memory management
  mainWindow.webContents.on('dom-ready', () => {
    // Optimize memory usage for large datasets
    mainWindow.webContents.executeJavaScript(`
      // Hint to V8 about memory pressure for large operations
      if (window.gc) { window.gc(); }
    `);
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
    
    // OPTIMIZATION: Focus window and bring to front
    mainWindow.focus();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // FIX: Handle focus management to prevent input field issues
  mainWindow.on('focus', () => {
    // Ensure proper focus delegation to the renderer
    mainWindow.webContents.focus();
  });

  // FIX: Handle window blur/focus events for proper input handling
  mainWindow.on('blur', () => {
    // When window loses focus, prepare for proper refocus
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          // Clear any existing focus issues
          if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
          // Force a focus refresh by briefly focusing the body
          if (document.body) {
            document.body.focus();
          }
        `).catch(() => {
          // Ignore errors if window is destroyed
        });
      }
    }, 50);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: Prevent new window creation
  mainWindow.webContents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
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
      
      // Check if we're in a packaged app (app.isPackaged) or development
      const outDir = app.isPackaged 
        ? path.join(appPath, 'out')  // In packaged app: resources/app/out
        : path.join(appPath, 'out'); // In development: ./out
      
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

// OPTIMIZATION: Set up IPC handlers for potential file operations
function setupIPCHandlers() {
  // Handler for optimized file operations (if needed in future)
  ipcMain.handle('optimize-export', async (event, data) => {
    // Placeholder for future native file operations
    return { success: true };
  });
  
  // Handler for memory cleanup
  ipcMain.handle('cleanup-memory', async () => {
    if (global.gc) {
      global.gc();
    }
    return { success: true };
  });

  // FIX: Handler for focus restoration
  ipcMain.handle('restore-focus', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus();
      mainWindow.webContents.focus();
      return { success: true };
    }
    return { success: false };
  });
}

// App event handlers
app.whenReady().then(() => {
  if (!isDev) {
    setupProtocolHandler();
  }
  setupIPCHandlers();
  createWindow();

  // OPTIMIZATION: Set application priority
  if (process.platform === 'win32') {
    app.commandLine.appendSwitch('--high-dpi-support', '1');
  }
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