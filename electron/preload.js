const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => process.versions.electron,
  platform: process.platform,
  
  // Check if running in Electron
  isElectron: true,
  
  // OPTIMIZATION: Performance monitoring
  performance: {
    // Memory usage information
    getMemoryUsage: () => process.memoryUsage(),
    
    // Trigger garbage collection if available
    cleanupMemory: () => ipcRenderer.invoke('cleanup-memory'),
    
    // Performance timing
    now: () => performance.now(),
  },
  
  // OPTIMIZATION: Future file operations (placeholder)
  fileOperations: {
    optimizeExport: (data) => ipcRenderer.invoke('optimize-export', data),
  },

  // FIX: Focus management for input field issues
  focus: {
    restore: () => ipcRenderer.invoke('restore-focus'),
  }
});

// OPTIMIZATION: Set up performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  let memoryCheckInterval;
  
  window.addEventListener('DOMContentLoaded', () => {
    // Monitor memory usage every 30 seconds in development
    memoryCheckInterval = setInterval(() => {
      const memory = process.memoryUsage();
      if (memory.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
        console.warn('High memory usage detected:', {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB'
        });
      }
    }, 30000);
  });
  
  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    if (memoryCheckInterval) {
      clearInterval(memoryCheckInterval);
    }
  });
}

// Additional security: Remove any potential Node.js globals
delete window.require;
delete window.exports;
delete window.module; 