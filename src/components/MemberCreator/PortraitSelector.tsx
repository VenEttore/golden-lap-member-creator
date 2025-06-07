import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PortraitConfig } from '@/types/portrait';
import { getPortraits } from '@/utils/portraitStorage';

interface PortraitSelectorProps {
  value: string;
  onChange: (val: string) => void;
  previewUrl?: string | null;
}

export function PortraitSelector({ value, onChange, previewUrl }: PortraitSelectorProps) {
  const [portraitUrl, setPortraitUrl] = useState<string | null>(previewUrl || null);
  const hasPortrait = Boolean(value);

  useEffect(() => {
    if (previewUrl) {
      setPortraitUrl(previewUrl);
      return;
    }
    if (value) {
      let cancelled = false;
      (async () => {
        const portraits = await getPortraits();
        if (cancelled) return;
        const found = portraits.find((p: PortraitConfig) => p.name === value);
        setPortraitUrl(found ? (found.fullSizeImage || found.thumbnail) : null);
      })();
      return () => { cancelled = true; };
    } else {
      setPortraitUrl(null);
    }
  }, [value, previewUrl]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
      <div
        style={{
          position: 'relative',
          width: 128,
          height: 128,
          borderRadius: '50%',
          background: hasPortrait ? '#e5e5e5' : '#d1cfc7',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(52,79,58,0.10)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.15s',
        }}
        tabIndex={0}
        onClick={() => onChange('')}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange(''); }}
        aria-label="Change Portrait"
      >
        {/* Portrait image or placeholder */}
        {hasPortrait && portraitUrl ? (
          <Image
            src={portraitUrl || ''}
            alt={value}
            width={128}
            height={128}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        ) : (
          <div style={{ width: 128, height: 128, borderRadius: '50%', background: '#d1cfc7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: '#aaa', fontWeight: 700, fontFamily: 'Figtree, Inter, sans-serif' }}>?</div>
        )}
        {/* Overlay on hover */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'rgba(52,52,52,0.32)',
            color: '#fff',
            fontFamily: 'Figtree, Inter, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.15s',
          }}
          className="portrait-hover-overlay"
        >
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 2 }}>
              <circle cx="12" cy="13" r="3" />
              <path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
            </svg>
            {hasPortrait ? 'Change Portrait' : 'Add Portrait'}
          </span>
        </div>
        <style>{`
          .portrait-hover-overlay {
            pointer-events: none;
          }
          div[aria-label="Change Portrait"]:hover .portrait-hover-overlay,
          div[aria-label="Change Portrait"]:focus .portrait-hover-overlay {
            opacity: 1;
            pointer-events: auto;
          }
        `}</style>
      </div>
    </div>
  );
} 