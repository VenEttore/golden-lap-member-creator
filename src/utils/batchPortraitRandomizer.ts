import { addOrUpdatePortrait } from './portraitStorage';
import { PortraitConfig, PortraitSelection } from '@/types/portrait';
import { generateBatchPortraitsSSE } from './batchPortraitSSE';

const PARTS = {
  hair: '/assets/hair/hair/HairSprite.json',
  brow: '/assets/hair/brow/HairBrowSprite.json',
  facial: '/assets/hair/facial/HairFacialSprite.json',
  hairBack: '/assets/hairBack/HairBackSprite.json',
  head: '/assets/head/HeadSprite.json',
};

const SKIN_SWATCHES = [
  '#211610', '#472e23', '#c1724f', '#976a56', '#b07b61', '#b27064', '#bc8277'
];
const HAIR_SWATCHES = [
  '#704123', '#8e7355', '#6b533c', '#493127', '#2d1b13', '#1b100b', '#131313'
];

async function loadManifest(url: string): Promise<{ sprites: { fileName: string }[] }> {
  const res = await fetch(url);
  return res.json();
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateRandomPortraits(count: number, onPortrait?: (portrait: PortraitConfig) => void | Promise<void>) {
  // 1. Load manifests
  const [hair, brow, facial, hairBack, head]: [
    { sprites: { fileName: string }[] },
    { sprites: { fileName: string }[] },
    { sprites: { fileName: string }[] },
    { sprites: { fileName: string }[] },
    { sprites: { fileName: string }[] }
  ] = await Promise.all([
    loadManifest(PARTS.hair),
    loadManifest(PARTS.brow),
    loadManifest(PARTS.facial),
    loadManifest(PARTS.hairBack),
    loadManifest(PARTS.head),
  ]);
  const headEntries = (head.sprites).filter((s) => s.fileName.toLowerCase().startsWith('head'));
  const earEntries = (head.sprites).filter((s) => s.fileName.toLowerCase().startsWith('ear'));
  // 2. Generate random configs
  const configs: PortraitSelection[] = [];
  for (let i = 0; i < count; ++i) {
    const config: PortraitSelection = {
      hair: pickRandom(hair.sprites).fileName.replace(/\.png$/, ''),
      brow: pickRandom(brow.sprites).fileName.replace(/\.png$/, ''),
      facial: Math.random() < 0.5 ? '' : pickRandom(facial.sprites).fileName.replace(/\.png$/, ''),
      hairBack: Math.random() < 0.5 ? '' : pickRandom(hairBack.sprites).fileName.replace(/\.png$/, ''),
      head: pickRandom(headEntries).fileName.replace(/\.png$/, ''),
      ears: pickRandom(earEntries).fileName.replace(/\.png$/, ''),
      hairColor: pickRandom(HAIR_SWATCHES),
      skinColor: pickRandom(SKIN_SWATCHES),
    };
    configs.push(config);
  }
  // 3. Call batch endpoint and add each portrait as it arrives
  const results: PortraitConfig[] = [];
  await generateBatchPortraitsSSE(configs as unknown[], async (data) => {
    const portrait: PortraitConfig = {
      name: data.name,
      config: data.config as unknown as PortraitSelection,
      thumbnail: data.thumbnail,
      fullSizeImage: data.fullSizeImage,
      uploaded: false,
    };
    await addOrUpdatePortrait(portrait);
    results.push(portrait);
    if (onPortrait) await onPortrait(portrait);
  });
  return results;
} 