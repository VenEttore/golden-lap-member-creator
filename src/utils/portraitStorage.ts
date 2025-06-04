import { PortraitConfig } from '@/types/portrait';
import { idbGetItem, idbSetItem, idbRemoveItem } from './idbStorage';

const PORTRAITS_KEY = 'goldenlap:portraits';

// Types for manifests and sprites
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

// Get all portraits
export async function getPortraits(): Promise<PortraitConfig[]> {
  if (typeof window === 'undefined') return [];
  const raw = await idbGetItem(PORTRAITS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw as string);
  } catch {
    return [];
  }
}

// Save all portraits
export async function savePortraits(portraits: PortraitConfig[]): Promise<void> {
  await idbSetItem(PORTRAITS_KEY, JSON.stringify(portraits));
}

// Add or update a portrait
export async function addOrUpdatePortrait(portrait: PortraitConfig): Promise<void> {
  const portraits = await getPortraits();
  const idx = portraits.findIndex(p => p.name === portrait.name);
  if (idx !== -1) {
    portraits[idx] = portrait;
  } else {
    portraits.push(portrait);
  }
  await savePortraits(portraits);
}

// Delete a portrait by name
export async function deletePortrait(name: string): Promise<void> {
  const portraits = (await getPortraits()).filter(p => p.name !== name);
  await savePortraits(portraits);
}

// Delete all portraits
export async function deleteAllPortraits(): Promise<void> {
  await idbRemoveItem(PORTRAITS_KEY);
}

// Unified async portrait display URL getter
export async function getPortraitDisplayUrl(portrait: PortraitConfig): Promise<string> {
  // 1. Try cache (full-size)
  try {
    const cache = await caches.open('portraits-full');
    const response = await cache.match(`/portraits/${portrait.name}.png`);
    if (response) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch {}
  // 2. If uploaded, use fullSizeImage data URL
  if (portrait.uploaded && portrait.fullSizeImage) {
    return portrait.fullSizeImage;
  }
  // 3. Fallback: use thumbnail
  return portrait.thumbnail;
}

// Composite a portrait on the frontend (1024x1024, no suit)
export async function compositePortraitFrontend(config: PortraitConfig['config']): Promise<{ fullSizeImage: string; thumbnail: string; }> {
  // Layer order and part definitions
  const LAYER_ORDER = ['hairBack', 'neck', 'ears', 'head', 'facial', 'brow', 'hair'];
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
  // Load manifests and images
  const manifests: Record<string, ManifestData> = {};
  const images: Record<string, HTMLImageElement> = {};
  for (const key of Object.keys(PARTS)) {
    manifests[key] = await fetch(PARTS[key as keyof typeof PARTS].manifest).then(r => r.json() as Promise<ManifestData>);
    images[key] = await new Promise<HTMLImageElement>(res => {
      const img = new window.Image();
      img.src = PARTS[key as keyof typeof PARTS].image;
      img.onload = () => res(img);
    });
  }
  // Always use neck01 for neck
  const neckEntry = manifests.head?.sprites?.find((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('neck'));
  // Prepare canvas
  const SIZE = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, SIZE, SIZE);
  // Draw each layer (match PortraitGeneratorPanel logic)
  for (const layer of LAYER_ORDER) {
    let partName: string;
    let entry: SpriteEntry | undefined;
    if (layer === 'neck') {
      entry = neckEntry;
      partName = neckEntry?.fileName.replace(/\.png$/, '') || '';
    } else {
      partName = config[layer as keyof typeof config] as string;
      if (!partName) continue;
      const manifest = manifests[layer === 'neck' ? 'head' : (layer === 'ears' || layer === 'head' ? 'head' : layer)];
      entry = manifest?.sprites?.find((s: SpriteEntry) => s.fileName.replace(/\.png$/, '') === partName);
    }
    if (!entry) continue;
    const img = images[layer === 'neck' ? 'head' : (layer === 'ears' || layer === 'head' ? 'head' : layer)];
    if (!img) continue;
    // Offscreen canvas for tinting/masking
    const off = document.createElement('canvas');
    off.width = off.height = SIZE;
    const octx = off.getContext('2d')!;
    octx.drawImage(img, entry.x, entry.y, entry.width, entry.height, 0, 0, SIZE, SIZE);
    octx.globalCompositeOperation = 'hard-light';
    octx.fillStyle = (layer === 'hair' || layer === 'brow' || layer === 'facial' || layer === 'hairBack') ? config.hairColor : config.skinColor;
    octx.fillRect(0, 0, SIZE, SIZE);
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(img, entry.x, entry.y, entry.width, entry.height, 0, 0, SIZE, SIZE);
    octx.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, 0, 0);
  }
  // Export PNG data URL
  const fullSizeImage = canvas.toDataURL('image/png');
  // Generate thumbnail (64x64)
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 64;
  thumbCanvas.height = 64;
  const thumbCtx = thumbCanvas.getContext('2d')!;
  thumbCtx.drawImage(canvas, 0, 0, 64, 64);
  const thumbnail = thumbCanvas.toDataURL('image/png');
  return { fullSizeImage, thumbnail };
}

/**
 * Batch-safe add or update for multiple portraits at once.
 * Loads all existing portraits, updates/adds each from portraitsToAdd, and saves in a single write.
 */
export async function addOrUpdatePortraitsBatch(portraitsToAdd: PortraitConfig[]): Promise<void> {
  const portraits = await getPortraits();
  for (const newPortrait of portraitsToAdd) {
    const idx = portraits.findIndex(p => p.name === newPortrait.name);
    if (idx !== -1) {
      portraits[idx] = newPortrait;
    } else {
      portraits.push(newPortrait);
    }
  }
  await savePortraits(portraits);
} 