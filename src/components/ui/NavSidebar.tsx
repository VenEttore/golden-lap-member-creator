'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/utils/db';
import { safeWindow } from '@/utils/browserCompat';

export default function NavSidebar() {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteAllData() {
    setShowDeleteConfirm(false);
    await db.delete();
    safeWindow.reload();
  }

  function cancelDeleteAllData() {
    setShowDeleteConfirm(false);
  }

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-white transition-colors"
        style={{ fontSize: '20px', color: '#b92d2a' }}
      >
        ☰
      </button>

      {/* Sidebar Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex"
          onClick={handleBackdropClick}
          style={{ background: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
        >
          <nav
            className="w-80 h-full shadow-2xl animate-slide-in-left flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #edeafc 0%, #e7e4d4 100%)',
              borderRight: '2px solid #AA8B83'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <h2 className="text-2xl font-bold text-[#b92d2a]">Golden Lap</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl text-[#b92d2a] hover:text-[#fd655c] transition-colors"
              >
                ×
              </button>
            </div>

            {/* Navigation Links */}
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

      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.13)', backdropFilter: 'blur(7px)' }}>
          <div
            style={{
              background: '#F5F5F2',
              border: '2px solid #AA8B83',
              borderRadius: 22,
              boxShadow: '0 6px 32px rgba(52, 79, 58, 0.10)',
              fontFamily: 'Figtree, Inter, sans-serif',
              maxWidth: 450,
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'visible',
              padding: 0,
              position: 'relative',
              margin: '0 16px',
            }}
          >
            {/* Section header bar */}
            <div style={{ background: '#ece9e2', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottom: '1.5px solid #e0ded9', width: '100%', textAlign: 'center', padding: '18px 0 12px 0', fontWeight: 800, fontSize: '1.18rem', color: '#222', letterSpacing: '0.01em' }}>
              Delete All Data
            </div>
            {/* Close X button */}
            <button
              onClick={cancelDeleteAllData}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#fd655c',
                border: '2px solid #fff',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff',
                fontWeight: 900,
                zIndex: 20,
                boxShadow: '0 2px 8px rgba(214, 72, 67, 0.13)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              aria-label="Close"
              onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
              onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
            >
              ×
            </button>
            <div style={{ padding: '32px 36px 24px 36px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, background: '#F5F5F2' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#222', marginBottom: 12, textAlign: 'center' }}>Are you sure you want to delete ALL app data?</div>
              <div style={{ color: '#444', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>This action cannot be undone and will remove all members, portraits, and modpacks.</div>
              <div className="flex justify-end gap-2 w-full">
                <button
                  onClick={confirmDeleteAllData}
                  style={{
                    padding: '10px 32px',
                    borderRadius: 999,
                    background: '#fd655c',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '0.01em',
                    boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)',
                    border: 'none',
                    marginTop: 0,
                    marginBottom: 2,
                    transition: 'background 0.15s, box-shadow 0.15s',
                    cursor: 'pointer',
                    display: 'block',
                    textAlign: 'center',
                    minWidth: 120,
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
                  onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
                  onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
                  onBlur={e => (e.currentTarget.style.background = '#fd655c')}
                >
                  Delete All
                </button>
                <button
                  onClick={cancelDeleteAllData}
                  style={{
                    padding: '10px 32px',
                    borderRadius: 999,
                    background: '#ece9e2',
                    color: '#333',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '0.01em',
                    border: 'none',
                    marginTop: 0,
                    marginBottom: 2,
                    transition: 'background 0.15s, box-shadow 0.15s',
                    cursor: 'pointer',
                    display: 'block',
                    textAlign: 'center',
                    minWidth: 120,
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#d1cfc7')}
                  onMouseOut={e => (e.currentTarget.style.background = '#ece9e2')}
                  onFocus={e => (e.currentTarget.style.background = '#d1cfc7')}
                  onBlur={e => (e.currentTarget.style.background = '#ece9e2')}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 