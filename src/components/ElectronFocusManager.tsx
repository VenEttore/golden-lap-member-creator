"use client";

import { useEffect } from 'react';
import { setupElectronFocusListeners, isElectron } from '../utils/electronFocus';

/**
 * Component to manage Electron focus issues
 * This component sets up event listeners to handle focus management
 * for input fields in modals when running in Electron
 */
export default function ElectronFocusManager() {
  useEffect(() => {
    // Only setup focus listeners if we're in Electron
    if (isElectron()) {
      setupElectronFocusListeners();
      
      // Setup very minimal initial focus restoration
      const handleInitialFocus = () => {
        // Only restore if nothing is focused at all
        setTimeout(() => {
          if (!document.activeElement || document.activeElement === document.body) {
            if (document.body) {
              document.body.focus();
            }
          }
        }, 100);
      };
      
      // Only setup on window focus, not immediately
      window.addEventListener('focus', handleInitialFocus);
      
      return () => {
        window.removeEventListener('focus', handleInitialFocus);
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
} 