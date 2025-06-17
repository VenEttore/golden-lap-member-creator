import { PortraitConfig } from '@/types/portrait';
import { db } from './db';
import { getSpriteData } from '@/data';
import { createSafeImage, createSafeCanvas } from '@/utils/browserCompat';

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
  return await db.portraits.toArray();
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
  await db.portraits.bulkPut(portraits);
}

// Delete a portrait by name
export async function deletePortrait(name: string): Promise<void> {
  await db.portraits.delete(name);
}

// Composite a portrait on the frontend (1024x1024, no suit)
export async function compositePortraitFrontend(config: PortraitConfig['config']): Promise<{ fullSizeImage: string; thumbnail: string; }> {
  // Layer order and part definitions
  const LAYER_ORDER = ['hairBack', 'neck', 'ears', 'head', 'facial', 'brow', 'hair'];
  const PARTS = {
    hair: {
      image: '/assets/hair/hair/HairSprite.png',
    },
    brow: {
      image: '/assets/hair/brow/HairBrowSprite.png',
    },
    facial: {
      image: '/assets/hair/facial/HairFacialSprite.png',
    },
    hairBack: {
      image: '/assets/hairBack/HairBackSprite.png',
    },
    head: {
      image: '/assets/head/HeadSprite.png',
    },
  };
  
  // Load manifests from bundled data and images
  const manifests: Record<string, ManifestData> = {
    hair: getSpriteData('hair'),
    brow: getSpriteData('brow'),
    facial: getSpriteData('facial'),
    hairBack: getSpriteData('hairBack'),
    head: getSpriteData('head')
  };
  
  const images: Record<string, HTMLImageElement> = {};
  for (const key of Object.keys(PARTS)) {
    images[key] = await new Promise<HTMLImageElement>((res, rej) => {
      const img = createSafeImage();
      if (!img) {
        // Fallback for SSR
        const mockImg = { width: 0, height: 0, src: '', onload: null, onerror: null } as HTMLImageElement;
        res(mockImg);
        return;
      }
      img.src = PARTS[key as keyof typeof PARTS].image;
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`Failed to load image: ${PARTS[key as keyof typeof PARTS].image}`));
    });
  }
  
  // Always use neck01 for neck
  const neckEntry = manifests.head?.sprites?.find((s: SpriteEntry) => s.fileName.toLowerCase().startsWith('neck'));
  
  // Prepare canvas
  const SIZE = 1024;
  const canvas = createSafeCanvas();
  if (!canvas) {
    // Fallback for SSR
    return { fullSizeImage: '', thumbnail: '' };
  }
  
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
    const off = createSafeCanvas();
    if (!off) continue; // Skip if canvas creation fails in SSR
    
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
  const thumbCanvas = createSafeCanvas();
  if (!thumbCanvas) {
    // Fallback for SSR
    return { fullSizeImage, thumbnail: '' };
  }
  
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
  await db.portraits.bulkPut(portraits);
} 