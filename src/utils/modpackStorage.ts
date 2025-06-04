import { Modpack, ModpackExportOptions } from '../types/modpack';
import { Member } from './memberStorage';
import { getMembers } from './memberStorage';
import { getPortraits } from './portraitStorage';
import JSZip from 'jszip';
import { db } from './db';

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
  
  // Process each member
  for (const member of members) {
    const { exportObj, filename } = formatMemberForExport(member);
    // Add to appropriate folder
    const folder = member.type === 'driver' ? driversFolder :
                  member.type === 'engineer' ? engineersFolder :
                  crewChiefsFolder;
    folder?.file(filename, JSON.stringify(exportObj, null, 2));
    
    // Add portrait if requested
    if (options.includePortraits && member.portraitName) {
      const portraitFileName = `${member.portraitName.replace(/\.png$/i, '')}.png`;
      // Find the portrait in IndexedDB and use its fullSizeImage
      const portraits = await getPortraits();
      const portrait = portraits.find(p => p.name === member.portraitName);
      if (portrait && portrait.fullSizeImage) {
        // Convert data URL to Blob
        const res = await fetch(portrait.fullSizeImage);
        const blob = await res.blob();
        portraitsFolder?.file(portraitFileName, blob);
      }
    }
  }
  
  return await zip.generateAsync({ type: 'blob' });
} 