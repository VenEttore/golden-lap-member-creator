'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/utils/db';
import { safeWindow } from '@/utils/browserCompat';

export default function NavSidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Close sidebar when clicking backdrop
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) setOpen(false);
  }

  // Handle navigation and close sidebar
  function handleNav(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function handleDeleteAllData() {
    if (safeWindow.confirm('Are you sure you want to delete ALL app data? This cannot be undone.')) {
      await db.delete();
      safeWindow.reload();
    }
  }

  return (
    <>
      {/* Floating Hamburger Button */}
      <button
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-[100] bg-[#fd655c] text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center text-3xl hover:bg-[#b92d2a] focus:bg-[#b92d2a] transition-colors outline-none border-none"
        style={{ fontFamily: 'Figtree, Inter, sans-serif', cursor: 'pointer' }}
      >
        {/* ☰ */}
        <span style={{ fontSize: 32, lineHeight: 1 }}>{String.fromCharCode(0x2630)}</span>
      </button>
      {/* Sidebar Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm flex"
          onClick={handleBackdropClick}
        >
          <nav
            className="bg-white shadow-2xl h-full w-72 max-w-[90vw] p-0 flex flex-col relative animate-slide-in-left"
            style={{ borderTopRightRadius: 18, borderBottomRightRadius: 18, fontFamily: 'Figtree, Inter, sans-serif' }}
          >
            {/* Close button */}
            <button
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-2xl text-[#b92d2a] bg-transparent border-none hover:text-[#fd655c] focus:text-[#fd655c] cursor-pointer"
              style={{ fontWeight: 700, fontSize: 28, lineHeight: 1 }}
            >
              ×
            </button>
            <div className="flex flex-col gap-2 mt-20 px-8 flex-1">
              <button onClick={() => handleNav('/')} className="text-lg font-bold text-[#b92d2a] hover:text-[#fd655c] py-3 px-4 rounded transition-colors text-left">Member Manager</button>
              <button onClick={() => handleNav('/members')} className="text-lg font-bold text-[#b92d2a] hover:text-[#fd655c] py-3 px-4 rounded transition-colors text-left">Member Creator</button>
              <button onClick={() => handleNav('/portraits')} className="text-lg font-bold text-[#b92d2a] hover:text-[#fd655c] py-3 px-4 rounded transition-colors text-left">Portrait Generator</button>
              <button onClick={() => handleNav('/modpacks')} className="text-lg font-bold text-[#b92d2a] hover:text-[#fd655c] py-3 px-4 rounded transition-colors text-left">Modpack Manager</button>
            </div>
            {/* Delete All Data button at the bottom */}
            <div className="px-8 pb-6 mt-auto">
              <button
                onClick={handleDeleteAllData}
                className="w-full py-3 px-4 rounded bg-[#b92d2a] text-white font-bold text-lg hover:bg-[#fd655c] transition-colors"
                style={{ marginTop: 32 }}
              >
                Delete All Data
              </button>
            </div>
          </nav>
          <style>{`
            @keyframes slide-in-left {
              from { transform: translateX(-100%); opacity: 0.5; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in-left {
              animation: slide-in-left 0.22s cubic-bezier(0.4,0,0.2,1);
            }
          `}</style>
        </div>
      )}
    </>
  );
} 