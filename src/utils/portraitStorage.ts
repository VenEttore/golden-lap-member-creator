import { PortraitConfig } from '@/types/portrait';
import { idbGetItem, idbSetItem, idbRemoveItem } from './idbStorage';

const PORTRAITS_KEY = 'goldenlap:portraits';

// Get all portraits
export async function getPortraits(): Promise<PortraitConfig[]> {
  if (typeof window === 'undefined') return [];
  const raw = await idbGetItem(PORTRAITS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
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

// Helper to build composite URL from config
export function buildCompositeUrl(config: PortraitConfig['config']): string {
  const params = new URLSearchParams({
    hair: config.hair || '',
    brow: config.brow || '',
    facial: config.facial || '',
    hairBack: config.hairBack || '',
    head: config.head || '',
    ears: config.ears || '',
    hairColor: config.hairColor || '#8e7355',
    skinColor: config.skinColor || '#bc8277',
  });
  return `/api/portraits/composite?${params.toString()}`;
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