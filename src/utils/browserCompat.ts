// Browser compatibility utilities for SSR and Electron environments

export const isBrowser = typeof window !== 'undefined';
export const isElectron = isBrowser && typeof (window as unknown as { electronAPI?: unknown })?.electronAPI !== 'undefined';

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

// Safe document operations  
export const safeDocument = {
  createElement: <K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] | null => {
    if (!isBrowser) return null;
    return document.createElement(tagName);
  },
  
  getElementById: (id: string): HTMLElement | null => {
    if (!isBrowser) return null;
    return document.getElementById(id);
  },
  
  addEventListener: (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): void => {
    if (!isBrowser) return;
    document.addEventListener(type, listener, options);
  },
  
  removeEventListener: (type: string, listener: EventListener, options?: boolean | EventListenerOptions): void => {
    if (!isBrowser) return;
    document.removeEventListener(type, listener, options);
  },
  
  getBody: (): HTMLElement | null => {
    if (!isBrowser) return null;
    return document.body;
  }
};

// Safe file download helper
export function safeDownloadFile(blob: Blob, filename: string): void {
  if (!isBrowser) {
    console.warn('File download not available in server environment');
    return;
  }
  
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