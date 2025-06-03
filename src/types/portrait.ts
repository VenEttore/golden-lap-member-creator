export interface PortraitConfig {
  name: string;
  config: {
    hair: string;
    brow: string;
    facial: string;
    hairBack: string;
    head: string;
    ears: string;
    hairColor: string;
    skinColor: string;
  };
  thumbnail: string;
  fullSizeImage?: string;
  uploaded?: boolean;
}

export interface PortraitSelection {
  hair: string;
  brow: string;
  facial: string;
  hairBack: string;
  head: string;
  ears: string;
  hairColor: string;
  skinColor: string;
} 