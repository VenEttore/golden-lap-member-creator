const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => process.versions.electron,
  platform: process.platform,
  
  // Check if running in Electron
  isElectron: true,
  
  // Performance utilities
  performance: {
    // Performance timing
    now: () => performance.now(),
  }
});

// Additional security: Remove any potential Node.js globals
delete window.require;
delete window.exports;
delete window.module; 