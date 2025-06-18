// Utility for managing focus in Electron app
// Fixes input field focus issues in modals

export function isElectron(): boolean {
  // Check if we're running in Electron
  return !!(typeof window !== 'undefined' && window.electronAPI && window.electronAPI.isElectron);
}

export async function restoreElectronFocus(options: { force?: boolean; skipInputFocus?: boolean } = {}): Promise<void> {
  if (!isElectron()) return;
  
  try {
    // Call the Electron main process to restore focus
    if (window.electronAPI?.focus?.restore) {
      await window.electronAPI.focus.restore();
    }
    
    // Only do aggressive focus management if forced or no element is currently focused
    if (!options.force && document.activeElement && document.activeElement !== document.body) {
      // Something is already focused, don't interfere
      return;
    }
    
    // Additional client-side focus management
    setTimeout(() => {
      // Only clear focus if we're forcing or if nothing meaningful is focused
      if (options.force || !document.activeElement || document.activeElement === document.body) {
        
        // Only focus inputs if not explicitly skipped
        if (!options.skipInputFocus) {
          // Find the first input/textarea/select in any open modal
          const modals = document.querySelectorAll('[class*="fixed"][class*="inset-0"], [class*="modal"], [role="dialog"]');
          
          for (const modal of modals) {
            const firstInput = modal.querySelector('input, textarea, select') as HTMLElement;
            if (firstInput && firstInput.offsetParent !== null) {
              // Element is visible, try to focus it
              firstInput.focus();
              return;
            }
          }
        }
        
        // If no modal input found, just restore general focus
        if (document.body) {
          document.body.focus();
        }
      }
    }, 50);
    
  } catch (error) {
    console.warn('Failed to restore Electron focus:', error);
  }
}

let lastFocusTime = 0;
let isTabNavigating = false;

export function setupElectronFocusListeners(): void {
  if (!isElectron()) return;
  
  // Listen for modal opening events
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    
    // Check if this click might open a modal
    if (target.matches('button') && 
        (target.textContent?.includes('Batch') || 
         target.textContent?.includes('Generate') ||
         target.textContent?.includes('New Modpack'))) {
      
      // Wait for modal to render, then restore focus
      setTimeout(() => {
        restoreElectronFocus({ force: true });
      }, 200);
    }
  });
  
  // Listen for window focus events (but only when window actually gains focus)
  window.addEventListener('focus', () => {
    // Only restore focus if window was actually unfocused
    if (Date.now() - lastFocusTime > 1000) {
      restoreElectronFocus({ skipInputFocus: true });
    }
    lastFocusTime = Date.now();
  });
  
  // Track tab navigation
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      isTabNavigating = true;
      // Clear the flag after a short delay
      setTimeout(() => {
        isTabNavigating = false;
      }, 200);
    }
  });
  
    // Listen for focus events on input elements to detect when they can't receive input
  document.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement;
    
    // Only intervene if:
    // 1. It's an input/textarea/select
    // 2. We're not in the middle of tab navigation
    if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') && 
        !isTabNavigating) {
      
      // Check if this element is in a modal
      const isInModal = target.closest('[class*="fixed"][class*="inset-0"], [role="dialog"], [class*="modal"]');
      
             // Check if we're on the member creator page (which works fine and shouldn't be interfered with)
       const isOnMemberCreatorPage = window.location.pathname.includes('/members');
       
       // Intervene for:
       // 1. Modal inputs (always) - includes batch generation dialog
       // 2. Any page EXCEPT member creator page (which works fine)
       const shouldIntervene = isInModal || !isOnMemberCreatorPage;
      
      if (shouldIntervene) {
        // Small delay to check if the element can actually receive input
        setTimeout(() => {
          // Test if the element is truly focused and can receive input
          if (document.activeElement === target) {
            // Element is focused, but let's ensure it can receive input
            // We do this by just calling the main process focus without interfering with the DOM
            if (window.electronAPI?.focus?.restore) {
              window.electronAPI.focus.restore().catch(() => {
                // Ignore errors
              });
            }
          }
        }, 100);
      }
    }
  });
}

// Type declarations will be handled by existing ElectronAPI interface 