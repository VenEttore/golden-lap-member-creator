import React, { useState, useEffect, useRef } from 'react';

// Utility to load a JSON manifest
async function loadManifest<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return res.json();
}

// Utility to load an image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

// Types for manifest entries
interface SpriteEntry {
  fileName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

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
const CANVAS_SIZE = 256; // Preview size (not final export size)

const defaultColors = {
  hair: '#8e7355',
  skin: '#bc8277',
};

// Preset color swatches
const SKIN_SWATCHES = [
  '#211610', '#472e23', '#c1724f', '#976a56', '#b07b61', '#b27064', '#bc8277' // last is "true" default
];
const HAIR_SWATCHES = [
  '#704123', '#8e7355', '#6b533c', '#493127', '#2d1b13', '#1b100b', '#131313' // 2nd is "true" default
];

function getOptionsWithNone(entries: SpriteEntry[]) {
  return [{ fileName: '', label: 'None' }, ...entries.map(e => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }))];
}

// Type for the portrait selection/config
interface PortraitSelection {
  hair: string;
  brow: string;
  facial: string;
  hairBack: string;
  head: string;
  ears: string;
  hairColor: string;
  skinColor: string;
}

interface PortraitConfig {
  name: string;
  config: PortraitSelection;
  thumbnail: string; // data URL
}

function savePortraitToStorage(portrait: PortraitConfig) {
  const portraits = getPortraitsFromStorage();
  portraits.push(portrait);
  localStorage.setItem('portraits', JSON.stringify(portraits));
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

function deletePortraitFromStorage(name: string) {
  const portraits = getPortraitsFromStorage().filter(p => p.name !== name);
  localStorage.setItem('portraits', JSON.stringify(portraits));
}

const PortraitGenerator: React.FC = () => {
  // State for manifests and images
  const [manifests, setManifests] = useState<any>({});
  const [images, setImages] = useState<any>({});
  const [suitImg, setSuitImg] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);

  // State for selected parts
  const [selected, setSelected] = useState({
    hair: '',
    brow: '',
    facial: '',
    hairBack: '',
    head: '',
    ears: '',
    hairColor: defaultColors.hair,
    skinColor: defaultColors.skin,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [portraitName, setPortraitName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [portraits, setPortraits] = useState<PortraitConfig[]>([]);

  // Load manifests, images, and suit on mount
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const loadedManifests: any = {};
      const loadedImages: any = {};
      for (const key of Object.keys(PARTS)) {
        loadedManifests[key] = await loadManifest<{ sprites: SpriteEntry[] }>(PARTS[key as keyof typeof PARTS].manifest);
        loadedImages[key] = await loadImage(PARTS[key as keyof typeof PARTS].image);
      }
      const suit = await loadImage(SUIT_IMAGE);
      setManifests(loadedManifests);
      setImages(loadedImages);
      setSuitImg(suit);
      setLoading(false);
    }
    loadAll();
  }, []);

  // Filter head manifest for heads, ears, neck
  const headEntries = manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('head')) || [];
  const earEntries = manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('ear')) || [];
  const neckEntries = manifests.head?.sprites?.filter((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('neck')) || [];
  const neckEntry = neckEntries[0]; // Always use the only neck

  // Set defaults when manifests load
  useEffect(() => {
    if (!loading && headEntries.length && earEntries.length && neckEntry) {
      setSelected((prev) => ({
        ...prev,
        hair: '',
        brow: '',
        facial: '',
        hairBack: '',
        head: headEntries[0].fileName.replace(/\.png$/, ''),
        ears: earEntries[0].fileName.replace(/\.png$/, ''),
      }));
    }
    // eslint-disable-next-line
  }, [loading]);

  // Load saved portraits on mount
  useEffect(() => {
    setPortraits(getPortraitsFromStorage());
  }, []);

  // Draw preview
  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw suit as the bottom layer
    if (suitImg) {
      ctx.drawImage(suitImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    // Layer order: hairBack, neck, ears, head, facial, brow, hair
    const layers = [
      { key: 'hairBack', color: 'hairColor', manifest: 'hairBack' },
      { key: 'neck', color: 'skinColor', manifest: 'head', entry: neckEntry }, // always use the only neck
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
        partName = selected[layer.key as keyof typeof selected];
        if (!partName) continue; // skip if none selected
        const manifest = manifests[layer.manifest]?.sprites;
        entry = manifest?.find((s: SpriteEntry) => s.fileName.replace(/\.png$/, '') === partName);
      }
      if (!entry) continue;
      const img = images[layer.manifest];
      if (!img) continue;

      // Draw the part from the sprite sheet
      const off = document.createElement('canvas');
      off.width = off.height = CANVAS_SIZE;
      const octx = off.getContext('2d')!;
      octx.drawImage(
        img,
        entry.x, entry.y, entry.width, entry.height,
        0, 0, CANVAS_SIZE, CANVAS_SIZE
      );
      // Apply color blend
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
  }, [selected, manifests, images, loading, suitImg]);

  // Helper to generate a thumbnail (returns data URL)
  function generateThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return '';
    // Draw the current preview at 64x64
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, 64, 64);
    }
    return canvas.toDataURL('image/png');
  }

  // Save portrait handler
  function handleSavePortrait() {
    setSaveError('');
    const name = portraitName.trim();
    if (!name) {
      setSaveError('Name cannot be empty.');
      return;
    }
    if (portraits.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setSaveError('Name must be unique.');
      return;
    }
    const thumbnail = generateThumbnail();
    const configCopy = JSON.parse(JSON.stringify(selected));
    const newPortrait: PortraitConfig = { name, config: configCopy, thumbnail };
    savePortraitToStorage(newPortrait);
    setPortraits(getPortraitsFromStorage());
    setPortraitName('');
  }

  // Load portrait handler
  function handleLoadPortrait(portrait: PortraitConfig) {
    setSelected(portrait.config);
  }

  // Delete portrait handler
  function handleDeletePortrait(name: string) {
    deletePortraitFromStorage(name);
    setPortraits(getPortraitsFromStorage());
  }

  if (loading) return <div>Loading assets...</div>;

  // Helper for cycling options
  function cycleOption(part: keyof typeof selected, dir: -1 | 1, options: { fileName: string; label: string }[]) {
    const idx = options.findIndex(opt => opt.fileName === selected[part]);
    let nextIdx = idx + dir;
    if (nextIdx < 0) nextIdx = options.length - 1;
    if (nextIdx >= options.length) nextIdx = 0;
    setSelected(s => ({ ...s, [part]: options[nextIdx].fileName }));
  }

  // Option lists with 'None' for hair-related parts
  const hairOptions = getOptionsWithNone(manifests.hair?.sprites || []);
  const hairBackOptions = getOptionsWithNone(manifests.hairBack?.sprites || []);
  const browOptions = getOptionsWithNone(manifests.brow?.sprites || []);
  const facialOptions = getOptionsWithNone(manifests.facial?.sprites || []);

  // Head and ears (no 'None' option)
  const headOptions = (headEntries || []).map((e: SpriteEntry) => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }));
  const earOptions = (earEntries || []).map((e: SpriteEntry) => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }));

  // UI row helper
  function OptionRow({ label, part, options }: { label: string; part: keyof typeof selected; options: { fileName: string; label: string }[] }) {
    const idx = options.findIndex(opt => opt.fileName === selected[part]);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 320 }}>
        <span style={{ width: 80, textAlign: 'right', marginRight: 8 }}>{label}:</span>
        <button type="button" onClick={() => cycleOption(part, -1, options)} aria-label={`Previous ${label}`} style={{ width: 28 }}>&lt;</button>
        <select
          value={selected[part]}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelected(s => ({ ...s, [part]: e.target.value }))}
          style={{
            flex: 1,
            minWidth: 120,
            textAlign: 'center',
            background: '#222',
            color: '#fff',
            border: '1px solid #888',
            borderRadius: 4,
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          {options.map(opt => (
            <option key={opt.fileName} value={opt.fileName}>{opt.label}</option>
          ))}
        </select>
        <button type="button" onClick={() => cycleOption(part, 1, options)} aria-label={`Next ${label}`} style={{ width: 28 }}>&gt;</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Portrait Generator</h2>
      <div style={{ display: 'flex', gap: 32 }}>
        <div>
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ border: '1px solid #888', background: '#fff' }} />
          <div style={{ marginTop: 16 }}>
            <input
              type="text"
              placeholder="Portrait Name"
              value={portraitName}
              onChange={e => setPortraitName(e.target.value)}
              style={{ width: 160, marginRight: 8, padding: 4, borderRadius: 4, border: '1px solid #888', background: '#222', color: '#fff' }}
            />
            <button onClick={handleSavePortrait} style={{ padding: '4px 12px', borderRadius: 4, background: '#444', color: '#fff', border: '1px solid #888' }}>Save Portrait</button>
            {saveError && <div style={{ color: 'red', marginTop: 4 }}>{saveError}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OptionRow label="Hair" part="hair" options={hairOptions} />
          <OptionRow label="Hair Back" part="hairBack" options={hairBackOptions} />
          <OptionRow label="Brows" part="brow" options={browOptions} />
          <OptionRow label="Facial Hair" part="facial" options={facialOptions} />
          <OptionRow label="Head" part="head" options={headOptions} />
          <OptionRow label="Ears" part="ears" options={earOptions} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 320 }}>
            <span style={{ width: 80, textAlign: 'right', marginRight: 8 }}>Hair Color:</span>
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
                    border: selected.hairColor === color ? '2px solid #fff' : '1px solid #888',
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
            <span style={{ width: 80, textAlign: 'right', marginRight: 8 }}>Skin Color:</span>
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
                    border: selected.skinColor === color ? '2px solid #fff' : '1px solid #888',
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
        <div style={{ minWidth: 180 }}>
          <h3 style={{ marginBottom: 8 }}>Saved Portraits</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {portraits.length === 0 && <div style={{ color: '#aaa' }}>No portraits saved.</div>}
            {portraits.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#181818', borderRadius: 4, padding: 4 }}>
                <img src={p.thumbnail} alt={p.name} width={32} height={32} style={{ borderRadius: 2, border: '1px solid #444' }} />
                <span style={{ flex: 1, color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <button onClick={() => handleLoadPortrait(p)} style={{ padding: '2px 8px', borderRadius: 3, background: '#333', color: '#fff', border: '1px solid #666', fontSize: 12 }}>Load</button>
                <button onClick={() => handleDeletePortrait(p.name)} style={{ padding: '2px 8px', borderRadius: 3, background: '#a33', color: '#fff', border: '1px solid #a66', fontSize: 12 }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortraitGenerator; 