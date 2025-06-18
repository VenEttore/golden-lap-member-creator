// Browser compatibility utilities for SSR and Electron environments

// Electron API type definitions
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  showSaveDialog: (options: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<{ canceled: boolean; filePath?: string }>;
  showOpenDialog: (options: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: string[];
  }) => Promise<{ canceled: boolean; filePaths?: string[] }>;
  onMenuNewMember: (callback: () => void) => void;
  onMenuExportMembers: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
  platform: string;
  isElectron: boolean;
  // Performance utilities
  performance?: {
    now: () => number;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Internal utilities (not exported to reduce API surface)
const isBrowser = typeof window !== 'undefined';
const isElectron = isBrowser && !!window.electronAPI;

// Safe window operations
export const safeWindow = {
  confirm: (message: string): boolean => {
    if (!isBrowser) return false;
    return window.confirm(message);
  },
  
  reload: (): void => {
    if (!isBrowser) return;
    window.location.reload();
  },
  
  getInnerWidth: (): number => {
    if (!isBrowser) return 1024; // Default fallback
    return window.innerWidth;
  },
  
  getInnerHeight: (): number => {
    if (!isBrowser) return 768; // Default fallback
    return window.innerHeight;
  },
  
  getScrollX: (): number => {
    if (!isBrowser) return 0;
    return window.scrollX;
  },
  
  getScrollY: (): number => {
    if (!isBrowser) return 0;
    return window.scrollY;
  }
};

// Enhanced file download helper with Electron support
export async function safeDownloadFile(blob: Blob, filename: string): Promise<void> {
  if (!isBrowser) {
    console.warn('File download not available in server environment');
    return;
  }
  
  // Use native save dialog in Electron
  if (isElectron && window.electronAPI) {
    try {
      const result = await window.electronAPI.showSaveDialog({
        defaultPath: filename,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled && result.filePath) {
        // In a real implementation, you'd send the blob data to the main process
        // For now, fall back to standard download
        console.log('Electron save dialog would save to:', result.filePath);
      }
    } catch (error) {
      console.warn('Electron save dialog failed, falling back to standard download:', error);
    }
  }
  
  // Standard browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Safe image loading
export function createSafeImage(): HTMLImageElement | null {
  if (!isBrowser) return null;
  return new window.Image();
}

// Safe canvas creation
export function createSafeCanvas(): HTMLCanvasElement | null {
  if (!isBrowser) return null;
  return document.createElement('canvas');
} 