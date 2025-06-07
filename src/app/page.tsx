"use client";
import React, { useEffect, useState } from 'react';
import { getMembers, deleteMember, Member, saveMembersToStorage } from '../utils/memberStorage';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getPortraits } from '../utils/portraitStorage';
import { calculateMemberCost } from '@/utils/costCalculator';
import MemberTable from '../components/TeamMembers/MemberTable';
import MemberHeader from '../components/TeamMembers/MemberHeader';
import MemberModals from '../components/TeamMembers/MemberModals';
import { generateRandomPortraits } from '../utils/batchPortraitRandomizer';
import { getModpacks, saveModpack } from '../utils/modpackStorage';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Toggle } from '../components/ui/toggle';
import JSZip from 'jszip';
import { Modpack } from '../types/modpack';
import { fetchRandomTraits, RANDOM_NATIONS } from '../components/MemberCreator/MemberCreatorModern';
import { generateMemberStats } from '../utils/memberStatGenerator';
import { PortraitConfig } from '../types/portrait';
import { weightedCareerStage } from '@/utils/randomUtils';

const cardBorder = '#AA8B83';
const cardShadow = 'rgba(52, 79, 58, 0.10)';
const cardBg = '#F5F5F2';

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div
      style={{
        background: cardBg,
        border: `2px solid ${cardBorder}`,
        boxShadow: `0 4px 16px ${cardShadow}`,
        borderRadius: 18,
        paddingTop: 0,
      }}
      className="overflow-hidden flex flex-col min-h-[260px] p-0 gap-0"
    >
      <div
        style={{
          background: '#d0cdbe',
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          borderBottom: '2px solid #d1cfc7',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
        }}
        className="font-bold text-[1.18rem] text-[#222] flex items-center gap-3 font-[Figtree,Inter,sans-serif] tracking-[0.01em] justify-center text-center"
      >
        {title}
      </div>
      <div className="py-8 px-8 flex-1 flex flex-col gap-4">{children}</div>
    </div>
  );
}

async function downloadMemberJson(member: Member) {
  // Create a new ZIP file
  const zip = new JSZip();
  
  // Create directory structure
  const peopleFolder = zip.folder('Data/People');
  const typeFolder = peopleFolder?.folder(
    member.type === 'driver' ? 'Drivers' :
    member.type === 'engineer' ? 'Engineers' :
    'CrewChiefs'
  );
  const portraitsFolder = zip.folder('Textures/Portraits');

  // Map traits to string array if needed
  let traitNames = Array.isArray(member.traits)
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

  // Map portrait path
  let portraitPath = '';
  if (member.portraitName) {
    // Use the docs convention: Textures/Portraits/{portraitName}.png
    portraitPath = `Textures/Portraits/${member.portraitName.replace(/\.png$/i, '')}.png`;
  }

  // Map stats by type
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

  // Use docs-compliant filename: 'Name Surname.json' (trim, single space)
  const filename = `${member.name}${member.surname ? ' ' + member.surname : ''}`.trim() + '.json';
  
  // Add JSON file to the appropriate folder
  typeFolder?.file(filename, JSON.stringify(exportObj, null, 2));

  // Add portrait if available
  if (member.portraitName) {
    const portraits = await getPortraits();
    const portrait = portraits.find((p: { name: string }) => p.name === member.portraitName);
    if (portrait && portrait.fullSizeImage) {
      // Convert data URL to Blob
      const res = await fetch(portrait.fullSizeImage);
      const blob = await res.blob();
      const portraitFileName = `${member.portraitName.replace(/\.png$/i, '')}.png`;
      portraitsFolder?.file(portraitFileName, blob);
    }
  }

  // Generate and download the ZIP file
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${member.name}${member.surname ? ' ' + member.surname : ''}`.trim() + '.zip';
  a.click();
  URL.revokeObjectURL(url);
}

type Trait = { name: string; display_name: string; description: string };

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const router = useRouter();
  const [previewMember, setPreviewMember] = useState<Member | null>(null);
  const [previewPortraitUrl, setPreviewPortraitUrl] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showModpackDialog, setShowModpackDialog] = useState(false);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  const [modpacks, setModpacks] = useState<Modpack[]>([]);
  const [iconData, setIconData] = useState<Record<string, Record<string, { display_name: string; description: string; x: number; y: number }>> | null>(null);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomCounts, setRandomCounts] = useState({ driver: 1, engineer: 1, crew_chief: 1 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationTotal, setGenerationTotal] = useState(0);
  const [generationPhase, setGenerationPhase] = useState<'portraits' | 'saving' | null>(null);
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sorts, setSorts] = useState<Array<{ key: string, direction: 'asc' | 'desc' }>>([
    { key: 'createdAt', direction: 'desc' },
  ]);
  const [search, setSearch] = useState('');
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [modpackMemberError, setModpackMemberError] = useState<string | null>(null);

  useEffect(() => {
    refreshMembers();
    loadModpacks();
    loadIconData();
  }, []);

  async function loadModpacks() {
    const loadedModpacks = await getModpacks();
    setModpacks(loadedModpacks);
  }

  async function loadIconData() {
    try {
      const [driverResponse, engcrewResponse] = await Promise.all([
        fetch('/assets/drivers_data.json'),
        fetch('/assets/engcrew_data.json')
      ]);
      const [driverData, engcrewData] = await Promise.all([
        driverResponse.json(),
        engcrewResponse.json()
      ]);
      setIconData({ driver: driverData, engineer: engcrewData, crew_chief: engcrewData });
    } catch (error) {
      console.error('Failed to load icon data:', error);
    }
  }

  function refreshMembers() {
    getMembers().then(setMembers);
  }

  function handleAdd() {
    router.push('/members');
  }

  function handleEdit(id: string) {
    router.push(`/members?id=${id}`);
  }

  function handleDelete(id: string) {
    deleteMember(id).then(refreshMembers);
      }

  async function handlePreview(member: Member) {
    setPreviewMember(member);
    if (member.portraitName) {
      const portraits = await getPortraits();
      const portrait = portraits.find((p: { name: string }) => p.name === member.portraitName);
      setPreviewPortraitUrl(portrait?.fullSizeImage || null);
    } else {
      setPreviewPortraitUrl(null);
  }
  }

  function handleSelectMember(id: string) {
    setSelectedMembers(prev => {
      if (prev.includes(id)) {
        return prev.filter(m => m !== id);
      } else {
        return [...prev, id];
      }
    });
  }

  function handleBatchDelete() {
    setShowBatchDeleteDialog(true);
  }

  function handleAddToModpack() {
    setShowModpackDialog(true);
  }

  function handleCreateModpack(name: string, description: string) {
    // Validate for duplicate name+surname in selected members
    const selected = members.filter(m => selectedMembers.includes(m.id));
    const nameSet = new Set<string>();
    for (const m of selected) {
      const fullName = `${m.name} ${m.surname}`.trim().toLowerCase();
      if (nameSet.has(fullName)) {
        setModpackMemberError('Duplicate member names are not allowed in a modpack.');
        return;
      }
      nameSet.add(fullName);
    }
    setModpackMemberError(null);
    const newModpack: Modpack = {
      id: Math.random().toString(36).slice(2),
      name,
      description,
      members: selectedMembers,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveModpack(newModpack).then(() => {
      loadModpacks();
      setShowModpackDialog(false);
    });
  }

  function handleAddToExistingModpack(modpack: Modpack) {
    // Validate for duplicate name+surname in resulting modpack
    const allIds = [...new Set([...modpack.members, ...selectedMembers])];
    const modpackMembers = members.filter(m => allIds.includes(m.id));
    const nameSet = new Set<string>();
    for (const m of modpackMembers) {
      const fullName = `${m.name} ${m.surname}`.trim().toLowerCase();
      if (nameSet.has(fullName)) {
        setModpackMemberError('Duplicate member names are not allowed in a modpack.');
        return;
      }
      nameSet.add(fullName);
    }
    setModpackMemberError(null);
    const updatedModpack = {
      ...modpack,
      members: allIds,
    };
    saveModpack(updatedModpack).then(() => {
      loadModpacks();
      setShowModpackDialog(false);
    });
  }

  // When closing the modpack dialog, clear the error
  function handleCloseModpackDialog() {
    setShowModpackDialog(false);
    setModpackMemberError(null);
  }

  async function handleConfirmBatchDelete() {
    const allMembers = await getMembers();
    const remaining = allMembers.filter(m => !selectedMembers.includes(m.id));
    await saveMembersToStorage(remaining);
    setSelectedMembers([]);
    setShowBatchDeleteDialog(false);
    refreshMembers();
  }

  async function handleBatchGenerateMembers() {
    setShowRandomModal(false);
    const { driver, engineer, crew_chief } = randomCounts;
    let totalMembers = driver + engineer + crew_chief;
    if (totalMembers === 0) return;
    if (totalMembers > 500) totalMembers = 500;
    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationTotal(totalMembers);
    setGenerationPhase('portraits');

    // Prepare type list
    const typeList: ('driver' | 'engineer' | 'crew_chief')[] = [];
    for (let i = 0; i < driver; ++i) typeList.push('driver');
    for (let i = 0; i < engineer; ++i) typeList.push('engineer');
    for (let i = 0; i < crew_chief; ++i) typeList.push('crew_chief');
    const nats = RANDOM_NATIONS.join(',');

    // 1. Start member data pre-generation (async)
    const memberDataPromise = (async () => {
      let names: { name: { first: string; last: string }; nat: string }[] = [];
      try {
        const res = await fetch(`https://randomuser.me/api/?results=${totalMembers}&nat=${nats}&gender=male&inc=name,nat`);
        if (res.ok) {
          const data = await res.json();
          names = data.results;
        }
      } catch {}
      const arr: Array<{
        type: 'driver' | 'engineer' | 'crew_chief';
        name: string;
        surname: string;
        country: string;
        careerStage: string;
        statGenType: string;
        traits: Trait[];
        stats: Record<string, number>;
        decadeStartContent: boolean;
      }> = [];
      for (let i = 0; i < totalMembers; ++i) {
        const type = typeList[i];
        const nameObj = names[i];
        const traits = await fetchRandomTraits(type);
        // Determine trait for stat generation
        let statTrait: 'none' | 'privateer' | 'rich' = 'none';
        if (type === 'driver') {
          const traitNames = (traits || []).map((t: Trait) => t.name);
          if (traitNames.includes('Privateer')) statTrait = 'privateer';
          else if (traitNames.includes('RichParents')) statTrait = 'rich';
        }
        const statGenType = type === 'crew_chief' ? 'chief' : type;
        const stats = generateMemberStats(statGenType, statTrait);
        // DecadeStartContent probability by type
        let decadeStartContent = false;
        if (type === 'driver') decadeStartContent = Math.random() < 0.1871;
        else if (type === 'engineer') decadeStartContent = Math.random() < 0.3333;
        else if (type === 'crew_chief') decadeStartContent = Math.random() < 0.3333;
        // Filter career stages if decadeStartContent is false
        const careerStage = weightedCareerStage(type);
        arr.push({
          type,
          name: nameObj?.name?.first || 'Random',
          surname: nameObj?.name?.last || Math.random().toString(36).slice(2, 7),
          country: nameObj?.nat || RANDOM_NATIONS[Math.floor(Math.random() * RANDOM_NATIONS.length)],
          careerStage,
          statGenType,
          traits,
          stats,
          decadeStartContent,
        });
      }
      return arr;
    })();

    // 2. Start portrait generation (async, streaming progress)
    let portraitProgress = 0;
    const portraits: PortraitConfig[] = [];
    await new Promise<void>(resolve => {
      generateRandomPortraits(totalMembers, async (portrait) => {
        portraits.push(portrait);
        portraitProgress++;
        setGenerationStep(portraitProgress);
        if (portraitProgress === totalMembers) resolve();
      });
    });

    // 3. Wait for member data to finish
    const memberData = await memberDataPromise;

    // 4. Assign portraits to members by index
    setGenerationPhase('saving');
    setGenerationStep(0);
    setGenerationTotal(totalMembers);
    const newMembers: Member[] = [];
    for (let i = 0; i < totalMembers; ++i) {
      const data = memberData[i];
      const portrait = portraits[i];
      newMembers.push({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        name: data.name,
        surname: data.surname,
        country: data.country,
        careerStage: data.careerStage,
        portraitName: portrait.name,
        traits: data.traits,
        stats: data.stats,
        cost: 0,
        type: data.type,
        decadeStartContent: data.decadeStartContent,
        createdAt: Date.now(),
      });
    }

    // 5. Save all new members in a single batch, with progress
    const existing = await getMembers();
    for (let i = 0; i < newMembers.length; ++i) {
      setGenerationStep(i + 1);
      // For streaming UI, update the list as we go
      setMembers(m => [...m, newMembers[i]]);
    }
    await saveMembersToStorage([...existing, ...newMembers]);
    setIsGenerating(false);
    setGenerationPhase(null);
  }

  // Sorting logic
  function getSortValue(member: Member, key: string) {
    if (key === 'createdAt') return member.createdAt || 0;
    if (key === 'name') return (member.name + ' ' + member.surname).toLowerCase();
    if (key === 'country') return (member.country || '').toLowerCase();
    if (key === 'type') return member.type;
    if (key === 'cost') return calculateMemberCost(member.type, member.stats, member.traits);
    return '';
  }

  // Advanced search/filter logic
  function memberMatchesSearch(member: Member, search: string): boolean {
    if (!search.trim()) return true;
    const lower = search.toLowerCase();
    // Extract trait search: [trait1,trait2,...]
    const traitMatch = lower.match(/\[([^\]]+)\]/);
    let traitList: string[] = [];
    if (traitMatch) {
      traitList = traitMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      search = lower.replace(traitMatch[0], '').trim();
    }
    // Extract nation/nationality
    const nation = lower.match(/(?:nation|nationality):([\w\s]+)/)?.[1].trim();
    if (nation) {
      search = search.replace(/(?:nation|nationality):([\w\s]+)/, '').trim();
    }
    // Extract type
    const type = lower.match(/type:([\w_]+)/)?.[1].trim();
    if (type) {
      search = search.replace(/type:([\w_]+)/, '').trim();
    }
    // Remaining is general search
    const general = search.trim();
    // Check traits (OR)
    if (traitList.length > 0) {
      const memberTraitNames = (member.traits || []).map((t: { name: string } | string) => typeof t === 'string' ? t.toLowerCase() : (t.name || '').toLowerCase());
      if (!traitList.some(tr => memberTraitNames.includes(tr))) return false;
    }
    // Check nation
    if (nation) {
      const memberCountry = (member.country || '').toLowerCase();
      if (!memberCountry.includes(nation)) return false;
    }
    // Check type
    if (type) {
      if ((member.type || '').toLowerCase() !== type) return false;
    }
    // Fuzzy/near match for general
    if (general) {
      const fields = [member.name, member.surname, member.country, member.type].map(f => (f || '').toLowerCase());
      if (!fields.some(f => f.includes(general) || fuzzyNearMatch(f, general))) return false;
    }
    return true;
  }

  // Simple fuzzy/near match: allow 1 char difference or transposition
  function fuzzyNearMatch(a: string, b: string): boolean {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    // Levenshtein distance 1 or less
    let mismatches = 0, i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      mismatches++;
      if (mismatches > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return true;
  }

  const filteredMembers = members.filter(m => memberMatchesSearch(m, search));
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    for (const { key, direction } of sorts) {
      const aVal = getSortValue(a, key);
      const bVal = getSortValue(b, key);
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / rowsPerPage));
  const pagedMembers = sortedMembers;

  // Handle sort
  function handleSort(key: string, event?: React.MouseEvent) {
    setCurrentPage(1);
    setSorts(prev => {
      const idx = prev.findIndex(s => s.key === key);
      const isShift = event && event.shiftKey;
      if (!isShift) {
        // Single sort: set as primary, toggle direction if already primary
        if (idx === 0) {
          // Toggle direction
          const newDir = prev[0].direction === 'asc' ? 'desc' : 'asc';
          return [{ key, direction: newDir }];
        } else {
          return [{ key, direction: 'asc' }];
        }
      } else {
        // Multi-sort: add or toggle/remove
        if (idx === -1) {
          return [...prev, { key, direction: 'asc' }];
        } else {
          // Toggle direction or remove if already desc
          const newSorts = [...prev];
          if (newSorts[idx].direction === 'asc') {
            newSorts[idx].direction = 'desc';
          } else {
            newSorts.splice(idx, 1);
          }
          return newSorts;
        }
      }
    });
  }

  // Handle page change
  function handlePageChange(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  // Handle rows per page change
  function handleRowsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }

  return (
    <div
      style={{
        fontFamily: 'Figtree, Inter, sans-serif',
        background: 'linear-gradient(180deg, #edeafc 0%, #e7e4d4 100%)',
        color: '#333',
        minHeight: '100vh',
      }}
      className="flex flex-col min-h-screen"
    >
      <header className="w-full py-6 flex flex-col items-center mb-8 relative">
        <Image src="/assets/GLLogo_New.png" alt="Golden Lap Logo" width={180} height={64} style={{ maxHeight: 64, width: 'auto', marginBottom: 8 }} />
        <h2 className="text-xl text-gray-600 font-bold tracking-wide font-[Figtree,Inter,sans-serif]">Team Member Manager</h2>
      </header>
      <main className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-[1100px] flex flex-col gap-8 px-4 items-stretch h-full min-h-0">
          <Card title="Team Members">
            <MemberHeader
              onAdd={handleAdd}
              onAddToModpack={handleAddToModpack}
              onBatchDelete={handleBatchDelete}
              onGenerateRandom={() => setShowRandomModal(true)}
              selectedCount={selectedMembers.length}
            />
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members... (e.g. nation:us type:driver [aggressive,fast])"
                className="border rounded p-2 w-full max-w-md"
                style={{ fontSize: 16 }}
              />
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  aria-label="Help"
                  style={{
                    background: '#ece9e2',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    fontWeight: 700,
                    fontSize: 18,
                    color: '#b92d2a',
                    cursor: 'pointer',
                    marginLeft: 4,
                  }}
                  onMouseEnter={() => setShowSearchHelp(true)}
                  onMouseLeave={() => setShowSearchHelp(false)}
                  onFocus={() => setShowSearchHelp(true)}
                  onBlur={() => setShowSearchHelp(false)}
                  onClick={() => setShowSearchHelp(v => !v)}
                >
                  ?
                </button>
                {showSearchHelp && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '110%',
                      top: 0,
                      zIndex: 10,
                      background: '#fff',
                      color: '#333',
                      border: '1px solid #d1cfc7',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(52,79,58,0.10)',
                      padding: '12px 16px',
                      minWidth: 260,
                      fontSize: 15,
                      fontFamily: 'Figtree, Inter, sans-serif',
                    }}
                  >
                    <strong>Advanced Search Tips:</strong><br />
                    <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
                      <li><b>nation:</b> or <b>nationality:</b> <i>us</i> — filter by country code/name</li>
                      <li><b>type:</b> <i>driver</i> — filter by member type</li>
                      <li><b>[trait1,trait2]</b> — match any listed trait (OR search)</li>
                      <li>General text matches name, surname, country, type (fuzzy)</li>
                      <li>Combine: <code>nation:us type:driver [aggressive,fast]</code></li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <MemberTable
              members={pagedMembers}
              selectedMembers={selectedMembers}
              onSelectMember={handleSelectMember}
              onSelectAll={(selected) => {
                if (selected) {
                              setSelectedMembers(members.map(m => m.id));
                            } else {
                              setSelectedMembers([]);
                            }
                          }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPreview={handlePreview}
              onDownload={downloadMemberJson}
              iconData={iconData || {}}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              sorts={sorts}
              onSort={handleSort}
            />

            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                          <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-[#ece9e2] text-[#333] disabled:opacity-50"
                          >
                  First
                          </button>
                          <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-[#ece9e2] text-[#333] disabled:opacity-50"
                          >
                  Prev
                          </button>
                {/* Page numbers with ellipsis */}
                {(() => {
                  const pages = [];
                  const maxPageButtons = 7;
                  let start = Math.max(1, currentPage - 2);
                  let end = Math.min(totalPages, currentPage + 2);
                  if (totalPages > maxPageButtons) {
                    if (currentPage <= 4) {
                      start = 1;
                      end = maxPageButtons - 2;
                    } else if (currentPage >= totalPages - 3) {
                      start = totalPages - (maxPageButtons - 3);
                      end = totalPages;
                    }
                  } else {
                    start = 1;
                    end = totalPages;
                  }
                  if (start > 1) {
                    pages.push(
                      <button key={1} onClick={() => handlePageChange(1)} className={`px-2 py-1 rounded ${currentPage === 1 ? 'bg-[#fd655c] text-white' : 'bg-[#ece9e2] text-[#333]'}`}>1</button>
                    );
                    if (start > 2) pages.push(<span key="start-ellipsis">...</span>);
                  }
                  for (let i = start; i <= end; ++i) {
                    pages.push(
                          <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-2 py-1 rounded ${currentPage === i ? 'bg-[#fd655c] text-white' : 'bg-[#ece9e2] text-[#333]'}`}
                        style={{ fontWeight: currentPage === i ? 700 : 400 }}
                          >
                        {i}
                          </button>
                    );
                  }
                  if (end < totalPages) {
                    if (end < totalPages - 1) pages.push(<span key="end-ellipsis">...</span>);
                    pages.push(
                      <button key={totalPages} onClick={() => handlePageChange(totalPages)} className={`px-2 py-1 rounded ${currentPage === totalPages ? 'bg-[#fd655c] text-white' : 'bg-[#ece9e2] text-[#333]'}`}>{totalPages}</button>
                    );
                  }
                  return pages;
                })()}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-[#ece9e2] text-[#333] disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-[#ece9e2] text-[#333] disabled:opacity-50"
                >
                  Last
                </button>
              </div>
              <div>
                <label className="mr-2">Rows per page:</label>
                <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="border rounded p-1">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <MemberModals
              previewMember={previewMember}
              previewPortraitUrl={previewPortraitUrl}
              onClosePreview={() => setPreviewMember(null)}
              showModpackDialog={showModpackDialog}
              onCloseModpackDialog={handleCloseModpackDialog}
              onCreateModpack={handleCreateModpack}
              modpacks={modpacks}
              onAddToExistingModpack={handleAddToExistingModpack}
              showBatchDeleteDialog={showBatchDeleteDialog}
              onCloseBatchDeleteDialog={() => setShowBatchDeleteDialog(false)}
              onConfirmBatchDelete={handleConfirmBatchDelete}
              modpackMemberError={modpackMemberError}
            />

            {showRandomModal && (
              <Dialog open={showRandomModal} onOpenChange={setShowRandomModal}>
                <DialogContent
                  style={{
                    background: cardBg,
                    border: 'none',
                    borderRadius: 22,
                    boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
                    fontFamily: 'Figtree, Inter, sans-serif',
                    maxWidth: 380,
                    width: '100%',
                    boxSizing: 'border-box',
                    overflow: 'visible',
                    padding: 0,
                  }}
                >
                  <DialogTitle asChild>
                    <div style={{ background: '#ece9e2', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottom: '1.5px solid #e0ded9', width: '100%', textAlign: 'center', padding: '18px 0 12px 0', fontWeight: 800, fontSize: '1.18rem', color: '#222', letterSpacing: '0.01em' }}>
                      Generate Random Members
                    </div>
                  </DialogTitle>
                  {/* Close X button */}
                  <button
                    onClick={() => setShowRandomModal(false)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#fd655c',
                      border: '2px solid #fff',
                      borderRadius: '50%',
                      width: 34,
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: '#fff',
                      fontWeight: 900,
                      zIndex: 20,
                      boxShadow: '0 2px 8px rgba(214, 72, 67, 0.13)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    aria-label="Close"
                    onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#b92d2a')}
                    onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#fd655c')}
                  >
                    ×
                  </button>
                  <form
                    onSubmit={e => { e.preventDefault(); handleBatchGenerateMembers(); }}
                    className="flex flex-col gap-4"
                    style={{ padding: '28px 32px 18px 32px', background: cardBg, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}
                  >
                    <label className="flex flex-col gap-1">
                      <span style={{ color: '#222', fontWeight: 500 }}>Drivers</span>
                      <input
                        type="number"
                        min={0}
                        value={randomCounts.driver}
                        onChange={e => {
                          let val = Math.max(0, Number(e.target.value));
                          const total = val + randomCounts.engineer + randomCounts.crew_chief;
                          if (total > 500) val = Math.max(0, 500 - randomCounts.engineer - randomCounts.crew_chief);
                          setRandomCounts(c => ({ ...c, driver: val }));
                        }}
                        className="border rounded p-2"
                        style={{ fontSize: 16, color: '#222', background: '#fff' }}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span style={{ color: '#222', fontWeight: 500 }}>Engineers</span>
                      <input
                        type="number"
                        min={0}
                        value={randomCounts.engineer}
                        onChange={e => {
                          let val = Math.max(0, Number(e.target.value));
                          const total = randomCounts.driver + val + randomCounts.crew_chief;
                          if (total > 500) val = Math.max(0, 500 - randomCounts.driver - randomCounts.crew_chief);
                          setRandomCounts(c => ({ ...c, engineer: val }));
                        }}
                        className="border rounded p-2"
                        style={{ fontSize: 16, color: '#222', background: '#fff' }}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span style={{ color: '#222', fontWeight: 500 }}>Crew Chiefs</span>
                      <input
                        type="number"
                        min={0}
                        value={randomCounts.crew_chief}
                        onChange={e => {
                          let val = Math.max(0, Number(e.target.value));
                          const total = randomCounts.driver + randomCounts.engineer + val;
                          if (total > 500) val = Math.max(0, 500 - randomCounts.driver - randomCounts.engineer);
                          setRandomCounts(c => ({ ...c, crew_chief: val }));
                        }}
                        className="border rounded p-2"
                        style={{ fontSize: 16, color: '#222', background: '#fff' }}
                      />
                    </label>
                    <div className="text-sm mt-2" style={{ color: '#222' }}>
                      Total: {randomCounts.driver + randomCounts.engineer + randomCounts.crew_chief} / 500
                      {(randomCounts.driver + randomCounts.engineer + randomCounts.crew_chief) === 500 && (
                        <span style={{ color: '#fd655c', marginLeft: 8 }}>(Maximum reached)</span>
                      )}
                    </div>
                    <DialogFooter className="mt-6">
                      <Toggle
                        type="submit"
                        className="!bg-[#fd655c] !text-white !border-[#fd655c] hover:!bg-[#b92d2a] hover:!border-[#b92d2a]"
                        style={{ minWidth: 120, fontSize: 17, fontWeight: 700 }}
                      >
                        Generate
                      </Toggle>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </Card>
        </div>
        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              style={{
                background: cardBg,
                border: `2px solid ${cardBorder}`,
                borderRadius: 22,
                boxShadow: `0 6px 32px ${cardShadow}`,
                fontFamily: 'Figtree, Inter, sans-serif',
                minWidth: 320,
                maxWidth: 380,
                width: '100%',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Section header bar */}
              <div style={{
                background: '#ece9e2',
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                borderBottom: '1.5px solid #e0ded9',
                width: '100%',
                textAlign: 'center',
                padding: '18px 0 12px 0',
                fontWeight: 800,
                fontSize: '1.18rem',
                color: '#222',
                letterSpacing: '0.01em',
              }}>
                {generationPhase === 'portraits' ? 'Generating Portraits...' : 'Saving Members...'}
              </div>
              <div style={{ padding: '32px 36px 24px 36px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, background: cardBg }}>
                {/* Custom progress bar styled like the game's performance/reliability bars */}
                <div style={{
                  width: '100%',
                  maxWidth: 260,
                  height: 22,
                  background: '#f3f3e7',
                  borderRadius: 12,
                  border: '1.5px solid #bdb9a7',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  marginBottom: 12,
                  position: 'relative',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round((generationStep / (generationTotal || 1)) * 100)}%`,
                    background: '#009a4f',
                    borderRadius: 12,
                    transition: 'width 0.3s cubic-bezier(.4,1.6,.6,1)',
                  }} />
                      </div>
                <div className="text-sm" style={{ color: '#222', marginTop: 2, textAlign: 'center' }}>
                  {generationStep} of {generationTotal} complete
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
