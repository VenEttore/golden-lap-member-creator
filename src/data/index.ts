// Centralized data bundle to replace runtime JSON fetches
// This ensures compatibility with static export and Electron

// Import all JSON data statically
import codes from '../../public/data/codes.json';
import driverTraits from '../../public/data/traits/driver_traits.json';
import engineerTraits from '../../public/data/traits/engineer_traits.json';
import crewChiefTraits from '../../public/data/traits/crew_chief_traits.json';
import genericTraits from '../../public/data/traits/generic_traits.json';
import driversData from '../../public/assets/drivers_data.json';
import engcrewData from '../../public/assets/engcrew_data.json';

// Import sprite manifests
import hairSprite from '../../public/assets/hair/hair/HairSprite.json';
import browSprite from '../../public/assets/hair/brow/HairBrowSprite.json';
import facialSprite from '../../public/assets/hair/facial/HairFacialSprite.json';
import hairBackSprite from '../../public/assets/hairBack/HairBackSprite.json';
import headSprite from '../../public/assets/head/HeadSprite.json';

// Export all data
export const DATA = {
  codes,
  traits: {
    driver: driverTraits,
    engineer: engineerTraits,
    crew_chief: crewChiefTraits,
    generic: genericTraits
  },
  icons: {
    drivers: driversData,
    engcrew: engcrewData
  },
  sprites: {
    hair: hairSprite,
    brow: browSprite,
    facial: facialSprite,
    hairBack: hairBackSprite,
    head: headSprite
  }
} as const;

// Utility functions for data access
export function getTraitData(memberType: 'driver' | 'engineer' | 'crew_chief') {
  return DATA.traits[memberType];
}

export function getGenericTraitData() {
  return DATA.traits.generic;
}

export function getIconData(memberType: 'driver' | 'engineer' | 'crew_chief') {
  return memberType === 'driver' ? DATA.icons.drivers : DATA.icons.engcrew;
}

export function getCountryCodes() {
  return DATA.codes;
}

// Sprite data utilities
export function getSpriteData(spriteType: 'hair' | 'brow' | 'facial' | 'hairBack' | 'head') {
  return DATA.sprites[spriteType];
} 