// Asset path utilities for different deployment contexts

const isProduction = process.env.NODE_ENV === 'production';
const isElectron = typeof window !== 'undefined' && typeof (window as unknown as { electronAPI?: unknown })?.electronAPI !== 'undefined';

// Base path for assets
const getBasePath = (): string => {
  if (isElectron) {
    // In Electron, assets are served from the app's resources
    return './';
  } else if (isProduction) {
    // In production build, use relative paths
    return './';
  } else {
    // In development, use absolute paths
    return '/';
  }
};

const basePath = getBasePath();

// Asset path helpers
export const assetPaths = {
  // Portrait sprite assets
  hairSprite: `${basePath}assets/hair/hair/HairSprite.json`,
  hairBrowSprite: `${basePath}assets/hair/brow/HairBrowSprite.json`,
  hairFacialSprite: `${basePath}assets/hair/facial/HairFacialSprite.json`,
  hairBackSprite: `${basePath}assets/hairBack/HairBackSprite.json`,
  headSprite: `${basePath}assets/head/HeadSprite.json`,
  
  // Data files
  codes: `${basePath}data/codes.json`,
  driverTraits: `${basePath}data/traits/driver_traits.json`,
  engineerTraits: `${basePath}data/traits/engineer_traits.json`,
  crewChiefTraits: `${basePath}data/traits/crew_chief_traits.json`,
  genericTraits: `${basePath}data/traits/generic_traits.json`,
  
  // Icon data
  driversData: `${basePath}assets/drivers_data.json`,
  engcrewData: `${basePath}assets/engcrew_data.json`,
  
  // Images
  genericSuit: `${basePath}assets/GenericSuit.png`,
  genericSuitFull: `${basePath}assets/GenericSuitFull.png`,
  glLogo: `${basePath}assets/GLLogo_New.png`,
  sectorPip: `${basePath}assets/SectorPip.png`,
  arrowUp: `${basePath}assets/arrow_up.png`,
  chevronLeft: `${basePath}assets/ChevronLeft.png`,
  dice: `${basePath}assets/dice.svg`,
  driversSheet: `${basePath}assets/drivers_sheet.png`,
  engcrewSheet: `${basePath}assets/engcrew_sheet.png`
};

// Utility function to get trait file path
export function getTraitFilePath(memberType: 'driver' | 'engineer' | 'crew_chief'): string {
  switch (memberType) {
    case 'driver':
      return assetPaths.driverTraits;
    case 'engineer':
      return assetPaths.engineerTraits;
    case 'crew_chief':
      return assetPaths.crewChiefTraits;
    default:
      return assetPaths.genericTraits;
  }
}

// Utility function to get icon data path
export function getIconDataPath(memberType: 'driver' | 'engineer' | 'crew_chief'): string {
  return memberType === 'driver' ? assetPaths.driversData : assetPaths.engcrewData;
} 