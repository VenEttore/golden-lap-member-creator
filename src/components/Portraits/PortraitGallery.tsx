"use client";
import React, { useState, useEffect } from 'react';
import PortraitGeneratorPanel from './PortraitGeneratorPanel';
import { getPortraits, addOrUpdatePortrait, deletePortrait, deleteAllPortraits } from '@/utils/portraitStorage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { PortraitConfig } from '@/types/portrait';
import PortraitThumbnail from './PortraitThumbnail';
import { generateRandomPortraits } from '@/utils/batchPortraitRandomizer';

// Color palette and card styles from MemberCreatorModern
const cardBorder = '#AA8B83';
const cardShadow = 'rgba(52, 79, 58, 0.10)';
const sectionHeaderBg = '#d0cdbe';
const sectionHeaderBorder = '#d1cfc7';
const cardBg = '#F5F5F2';

function SectionHeader({ children, centerHeader }: { children: React.ReactNode; centerHeader?: boolean }) {
  return (
    <div
      style={{
        background: sectionHeaderBg,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderBottom: `2px solid ${sectionHeaderBorder}`,
        marginTop: 0,
        marginBottom: 0,
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      }}
      className="font-bold text-[1.18rem] text-[#222] flex items-center gap-3 font-[Figtree,Inter,sans-serif] tracking-[0.01em] justify-center text-center"
    >
      {children}
    </div>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div
      style={{
        background: cardBg,
        border: `2px solid ${cardBorder}`,
        boxShadow: `0 4px 16px ${cardShadow}`,
        borderRadius: 18,
        paddingTop: 0,
        marginBottom: 32,
      }}
      className="overflow-hidden flex flex-col min-h-[260px] p-0 gap-0"
    >
      <SectionHeader>{title}</SectionHeader>
      <div className="py-8 px-8 flex-1 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function getPortraitsFromStorage(): PortraitConfig[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('portraits');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePortraitToStorage(portrait: PortraitConfig) {
  const portraits = getPortraitsFromStorage();
  const idx = portraits.findIndex(p => p.name === portrait.name);
  if (idx !== -1) {
    portraits[idx] = portrait;
  } else {
    portraits.push(portrait);
  }
  localStorage.setItem('portraits', JSON.stringify(portraits));
}

function deletePortraitFromStorage(name: string) {
  const portraits = getPortraitsFromStorage().filter(p => p.name !== name);
  localStorage.setItem('portraits', JSON.stringify(portraits));
}

const PortraitGallery: React.FC = () => {
  const [portraits, setPortraits] = useState<PortraitConfig[]>([]);
  const [editPortrait, setEditPortrait] = useState<Partial<PortraitConfig> | null>(null);
  const [search, setSearch] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchCount, setBatchCount] = useState(5);
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = await getPortraits();
      setPortraits(loaded);
    })();
  }, [editPortrait]);

  async function handleDelete(name: string) {
    await deletePortrait(name);
    const loaded = await getPortraits();
    setPortraits(loaded);
  }

  function handleEdit(portrait: PortraitConfig) {
    // Ensure fullSizeImage is present for editing
    setEditPortrait({ ...portrait, fullSizeImage: portrait.fullSizeImage || portrait.thumbnail });
  }

  async function handleSavePortrait(portrait: PortraitConfig) {
    // Ensure uploaded flag is preserved when saving
    const portraitWithFullSize: PortraitConfig = {
      ...portrait,
      uploaded: (editPortrait && editPortrait.uploaded) || portrait.uploaded || false,
    };
    await addOrUpdatePortrait(portraitWithFullSize);
    setEditPortrait(null);
    const loaded = await getPortraits();
    setPortraits(loaded);
  }

  // Filter portraits by search
  const filteredPortraits = portraits.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #edeafc 0%, #e7e4d4 100%)',
        minHeight: '100vh',
        padding: 0,
        fontFamily: 'Figtree, Inter, sans-serif',
      }}
      className="flex flex-col min-h-screen font-[Figtree,Inter,sans-serif]"
    >
      <div className="w-full max-w-[1600px] mx-auto pt-8 pb-8 px-4">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 32, marginTop: 8 }}>
          <img src="/assets/GLLogo_New.png" alt="Golden Lap Logo" style={{ maxHeight: 64, width: 'auto', marginBottom: 8 }} />
          <h2 className="text-xl text-gray-600 font-bold tracking-wide font-[Figtree,Inter,sans-serif]" style={{ textAlign: 'center' }}>Portrait Creator</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 40, alignItems: 'flex-start', minWidth: 0, width: '100%' }}>
          <div style={{ flex: '0 0 auto', minWidth: 700, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <PortraitGeneratorPanel
              initialConfig={editPortrait && editPortrait.config ? editPortrait.config : undefined}
              initialName={editPortrait && editPortrait.name ? editPortrait.name : ''}
              onSave={portrait => {
                // Always provide fullSizeImage and preserve uploaded flag
                handleSavePortrait({
                  ...portrait,
                  fullSizeImage: portrait.fullSizeImage || portrait.thumbnail,
                  uploaded: (editPortrait && editPortrait.uploaded) || portrait.uploaded || false,
                });
              }}
              showCancel={false}
            />
          </div>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Card title="Saved Portraits">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setShowBatchModal(true)}
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
                    cursor: batchLoading ? 'not-allowed' : 'pointer',
                    display: 'block',
                    textAlign: 'center',
                    minWidth: 180,
                    alignSelf: 'end',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
                  onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
                  onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
                  onBlur={e => (e.currentTarget.style.background = '#fd655c')}
                  disabled={batchLoading}
                >
                  Batch Generate Portraits
                </button>
                {showBatchModal && (
                  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.13)', backdropFilter: 'blur(7px)' }}>
                    <div
                      style={{
                        background: '#F5F5F2',
                        border: '2px solid #AA8B83',
                        borderRadius: 22,
                        boxShadow: '0 6px 32px rgba(52, 79, 58, 0.10)',
                        fontFamily: 'Figtree, Inter, sans-serif',
                        maxWidth: 380,
                        width: '100%',
                        boxSizing: 'border-box',
                        overflow: 'visible',
                        padding: 0,
                        position: 'relative',
                      }}
                    >
                      {/* Section header bar */}
                      <div style={{ background: '#ece9e2', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottom: '1.5px solid #e0ded9', width: '100%', textAlign: 'center', padding: '18px 0 12px 0', fontWeight: 800, fontSize: '1.18rem', color: '#222', letterSpacing: '0.01em' }}>
                        Batch Generate Portraits
                      </div>
                      {/* Close X button */}
                      <button
                        onClick={() => setShowBatchModal(false)}
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
                      <form
                        onSubmit={async e => {
                          e.preventDefault();
                          setBatchLoading(true);
                          await generateRandomPortraits(batchCount);
                          setBatchLoading(false);
                          setShowBatchModal(false);
                          const loaded = await getPortraits();
                          setPortraits(loaded);
                        }}
                        className="flex flex-col gap-4"
                        style={{ padding: '32px 36px 24px 36px', background: '#F5F5F2', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <label className="flex flex-col gap-1 text-[#333] w-full">
                          <span style={{ color: '#222', fontWeight: 500 }}>Number of portraits</span>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={batchCount}
                            onChange={e => setBatchCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                            className="border rounded p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#fd655c]"
                            style={{ fontSize: 16, color: '#222', background: '#fff' }}
                            disabled={batchLoading}
                          />
                        </label>
                        <div className="flex justify-end gap-2 mt-6 w-full">
                          <button
                            type="submit"
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
                              marginTop: 10,
                              marginBottom: 2,
                              transition: 'background 0.15s, box-shadow 0.15s',
                              cursor: batchLoading ? 'not-allowed' : 'pointer',
                              display: 'block',
                              textAlign: 'center',
                              minWidth: 120,
                            }}
                            onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
                            onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
                            onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
                            onBlur={e => (e.currentTarget.style.background = '#fd655c')}
                            disabled={batchLoading}
                          >
                            {batchLoading ? 'Generating...' : 'Generate'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Search portraits..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    marginBottom: 12,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #bbb',
                    background: '#fff',
                    color: '#222',
                    fontSize: 16,
                  }}
                />
                <div
                  style={{
                    maxHeight: 520,
                    overflowY: 'auto',
                    background: '#fff',
                    borderRadius: 10,
                    border: '1px solid #e0e0e0',
                    padding: 8,
                    boxShadow: '0 2px 8px rgba(52,79,58,0.06)',
                  }}
                >
                  {filteredPortraits.length === 0 && (
                    <div style={{ color: '#aaa', padding: 16 }}>No portraits found.</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredPortraits.map(p => {
                      const isUserUploaded = p.uploaded === true;
                      return (
                        <div
                          key={p.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: '#f8f7f4',
                            borderRadius: 8,
                            border: '1px solid #d1cfc7',
                            padding: '8px 8px',
                          }}
                        >
                          <PortraitThumbnail portrait={p} />
                          <span style={{ fontWeight: 600, fontSize: 15, color: '#333', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                          <button
                            onClick={() => handleEdit(p)}
                            aria-label="Edit"
                            disabled={isUserUploaded}
                            title={isUserUploaded ? 'Editing is disabled for user-uploaded portraits.' : 'Edit'}
                            style={{
                              background: '#fd655c',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              cursor: isUserUploaded ? 'not-allowed' : 'pointer',
                              marginRight: 2,
                              opacity: isUserUploaded ? 0.5 : 1,
                              transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseOver={e => {
                              if (!isUserUploaded) {
                                e.currentTarget.style.background = '#b92d2a';
                                e.currentTarget.style.color = '#fff';
                              }
                            }}
                            onMouseOut={e => {
                              if (!isUserUploaded) {
                                e.currentTarget.style.background = '#fd655c';
                                e.currentTarget.style.color = '#fff';
                              }
                            }}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                          <button
                            onClick={() => {
                              const url = p.fullSizeImage || p.thumbnail;
                              // Always download the fullSizeImage if available
                              if (url) {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${p.name}.png`;
                                a.click();
                              }
                            }}
                            aria-label="Download"
                            style={{
                              background: '#ece9e2',
                              color: '#2ecc40',
                              border: 'none',
                              borderRadius: '50%',
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              cursor: 'pointer',
                              marginRight: 2,
                              transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = '#e6f9ed';
                              e.currentTarget.style.color = '#2ecc40';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = '#ece9e2';
                              e.currentTarget.style.color = '#2ecc40';
                            }}
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.name)}
                            aria-label="Delete"
                            style={{
                              background: '#ece9e2',
                              color: '#b92d2a',
                              border: 'none',
                              borderRadius: '50%',
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              cursor: 'pointer',
                              transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = '#fd655c';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = '#ece9e2';
                              e.currentTarget.style.color = '#b92d2a';
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortraitGallery; 