import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

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

interface ManifestData {
  sprites: SpriteEntry[];
}

interface ManifestState {
  [key: string]: ManifestData;
}

interface ImageState {
  [key: string]: HTMLImageElement;
}

const PortraitGenerator: React.FC = () => {
  // State for manifests and images
  const [manifests, setManifests] = useState<ManifestState>({});
  const [images, setImages] = useState<ImageState>({});
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
      const loadedManifests: ManifestState = {};
      const loadedImages: ImageState = {};
      for (const key of Object.keys(PARTS)) {
        loadedManifests[key] = await loadManifest<ManifestData>(PARTS[key as keyof typeof PARTS].manifest);
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
  }, [selected, manifests, images, loading, suitImg, neckEntry]);

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
    const current = selected[part];
    const currentIndex = options.findIndex(o => o.fileName === current);
    const nextIndex = (currentIndex + dir + options.length) % options.length;
    setSelected(prev => ({ ...prev, [part]: options[nextIndex].fileName }));
  }

  // UI row helper
  function OptionRow({ label, part, options }: { label: string; part: keyof typeof selected; options: { fileName: string; label: string }[] }) {
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
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, background: '#f0f0f0', borderRadius: 8 }}
        />
        <div className="flex gap-4">
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const link = document.createElement('a');
              link.download = 'portrait.png';
              link.href = canvas.toDataURL('image/png');
              link.click();
            }}
            className="px-4 py-2 bg-[#fd655c] text-white rounded-full hover:bg-[#b92d2a] transition-colors"
          >
            Download
          </button>
          <button
            onClick={handleSavePortrait}
            className="px-4 py-2 bg-[#fd655c] text-white rounded-full hover:bg-[#b92d2a] transition-colors"
          >
            Save Portrait
          </button>
        </div>
        {saveError && <div className="text-red-500">{saveError}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Portrait Options</h2>
          <OptionRow label="Hair" part="hair" options={getOptionsWithNone(manifests.hair?.sprites || [])} />
          <OptionRow label="Brow" part="brow" options={getOptionsWithNone(manifests.brow?.sprites || [])} />
          <OptionRow label="Facial Hair" part="facial" options={getOptionsWithNone(manifests.facial?.sprites || [])} />
          <OptionRow label="Hair Back" part="hairBack" options={getOptionsWithNone(manifests.hairBack?.sprites || [])} />
          <OptionRow label="Head" part="head" options={headEntries.map(e => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }))} />
          <OptionRow label="Ears" part="ears" options={earEntries.map(e => ({ fileName: e.fileName.replace(/\.png$/, ''), label: e.fileName.replace(/\.png$/, '') }))} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Colors</h2>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Hair Color</label>
            <div className="flex gap-2">
              {HAIR_SWATCHES.map(color => (
                <button
                  key={color}
                  onClick={() => setSelected(prev => ({ ...prev, hairColor: color }))}
                  className="w-8 h-8 rounded-full border-2 border-transparent hover:border-[#fd655c] transition-colors"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Skin Color</label>
            <div className="flex gap-2">
              {SKIN_SWATCHES.map(color => (
                <button
                  key={color}
                  onClick={() => setSelected(prev => ({ ...prev, skinColor: color }))}
                  className="w-8 h-8 rounded-full border-2 border-transparent hover:border-[#fd655c] transition-colors"
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-4">Saved Portraits</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {portraits.map(portrait => (
            <div key={portrait.name} className="flex flex-col items-center gap-2">
              <Image
                src={portrait.thumbnail}
                alt={portrait.name}
                width={64}
                height={64}
                className="rounded-full"
              />
              <div className="text-sm font-medium">{portrait.name}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadPortrait(portrait)}
                  className="px-2 py-1 bg-[#fd655c] text-white rounded-full hover:bg-[#b92d2a] transition-colors text-sm"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeletePortrait(portrait.name)}
                  className="px-2 py-1 bg-[#ece9e2] text-[#b92d2a] rounded-full hover:bg-[#fd655c] hover:text-white transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortraitGenerator; 