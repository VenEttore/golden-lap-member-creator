"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { getPortraits } from '@/utils/portraitStorage';
import { compositePortraitFrontend } from '@/utils/portraitStorage';
import { PortraitConfig, PortraitSelection } from '@/types/portrait';
import { getSpriteData } from '@/data';
import { createSafeImage } from '@/utils/browserCompat';

// Preset color swatches
const SKIN_SWATCHES = [
  '#211610', '#472e23', '#c1724f', '#976a56', '#b07b61', '#b27064', '#bc8277'
];
const HAIR_SWATCHES = [
  '#704123', '#8e7355', '#6b533c', '#493127', '#2d1b13', '#1b100b', '#131313'
];

// Card and section header styles (match gallery)
const cardBorder = '#AA8B83';
const cardShadow = 'rgba(52, 79, 58, 0.10)';
const sectionHeaderBg = '#d0cdbe';
const sectionHeaderBorder = '#d1cfc7';
const cardBg = '#F5F5F2';

function SectionHeader({ children }: { children: React.ReactNode }) {
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

const defaultConfig: PortraitSelection = {
  hair: 'hair01',
  brow: 'hairbrow01',
  facial: '',
  hairBack: '',
  head: 'head01',
  ears: 'ear01',
  hairColor: '#8e7355',
  skinColor: '#bc8277',
};

const CANVAS_SIZE = 256;

const PARTS = {
  hair: {
    manifest: '/assets/hair/hair/HairSprite.json',
    image: '/assets/hair/hair/HairSprite.png',
  },
  brow: {
    manifest: '/assets/hair/brow/HairBrowSprite.json',
    image: '/assets/hair/brow/HairBrowSprite.png',
  },
  facial: {
    manifest: '/assets/hair/facial/HairFacialSprite.json',
    image: '/assets/hair/facial/HairFacialSprite.png',
  },
  hairBack: {
    manifest: '/assets/hairBack/HairBackSprite.json',
    image: '/assets/hairBack/HairBackSprite.png',
  },
  head: {
    manifest: '/assets/head/HeadSprite.json',
    image: '/assets/head/HeadSprite.png',
  },
};

const SUIT_IMAGE = '/assets/GenericSuit.png';

interface SpriteEntry {
  fileName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ManifestData {
  sprites: SpriteEntry[];
}

interface ManifestState {
  [key: string]: ManifestData;
}

interface ImageState {
  [key: string]: HTMLImageElement;
}

function getOptionsWithNone(entries: SpriteEntry[]) {
  return [{ fileName: '', label: 'None' }, ...entries.map(e => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }))];
}

interface PortraitGeneratorPanelProps {
  initialConfig?: PortraitSelection;
  initialName?: string;
  onSave: (portrait: PortraitConfig) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  noCardWrapper?: boolean;
}

const PortraitGeneratorPanel: React.FC<PortraitGeneratorPanelProps> = ({ initialConfig, initialName, onSave, onCancel, showCancel = true, noCardWrapper = false }) => {
  // State for manifests and images
  const [manifests, setManifests] = useState<ManifestState>({});
  const [images, setImages] = useState<ImageState>({});
  const [suitImg, setSuitImg] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);

  // State for selected parts
  const [selected, setSelected] = useState<PortraitSelection>(initialConfig || defaultConfig);
  const [portraitName, setPortraitName] = useState(initialName || '');
  const [saveError, setSaveError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update state when editing a different portrait or switching to create new
  useEffect(() => {
    setSelected(initialConfig || defaultConfig);
    setPortraitName(initialName || '');
    setSaveError('');
  }, [initialConfig, initialName]);

  // Load manifests, images, and suit on mount
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      
      // Use bundled sprite data instead of fetch
      const loadedManifests: ManifestState = {
        hair: getSpriteData('hair'),
        brow: getSpriteData('brow'),
        facial: getSpriteData('facial'),
        hairBack: getSpriteData('hairBack'),
        head: getSpriteData('head')
      };
      
      const loadedImages: ImageState = {};
      for (const key of Object.keys(PARTS)) {
        loadedImages[key] = await new Promise<HTMLImageElement>((res, rej) => {
          const img = createSafeImage();
          if (!img) {
            // Fallback for SSR - create a mock image element
            const mockImg = { width: 0, height: 0, src: '', onload: null, onerror: null } as HTMLImageElement;
            res(mockImg);
            return;
          }
          img.src = PARTS[key as keyof typeof PARTS].image;
          img.onload = () => res(img);
          img.onerror = () => rej(new Error(`Failed to load image: ${PARTS[key as keyof typeof PARTS].image}`));
        });
      }
      
      const suit = await new Promise<HTMLImageElement>((res, rej) => {
        const img = createSafeImage();
        if (!img) {
          // Fallback for SSR - create a mock image element
          const mockImg = { width: 0, height: 0, src: '', onload: null, onerror: null } as HTMLImageElement;
          res(mockImg);
          return;
        }
        img.src = SUIT_IMAGE;
        img.onload = () => res(img);
        img.onerror = () => rej(new Error(`Failed to load suit image: ${SUIT_IMAGE}`));
      });
      
      setManifests(loadedManifests);
      setImages(loadedImages);
      setSuitImg(suit);
      setLoading(false);
    }
    
    loadAll();
  }, []); // Empty dependency array - should only run once on mount

  // Filter head manifest for heads, ears, neck
  const headEntries = useMemo(() => 
    manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('head')) || [],
    [manifests.head?.sprites]
  );
  
  const earEntries = useMemo(() => 
    manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('ear')) || [],
    [manifests.head?.sprites]
  );
  
  const neckEntries = useMemo(() => 
    manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('neck')) || [],
    [manifests.head?.sprites]
  );
  
  const neckEntry = neckEntries[0]; // Always use the only neck

  // Set defaults when manifests load or when editing
  useEffect(() => {
    if (!loading && headEntries.length && earEntries.length && neckEntry) {
      setSelected(prev => ({
        ...prev,
        hair: manifests.hair?.sprites?.[0]?.fileName.replace(/\.png$/, '') || prev.hair,
        brow: manifests.brow?.sprites?.[0]?.fileName.replace(/\.png$/, '') || prev.brow,
        head: prev.head || headEntries[0].fileName.replace(/\.png$/, ''),
        ears: prev.ears || earEntries[0].fileName.replace(/\.png$/, ''),
      }));
    }
  }, [loading, headEntries, earEntries, neckEntry, manifests.hair?.sprites, manifests.brow?.sprites]);

  // Draw preview
  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (suitImg) {
      ctx.drawImage(suitImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
    const layers = [
      { key: 'hairBack', color: 'hairColor', manifest: 'hairBack' },
      { key: 'neck', color: 'skinColor', manifest: 'head', entry: neckEntry },
      { key: 'ears', color: 'skinColor', manifest: 'head' },
      { key: 'head', color: 'skinColor', manifest: 'head' },
      { key: 'facial', color: 'hairColor', manifest: 'facial' },
      { key: 'brow', color: 'hairColor', manifest: 'brow' },
      { key: 'hair', color: 'hairColor', manifest: 'hair' },
    ];
    for (const layer of layers) {
      let partName: string;
      let entry: SpriteEntry | undefined;
      if (layer.key === 'neck') {
        entry = neckEntry;
        partName = neckEntry?.fileName.replace(/\.png$/, '') || '';
      } else {
        partName = selected[layer.key as keyof PortraitSelection];
        if (!partName) continue;
        const manifest = manifests[layer.manifest]?.sprites;
        entry = manifest?.find(s => s.fileName.replace(/\.png$/, '') === partName);
      }
      if (!entry) continue;
      const img = images[layer.manifest];
      if (!img) continue;
      const off = document.createElement('canvas');
      off.width = off.height = CANVAS_SIZE;
      const octx = off.getContext('2d')!;
      octx.drawImage(
        img,
        entry.x, entry.y, entry.width, entry.height,
        0, 0, CANVAS_SIZE, CANVAS_SIZE
      );
      octx.globalCompositeOperation = 'hard-light';
      octx.fillStyle = selected[layer.color as 'hairColor' | 'skinColor'];
      octx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      octx.globalCompositeOperation = 'destination-in';
      octx.drawImage(
        img,
        entry.x, entry.y, entry.width, entry.height,
        0, 0, CANVAS_SIZE, CANVAS_SIZE
      );
      octx.globalCompositeOperation = 'source-over';
      ctx.drawImage(off, 0, 0);
    }
  }, [selected, manifests, images, loading, suitImg, neckEntry]);

  // Helper for cycling options
  function cycleOption(part: keyof PortraitSelection, dir: -1 | 1, options: { fileName: string; label: string }[]) {
    const currentIndex = options.findIndex(opt => opt.fileName === selected[part]);
    const nextIndex = (currentIndex + dir + options.length) % options.length;
    setSelected(s => ({ ...s, [part]: options[nextIndex].fileName }));
  }

  // Option lists with 'None' for hair-related parts
  const hairOptions = getOptionsWithNone(manifests.hair?.sprites || []);
  const hairBackOptions = getOptionsWithNone(manifests.hairBack?.sprites || []);
  const browOptions = getOptionsWithNone(manifests.brow?.sprites || []);
  const facialOptions = getOptionsWithNone(manifests.facial?.sprites || []);
  const headOptions = (headEntries || []).map((e: SpriteEntry) => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }));
  const earOptions = (earEntries || []).map((e: SpriteEntry) => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }));

  // UI row helper
  function OptionRow({ label, part, options }: { label: string; part: keyof PortraitSelection; options: { fileName: string; label: string }[] }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 340 }}>
        <span
          style={{
            width: 110,
            textAlign: 'left',
            marginRight: 8,
            fontWeight: 700,
            color: '#555',
            fontSize: '1rem',
            fontFamily: 'Figtree, Inter, sans-serif',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
            flexShrink: 0,
          }}
        >
          {label}:
        </span>
        <button
          type="button"
          onClick={() => cycleOption(part, -1, options)}
          aria-label={`Previous ${label}`}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fd655c',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(214, 72, 67, 0.10)',
            marginRight: 2,
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
          onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
          onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
          onBlur={e => (e.currentTarget.style.background = '#fd655c')}
        >
          <Image src="/assets/ChevronLeft.png" alt="Previous" width={18} height={18} />
        </button>
        <select
          value={selected[part]}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelected(s => ({ ...s, [part]: e.target.value }))}
          style={{
            flex: 1,
            minWidth: 120,
            textAlign: 'center',
            background: '#fff',
            color: '#222',
            border: '2px solid #E5E7EB',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '1rem',
            padding: '0.5rem 1rem',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#fd655c';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(214, 72, 67, 0.15)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {options.map(opt => (
            <option key={opt.fileName} value={opt.fileName}>{opt.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => cycleOption(part, 1, options)}
          aria-label={`Next ${label}`}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fd655c',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(214, 72, 67, 0.10)',
            marginLeft: 2,
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
          onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
          onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
          onBlur={e => (e.currentTarget.style.background = '#fd655c')}
        >
          <Image src="/assets/ChevronLeft.png" alt="Next" width={18} height={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    );
  }

  // Helper to generate a thumbnail (returns data URL)
  function generateThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return '';
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, 64, 64);
    }
    return canvas.toDataURL('image/png');
  }

  async function handleSave() {
    setSaveError('');
    const name = portraitName.trim();
    if (!name) {
      setSaveError('Name cannot be empty.');
      return;
    }
    // Prevent duplicate names, except for the portrait being edited
    const portraits = await getPortraits();
    const existing = portraits.find(p => p.name.toLowerCase() === name.toLowerCase());
    const isEditing = !!initialName;
    if (existing && (!isEditing || existing.name.toLowerCase() !== initialName?.toLowerCase())) {
      setSaveError('Portrait name must be unique!');
      return;
    }
    const thumbnail = generateThumbnail();
    const configCopy = JSON.parse(JSON.stringify(selected));
    // Always fetch the backend composite and store as fullSizeImage
    let fullSizeImage = undefined;
    try {
      const { fullSizeImage: img } = await compositePortraitFrontend(configCopy);
      fullSizeImage = img;
    } catch {
      setSaveError('Error generating full-size portrait.');
      return;
    }
    onSave({ 
      name, 
      config: configCopy, 
      thumbnail, 
      fullSizeImage,
      uploaded: false
    });
    // Always reset to default config after saving (for both new and edit)
    setSelected({
      ...defaultConfig,
      hair: manifests.hair?.sprites?.[0]?.fileName.replace(/\.png$/, '') || '',
      brow: manifests.brow?.sprites?.[0]?.fileName.replace(/\.png$/, '') || '',
      head: manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('head'))?.[0]?.fileName.replace(/\.png$/, '') || '',
      ears: manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('ear'))?.[0]?.fileName.replace(/\.png$/, '') || '',
    });
    setPortraitName('');
    setSaveError('');
  }

  // Helper to randomize portrait
  function randomizePortrait() {
    function pickRandom<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    const newSelected = { ...selected };
    newSelected.hair = pickRandom(getOptionsWithNone(manifests.hair?.sprites || []).filter(o => o.fileName)).fileName;
    newSelected.brow = pickRandom(getOptionsWithNone(manifests.brow?.sprites || []).filter(o => o.fileName)).fileName;
    newSelected.facial = Math.random() < 0.5 ? '' : pickRandom(getOptionsWithNone(manifests.facial?.sprites || []).filter(o => o.fileName)).fileName;
    newSelected.hairBack = Math.random() < 0.5 ? '' : pickRandom(getOptionsWithNone(manifests.hairBack?.sprites || []).filter(o => o.fileName)).fileName;
    newSelected.head = pickRandom(headEntries).fileName.replace(/\.png$/, '');
    newSelected.ears = pickRandom(earEntries).fileName.replace(/\.png$/, '');
    newSelected.hairColor = pickRandom(HAIR_SWATCHES);
    newSelected.skinColor = pickRandom(SKIN_SWATCHES);
    setSelected(newSelected);
    setPortraitName(`RandomPortrait_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  }

  if (noCardWrapper) {
    return (
      <div style={{ display: 'flex', gap: 32, padding: '2.5rem 2.5rem 2rem 2.5rem', background: '#fff', borderRadius: 16, fontFamily: 'Figtree, Inter, sans-serif', overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ border: '1px solid #888', background: '#fff', borderRadius: 10 }} />
          <input
            type="text"
            placeholder="Portrait Name"
            value={portraitName}
            onChange={e => setPortraitName(e.target.value)}
            style={{
              width: '100%',
              margin: '10px 0 0 0',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '2px solid #E5E7EB',
              background: '#fff',
              color: '#222',
              fontWeight: 500,
              fontSize: '1rem',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#fd655c';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(214, 72, 67, 0.15)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {saveError && <div style={{ color: 'red', marginTop: 4 }}>{saveError}</div>}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
            <button
              onClick={handleSave}
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
                cursor: 'pointer',
                display: 'block',
                textAlign: 'center',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
              onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
              onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
              onBlur={e => (e.currentTarget.style.background = '#fd655c')}
            >
              Save Portrait
            </button>
            <button
              onClick={randomizePortrait}
              aria-label="Randomize Portrait"
              title="Randomize"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#fd655c',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)',
                cursor: 'pointer',
                marginTop: 10,
                marginBottom: 2,
                transition: 'background 0.15s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#b92d2a';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#fd655c';
              }}
              onFocus={e => {
                e.currentTarget.style.background = '#b92d2a';
              }}
              onBlur={e => {
                e.currentTarget.style.background = '#fd655c';
              }}
            >
              <Image src="/assets/dice.svg" alt="Randomize" width={24} height={24} style={{ filter: 'invert(1) brightness(2)' }} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 340 }}>
          <OptionRow label="Hair" part="hair" options={hairOptions} />
          <OptionRow label="Hair (Back)" part="hairBack" options={hairBackOptions} />
          <OptionRow label="Brows" part="brow" options={browOptions} />
          <OptionRow label="Facial Hair" part="facial" options={facialOptions} />
          <OptionRow label="Head" part="head" options={headOptions} />
          <OptionRow label="Ears" part="ears" options={earOptions} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 320 }}>
            <span
              style={{
                width: 110,
                textAlign: 'left',
                marginRight: 8,
                fontWeight: 700,
                color: '#555',
                fontSize: '1rem',
                fontFamily: 'Figtree, Inter, sans-serif',
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              Hair Color:
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {HAIR_SWATCHES.map((color, i) => (
                <button
                  key={color + i}
                  type="button"
                  onClick={() => setSelected(s => ({ ...s, hairColor: color }))}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: selected.hairColor === color ? '2px solid #fd655c' : '1px solid #888',
                    background: color,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  aria-label={`Set hair color to ${color}`}
                />
              ))}
            </div>
            <input type="color" value={selected.hairColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelected(s => ({ ...s, hairColor: e.target.value }))} style={{ width: 48, height: 32 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 320 }}>
            <span
              style={{
                width: 110,
                textAlign: 'left',
                marginRight: 8,
                fontWeight: 700,
                color: '#555',
                fontSize: '1rem',
                fontFamily: 'Figtree, Inter, sans-serif',
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              Skin Color:
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {SKIN_SWATCHES.map((color, i) => (
                <button
                  key={color + i}
                  type="button"
                  onClick={() => setSelected(s => ({ ...s, skinColor: color }))}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: selected.skinColor === color ? '2px solid #fd655c' : '1px solid #888',
                    background: color,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  aria-label={`Set skin color to ${color}`}
                />
              ))}
            </div>
            <input type="color" value={selected.skinColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelected(s => ({ ...s, skinColor: e.target.value }))} style={{ width: 48, height: 32 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: cardBg,
        border: `2px solid ${cardBorder}`,
        boxShadow: `0 4px 16px ${cardShadow}`,
        borderRadius: 18,
        paddingTop: 0,
        marginBottom: 32,
        position: 'relative',
        fontFamily: 'Figtree, Inter, sans-serif',
        width: 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'inline-block',
      }}
      className="overflow-hidden flex flex-col min-h-[260px] p-0 gap-0 font-[Figtree,Inter,sans-serif]"
    >
      <SectionHeader>{initialConfig ? 'Edit Portrait' : 'Create New Portrait'}
        {showCancel && onCancel && initialConfig && (
          <button
            onClick={onCancel}
            aria-label="Cancel"
            style={{
              position: 'absolute',
              top: 18,
              right: 24,
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: '#888',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </SectionHeader>
      <div
        style={{
          display: 'flex',
          gap: 32,
          padding: '2.5rem 2.5rem 2rem 2.5rem',
          background: '#fff',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          fontFamily: 'Figtree, Inter, sans-serif',
          overflow: 'auto',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ border: '1px solid #888', background: '#fff', borderRadius: 10 }} />
          <input
            type="text"
            placeholder="Portrait Name"
            value={portraitName}
            onChange={e => setPortraitName(e.target.value)}
            style={{
              width: '100%',
              margin: '10px 0 0 0',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '2px solid #E5E7EB',
              background: '#fff',
              color: '#222',
              fontWeight: 500,
              fontSize: '1rem',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#fd655c';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(214, 72, 67, 0.15)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {saveError && <div style={{ color: 'red', marginTop: 4 }}>{saveError}</div>}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
            <button
              onClick={handleSave}
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
                cursor: 'pointer',
                display: 'block',
                textAlign: 'center',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#b92d2a')}
              onMouseOut={e => (e.currentTarget.style.background = '#fd655c')}
              onFocus={e => (e.currentTarget.style.background = '#b92d2a')}
              onBlur={e => (e.currentTarget.style.background = '#fd655c')}
            >
              Save Portrait
            </button>
            <button
              onClick={randomizePortrait}
              aria-label="Randomize Portrait"
              title="Randomize"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#fd655c',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)',
                cursor: 'pointer',
                marginTop: 10,
                marginBottom: 2,
                transition: 'background 0.15s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#b92d2a';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#fd655c';
              }}
              onFocus={e => {
                e.currentTarget.style.background = '#b92d2a';
              }}
              onBlur={e => {
                e.currentTarget.style.background = '#fd655c';
              }}
            >
              <Image src="/assets/dice.svg" alt="Randomize" width={24} height={24} style={{ filter: 'invert(1) brightness(2)' }} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 340 }}>
          <OptionRow label="Hair" part="hair" options={hairOptions} />
          <OptionRow label="Hair (Back)" part="hairBack" options={hairBackOptions} />
          <OptionRow label="Brows" part="brow" options={browOptions} />
          <OptionRow label="Facial Hair" part="facial" options={facialOptions} />
          <OptionRow label="Head" part="head" options={headOptions} />
          <OptionRow label="Ears" part="ears" options={earOptions} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 320 }}>
            <span
              style={{
                width: 110,
                textAlign: 'left',
                marginRight: 8,
                fontWeight: 700,
                color: '#555',
                fontSize: '1rem',
                fontFamily: 'Figtree, Inter, sans-serif',
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              Hair Color:
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {HAIR_SWATCHES.map((color, i) => (
                <button
                  key={color + i}
                  type="button"
                  onClick={() => setSelected(s => ({ ...s, hairColor: color }))}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: selected.hairColor === color ? '2px solid #fd655c' : '1px solid #888',
                    background: color,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  aria-label={`Set hair color to ${color}`}
                />
              ))}
            </div>
            <input type="color" value={selected.hairColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelected(s => ({ ...s, hairColor: e.target.value }))} style={{ width: 48, height: 32 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 320 }}>
            <span
              style={{
                width: 110,
                textAlign: 'left',
                marginRight: 8,
                fontWeight: 700,
                color: '#555',
                fontSize: '1rem',
                fontFamily: 'Figtree, Inter, sans-serif',
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              Skin Color:
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {SKIN_SWATCHES.map((color, i) => (
                <button
                  key={color + i}
                  type="button"
                  onClick={() => setSelected(s => ({ ...s, skinColor: color }))}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: selected.skinColor === color ? '2px solid #fd655c' : '1px solid #888',
                    background: color,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  aria-label={`Set skin color to ${color}`}
                />
              ))}
            </div>
            <input type="color" value={selected.skinColor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelected(s => ({ ...s, skinColor: e.target.value }))} style={{ width: 48, height: 32 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortraitGeneratorPanel; 