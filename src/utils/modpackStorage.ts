import { Modpack, ModpackExportOptions } from '../types/modpack';
import { Member } from './memberStorage';
import { getMembers } from './memberStorage';
import { getPortraits } from './portraitStorage';
import JSZip from 'jszip';
import { db } from './db';
import { perfMonitor } from './performanceMonitor';

// Storage functions
export async function getModpacks(): Promise<Modpack[]> {
  if (typeof window === 'undefined') return [];
  return await db.modpacks.toArray();
}

export async function saveModpack(modpack: Modpack): Promise<void> {
  await db.modpacks.put(modpack);
}

export async function deleteModpack(id: string): Promise<void> {
  await db.modpacks.delete(id);
}

// Export functions
export async function exportModpack(modpack: Modpack, options: ModpackExportOptions): Promise<Blob> {
  perfMonitor.startTimer('modpack-export');
  
  const allMembers = await getMembers();
  const members = allMembers.filter(m => modpack.members.includes(m.id));
  const zip = new JSZip();
  
  // Create directory structure
  const peopleFolder = zip.folder('Data/People');
  const driversFolder = peopleFolder?.folder('Drivers');
  const engineersFolder = peopleFolder?.folder('Engineers');
  const crewChiefsFolder = peopleFolder?.folder('CrewChiefs');
  
  const portraitsFolder = zip.folder('Textures/Portraits');
  
  // OPTIMIZATION 1: Load all portraits once at the beginning
  const allPortraits = options.includePortraits ? await getPortraits() : [];
  const portraitMap = new Map(allPortraits.map(p => [p.name, p]));
  
  // OPTIMIZATION 2: Batch convert data URLs to blobs
  const portraitBlobPromises = new Map<string, Promise<Blob>>();
  
  function getPortraitBlob(portraitName: string): Promise<Blob> | null {
    if (!portraitBlobPromises.has(portraitName)) {
      const portrait = portraitMap.get(portraitName);
      if (portrait?.fullSizeImage) {
        // More efficient data URL to blob conversion
        portraitBlobPromises.set(portraitName, dataURLToBlob(portrait.fullSizeImage));
      }
    }
    return portraitBlobPromises.get(portraitName) || null;
  }
  
  // Helper to format member JSON and filename as in docs
  function formatMemberForExport(member: Member) {
    // Traits as string[]
    let traitNames: string[] = Array.isArray(member.traits)
      ? member.traits.map((t: { name: string } | string) => typeof t === 'string' ? t : t.name)
      : [];
    // Ensure career stage trait is present
    const CAREER_STAGE_TRAIT_MAP: Record<string, string> = {
      early: 'EarlyCareer',
      mid: 'MidCareer',
      late: 'LateCareer',
      last_year: 'LastYear',
    };
    let careerStageTrait = '';
    if (member.careerStage && CAREER_STAGE_TRAIT_MAP[member.careerStage]) {
      careerStageTrait = CAREER_STAGE_TRAIT_MAP[member.careerStage];
    }
    if (careerStageTrait && !traitNames.includes(careerStageTrait)) {
      traitNames = [careerStageTrait, ...traitNames.filter(t => !Object.values(CAREER_STAGE_TRAIT_MAP).includes(t))];
    }
    // PortraitPath
    let portraitPath = '';
    if (member.portraitName) {
      portraitPath = `Textures/Portraits/${member.portraitName.replace(/\.png$/i, '')}.png`;
    }
    // Stats by type
    const stats: Record<string, number> = member.stats || {};
    let exportStats: Record<string, number> = {};
    if (member.type === 'driver') {
      exportStats = {
        Speed: stats.speed ?? 1,
        MaxSpeed: stats.maxSpeed ?? 1,
        Focus: stats.focus ?? 1,
        MaxFocus: stats.maxFocus ?? 1,
      };
    } else if (member.type === 'engineer') {
      exportStats = {
        Expertise: stats.expertise ?? 1,
        MaxExpertise: stats.maxExpertise ?? 1,
        Precision: stats.precision ?? 1,
        MaxPrecision: stats.maxPrecision ?? 1,
      };
    } else if (member.type === 'crew_chief') {
      exportStats = {
        Speed: stats.speed ?? 1,
        MaxSpeed: stats.maxSpeed ?? 1,
        Skill: stats.skill ?? 1,
        MaxSkill: stats.maxSkill ?? 1,
      };
    }
    // Compose export object
    const exportObj: Record<string, unknown> = {
      Name: member.name,
      Surname: member.surname,
      CountryCode: member.country,
      PortraitPath: portraitPath,
      Traits: traitNames,
      ...exportStats,
      DecadeStartContent: !!member.decadeStartContent,
    };
    // Docs-compliant filename
    const filename = `${member.name}${member.surname ? ' ' + member.surname : ''}`.trim() + '.json';
    return { exportObj, filename };
  }
  
  // Process each member
  for (const member of members) {
    const { exportObj, filename } = formatMemberForExport(member);
    // Add to appropriate folder
    const folder = member.type === 'driver' ? driversFolder :
                  member.type === 'engineer' ? engineersFolder :
                  crewChiefsFolder;
    folder?.file(filename, JSON.stringify(exportObj, null, 2));
    
    // Add portrait if requested (optimized)
    if (options.includePortraits && member.portraitName) {
      const portraitFileName = `${member.portraitName.replace(/\.png$/i, '')}.png`;
      const blobPromise = getPortraitBlob(member.portraitName);
      if (blobPromise) {
        const blob = await blobPromise;
        portraitsFolder?.file(portraitFileName, blob);
      }
    }
  }
  
  // OPTIMIZATION 3: Use faster compression settings
  const result = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6 // Balance between speed and size (1-9, default 6)
    }
  });
  
  const exportTime = perfMonitor.endTimer('modpack-export');
  console.log(`Modpack export completed in ${exportTime.toFixed(2)}ms`);
  
  return result;
}

// COMPARISON FUNCTION: Old inefficient approach for performance testing
export async function exportModpackOldWay(modpack: Modpack, options: ModpackExportOptions): Promise<Blob> {
  perfMonitor.startTimer('modpack-export-old');
  
  const allMembers = await getMembers();
  const members = allMembers.filter(m => modpack.members.includes(m.id));
  const zip = new JSZip();
  
  // Create directory structure
  const peopleFolder = zip.folder('Data/People');
  const driversFolder = peopleFolder?.folder('Drivers');
  const engineersFolder = peopleFolder?.folder('Engineers');
  const crewChiefsFolder = peopleFolder?.folder('CrewChiefs');
  
  const portraitsFolder = zip.folder('Textures/Portraits');
  
  // Helper to format member JSON and filename as in docs
  function formatMemberForExport(member: Member) {
    // Traits as string[]
    let traitNames: string[] = Array.isArray(member.traits)
      ? member.traits.map((t: { name: string } | string) => typeof t === 'string' ? t : t.name)
      : [];
    // Ensure career stage trait is present
    const CAREER_STAGE_TRAIT_MAP: Record<string, string> = {
      early: 'EarlyCareer',
      mid: 'MidCareer',
      late: 'LateCareer',
      last_year: 'LastYear',
    };
    let careerStageTrait = '';
    if (member.careerStage && CAREER_STAGE_TRAIT_MAP[member.careerStage]) {
      careerStageTrait = CAREER_STAGE_TRAIT_MAP[member.careerStage];
    }
    if (careerStageTrait && !traitNames.includes(careerStageTrait)) {
      traitNames = [careerStageTrait, ...traitNames.filter(t => !Object.values(CAREER_STAGE_TRAIT_MAP).includes(t))];
    }
    // PortraitPath
    let portraitPath = '';
    if (member.portraitName) {
      portraitPath = `Textures/Portraits/${member.portraitName.replace(/\.png$/i, '')}.png`;
    }
    // Stats by type
    const stats: Record<string, number> = member.stats || {};
    let exportStats: Record<string, number> = {};
    if (member.type === 'driver') {
      exportStats = {
        Speed: stats.speed ?? 1,
        MaxSpeed: stats.maxSpeed ?? 1,
        Focus: stats.focus ?? 1,
        MaxFocus: stats.maxFocus ?? 1,
      };
    } else if (member.type === 'engineer') {
      exportStats = {
        Expertise: stats.expertise ?? 1,
        MaxExpertise: stats.maxExpertise ?? 1,
        Precision: stats.precision ?? 1,
        MaxPrecision: stats.maxPrecision ?? 1,
      };
    } else if (member.type === 'crew_chief') {
      exportStats = {
        Speed: stats.speed ?? 1,
        MaxSpeed: stats.maxSpeed ?? 1,
        Skill: stats.skill ?? 1,
        MaxSkill: stats.maxSkill ?? 1,
      };
    }
    // Compose export object
    const exportObj: Record<string, unknown> = {
      Name: member.name,
      Surname: member.surname,
      CountryCode: member.country,
      PortraitPath: portraitPath,
      Traits: traitNames,
      ...exportStats,
      DecadeStartContent: !!member.decadeStartContent,
    };
    // Docs-compliant filename
    const filename = `${member.name}${member.surname ? ' ' + member.surname : ''}`.trim() + '.json';
    return { exportObj, filename };
  }
  
  // OLD WAY: Process each member with inefficient portrait loading
  for (const member of members) {
    const { exportObj, filename } = formatMemberForExport(member);
    // Add to appropriate folder
    const folder = member.type === 'driver' ? driversFolder :
                  member.type === 'engineer' ? engineersFolder :
                  crewChiefsFolder;
    folder?.file(filename, JSON.stringify(exportObj, null, 2));
    
    // OLD WAY: Add portrait with inefficient loading (one DB query per member)
    if (options.includePortraits && member.portraitName) {
      const portraitFileName = `${member.portraitName.replace(/\.png$/i, '')}.png`;
      // OLD WAY: Find the portrait in IndexedDB for EACH member (inefficient)
      const portraits = await getPortraits();
      const portrait = portraits.find(p => p.name === member.portraitName);
      if (portrait && portrait.fullSizeImage) {
        // OLD WAY: Convert data URL to Blob using fetch (inefficient)
        const res = await fetch(portrait.fullSizeImage);
        const blob = await res.blob();
        portraitsFolder?.file(portraitFileName, blob);
      }
    }
  }
  
  // OLD WAY: Use default compression (slower)
  const result = await zip.generateAsync({ type: 'blob' });
  
  const exportTime = perfMonitor.endTimer('modpack-export-old');
  console.log(`OLD WAY export completed in ${exportTime.toFixed(2)}ms`);
  
  return result;
}

// Helper function for efficient data URL to blob conversion
function dataURLToBlob(dataURL: string): Promise<Blob> {
  return new Promise((resolve) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    
    resolve(new Blob([u8arr], { type: mime }));
  });
} 