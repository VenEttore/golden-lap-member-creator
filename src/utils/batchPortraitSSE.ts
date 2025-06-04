// Utility for batch portrait generation using SSE

import { PortraitSelection } from '@/types/portrait';
import { compositePortraitFrontend } from './portraitStorage';

export interface PortraitConfig {
  name: string;
  config: PortraitSelection;
  thumbnail: string;
  fullSizeImage: string;
}

export async function generateBatchPortraitsSSE(
  configs: PortraitSelection[],
  onPortrait: (result: { name: string; config: PortraitSelection; thumbnail: string; fullSizeImage: string }) => void
): Promise<void> {
  for (let i = 0; i < configs.length; ++i) {
    const config = configs[i];
    const { fullSizeImage, thumbnail } = await compositePortraitFrontend(config);
    const name = `RandomPortrait_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
    onPortrait({ name, config, thumbnail, fullSizeImage });
  }
} 