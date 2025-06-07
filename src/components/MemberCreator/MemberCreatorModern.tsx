"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import PortraitSelectionModal from '../Portraits/PortraitSelectionModal';
import { PortraitConfig } from '@/types/portrait';
import { addOrUpdatePortrait, getPortraits } from '@/utils/portraitStorage';
import { Combobox, ComboboxOption } from '../ui/combobox';
import TraitsSection from '../Traits/TraitsSection';
import MemberPreviewModal from './MemberPreviewModal';
import { saveMember } from '@/utils/memberStorage';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { generateMemberStats } from '../../utils/memberStatGenerator';
import { codeToFlagCdn } from '@/utils/flagUtils';
import { weightedCareerStage } from '@/utils/randomUtils';
import { StatsSection } from './StatsSection';
import { InformationSection } from './InformationSection';
import { calculateMemberCost } from '@/utils/costCalculator';
import { PortraitSelector } from './PortraitSelector';

const memberTypes = [
  { value: 'driver', label: 'Driver' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'crew_chief', label: 'Crew Chief' },
];

const careerStages = [
  { value: '', label: 'Select career stage' },
  { value: 'early', label: 'Early Career' },
  { value: 'mid', label: 'Mid Career' },
  { value: 'late', label: 'Late Career' },
  { value: 'last_year', label: 'Last Year' },
];

function NationalityCombobox({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [countryList, setCountryList] = React.useState<ComboboxOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchCountries() {
      try {
        const res = await fetch('/data/codes.json');
        if (!res.ok) throw new Error('Failed to fetch countries');
        const data = await res.json();
        if (!isMounted) return;
        const arr = Object.entries(data).map(([label, code]) => ({
          value: String(code),
          label: label.replace(/_/g, ' '),
          iconUrl: `https://flagcdn.com/${codeToFlagCdn(String(code))}.svg`,
        }));
        arr.sort((a, b) => a.label.localeCompare(b.label));
        setCountryList(arr);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load countries');
        setLoading(false);
      }
    }
    fetchCountries();
    return () => { isMounted = false; };
  }, []);

  const renderOption = React.useCallback((option: ComboboxOption, selected: boolean) => (
    <>
      {option.iconUrl && (
        <Image 
          src={option.iconUrl} 
          alt={option.label} 
          width={24} 
          height={16} 
          className="w-6 h-4 rounded mr-2"
          loading="lazy"
        />
      )}
      <span>{option.label}</span>
      {selected && <span className="ml-auto text-coral-500 font-bold">✓</span>}
    </>
  ), []);

  const renderValue = React.useCallback((option: ComboboxOption | undefined) =>
    option ? (
      <span className="flex items-center gap-2">
        {option.iconUrl && (
          <Image 
            src={option.iconUrl} 
            alt={option.label} 
            width={24} 
            height={16} 
            className="w-6 h-4 rounded"
            loading="lazy"
          />
        )}
        <span>{option.label}</span>
      </span>
    ) : (
      <span className="text-gray-400">{loading ? 'Loading...' : error || 'Select nationality'}</span>
    )
  , [loading, error]);

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <Combobox
      options={countryList}
      value={value}
      onChange={onChange}
      placeholder={loading ? 'Loading...' : 'Select nationality'}
      renderOption={renderOption}
      renderValue={renderValue}
      ariaLabel="Nationality"
      ariaDescription="Select a nationality from the list"
    />
  );
}

interface TraitType {
  name: string;
  description: string;
  display_name: string;
}

// Reusable Button component (legacy/portrait style)
function Button({ children, onClick, type = 'button', style = {}, className = '', disabled = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`font-bold font-[Figtree,Inter,sans-serif] text-lg px-8 py-2 rounded-full transition-all shadow ${className}`}
      style={{
        background: disabled ? '#ece9e2' : '#fd655c',
        color: disabled ? '#999' : '#fff',
        border: 'none',
        borderRadius: 999,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)',
        marginTop: 0,
        marginBottom: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'center',
        minWidth: 180,
        fontSize: '1.1rem',
        opacity: disabled ? 0.7 : 1,
        transition: 'background-color 0.15s ease-in-out, opacity 0.15s ease-in-out',
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
      <style jsx>{`
        button:not(:disabled):hover {
          background-color: #b92d2a !important;
        }
      `}</style>
    </button>
  );
}

interface MemberCreatorModernProps {
  initialValues?: Partial<{
    id: string;
    name: string;
    surname: string;
    country: string;
    type: 'driver' | 'engineer' | 'crew_chief';
    careerStage: string;
    portraitName: string;
    traits: TraitType[];
    stats: Record<string, number>;
    cost: number;
    decadeStartContent: boolean;
    createdAt?: number;
  }>;
}

const RANDOM_NATIONS = [
  'AU', 'BR', 'CA', 'CH', 'DE', 'DK', 'ES', 'FI', 'FR', 'GB', 'IE', 'IN', 'MX', 'NL', 'NO', 'NZ', 'RS', 'TR', 'UA', 'US'
];
const CAREER_STAGES = ['early', 'mid', 'late', 'last_year'];

async function fetchRandomName(nat: string) {
  const res = await fetch(`https://randomuser.me/api/?gender=male&nat=${nat.toLowerCase()}`);
  const data = await res.json();
  const user = data.results[0];
  return {
    name: user.name.first,
    surname: user.name.last,
  };
}

// Helper for weighted random selection (for trait count)
function weightedRandom(table: { value: number, weight: number }[]): number {
  const total = table.reduce((sum, { weight }) => sum + weight, 0);
  let r = Math.random() * total;
  for (const { value, weight } of table) {
    if (r < weight) return value;
    r -= weight;
  }
  return table[table.length - 1].value;
}

async function fetchRandomTraits(type: 'driver' | 'engineer' | 'crew_chief') {
  const traitFiles = {
    driver: '/data/traits/driver_traits.json',
    engineer: '/data/traits/engineer_traits.json',
    crew_chief: '/data/traits/crew_chief_traits.json',
  };
  const genericTraits: TraitType[] = await fetch('/data/traits/generic_traits.json').then(r => r.json());
  const typeTraits: TraitType[] = await fetch(traitFiles[type]).then(r => r.json());
  // Filter out career stage traits
  const CAREER_STAGE_TRAITS = ['EarlyCareer', 'MidCareer', 'LateCareer', 'LastYear'];
  let allTraits: TraitType[] = [...typeTraits, ...genericTraits].filter(trait => !CAREER_STAGE_TRAITS.includes(trait.name));

  // Trait count probability tables
  const traitCountTables: Record<string, { value: number, weight: number }[]> = {
    crew_chief: [
      { value: 1, weight: 0.2222 },
      { value: 2, weight: 0.7040 },
      { value: 3, weight: 0.0638 },
    ],
    driver: [
      { value: 0, weight: 0.0072 },
      { value: 1, weight: 0.0432 },
      { value: 2, weight: 0.4016 },
      { value: 3, weight: 0.3957 },
      { value: 4, weight: 0.0863 },
      { value: 5, weight: 0.0660 },
    ],
    engineer: [
      { value: 1, weight: 0.2444 },
      { value: 2, weight: 0.5822 },
      { value: 3, weight: 0.1111 },
      { value: 4, weight: 0.0622 },
    ],
  };

  if (type === 'driver') {
    const hasPrivateer = allTraits.find(t => t.name === 'Privateer');
    const hasRichParents = allTraits.find(t => t.name === 'RichParents');
    // Remove both from the pool for now
    allTraits = allTraits.filter(t => t.name !== 'Privateer' && t.name !== 'RichParents');
    let specialTrait: TraitType | null = null;
    if (Math.random() < 0.3597) {
      // 0.7 chance for RichParents, 0.3 for Privateer
      if (Math.random() < 0.7) specialTrait = hasRichParents ?? null;
      else specialTrait = hasPrivateer ?? null;
    }
    const count = weightedRandom(traitCountTables.driver);
    const shuffled = [...allTraits].sort(() => 0.5 - Math.random());
    let traits = shuffled.slice(0, count);
    if (specialTrait) traits = [specialTrait, ...traits].slice(0, count); // Max 5 traits
    return traits;
  } else if (type === 'engineer') {
    const count = weightedRandom(traitCountTables.engineer);
    const shuffled = [...allTraits].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } else if (type === 'crew_chief') {
    const count = weightedRandom(traitCountTables.crew_chief);
    const shuffled = [...allTraits].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  return [];
}

export default function MemberCreatorModern({ initialValues }: MemberCreatorModernProps = {}) {
  const [type, setType] = useState<'driver' | 'engineer' | 'crew_chief'>(initialValues?.type || 'driver');
  const [careerStage, setCareerStage] = useState(initialValues?.careerStage || '');
  const [name, setName] = useState(initialValues?.name || '');
  const [surname, setSurname] = useState(initialValues?.surname || '');
  const [country, setCountry] = useState(initialValues?.country || '');
  const [portrait, setPortrait] = useState(initialValues?.portraitName || '');
  const [portraitPreviewUrl, setPortraitPreviewUrl] = useState<string | null>(null);
  const [decadeStartContent, setDecadeStartContent] = useState(initialValues?.decadeStartContent || false);
  const [selectedTraits, setSelectedTraits] = useState<TraitType[]>(
    Array.isArray(initialValues?.traits) && typeof initialValues.traits[0] !== 'string'
      ? initialValues?.traits || []
      : []
  );
  const [stats, setStats] = useState<Record<string, number>>(initialValues?.stats || {});

  // Portrait modal state
  const [portraitModalOpen, setPortraitModalOpen] = useState(false);
  const [portraitConfig, setPortraitConfig] = useState<PortraitConfig | undefined>(undefined);

  // Synchronize all fields with initialValues when it changes
  useEffect(() => {
    if (!initialValues) return;
    setType(initialValues.type || 'driver');
    setCareerStage(initialValues.careerStage || '');
    setName(initialValues.name || '');
    setSurname(initialValues.surname || '');
    setCountry(initialValues.country || '');
    setPortrait(initialValues.portraitName || '');
    setDecadeStartContent(initialValues.decadeStartContent || false);
    setStats(initialValues.stats || {});
    // For traits, preserve the logic you already have:
    if (Array.isArray(initialValues.traits) && typeof initialValues.traits[0] !== 'string') {
      setSelectedTraits(initialValues.traits || []);
    }
  }, [initialValues]);

  // Placeholder stats for each type
  const statFields = {
    driver: [
      { key: 'speed', label: 'Speed' },
      { key: 'maxSpeed', label: 'Max Speed' },
      { key: 'focus', label: 'Focus' },
      { key: 'maxFocus', label: 'Max Focus' },
    ],
    engineer: [
      { key: 'expertise', label: 'Expertise' },
      { key: 'maxExpertise', label: 'Max Expertise' },
      { key: 'precision', label: 'Precision' },
      { key: 'maxPrecision', label: 'Max Precision' },
    ],
    crew_chief: [
      { key: 'speed', label: 'Speed' },
      { key: 'maxSpeed', label: 'Max Speed' },
      { key: 'skill', label: 'Skill' },
      { key: 'maxSkill', label: 'Max Skill' },
    ],
  };

  function handleStatChange(key: string, delta: number) {
    setStats(s => {
      const next = { ...s };
      const isMax = key.startsWith('max');
      if (isMax) {
        const baseKey = getBaseKey(key);
        const baseVal = s[baseKey] || 1;
        next[key] = Math.max(baseVal, Math.min(10, (s[key] || baseVal) + delta));
      } else {
        next[key] = Math.max(1, Math.min(10, (s[key] || 1) + delta));
        // If base stat increased above max, auto-increase max
        const maxKey = getMaxKey(key);
        if (maxKey && next[key] > (s[maxKey] || 1)) {
          next[maxKey] = next[key];
        }
      }
      return next;
    });
  }

  // --- Stat helpers for dot click and max stat sync ---
  function getMaxKey(key: string) {
    if (key.startsWith('max')) return key;
    if (key === 'speed') return 'maxSpeed';
    if (key === 'focus') return 'maxFocus';
    if (key === 'expertise') return 'maxExpertise';
    if (key === 'precision') return 'maxPrecision';
    if (key === 'skill') return 'maxSkill';
    return '';
  }
  function getBaseKey(key: string) {
    if (!key.startsWith('max')) return key;
    if (key === 'maxSpeed') return 'speed';
    if (key === 'maxFocus') return 'focus';
    if (key === 'maxExpertise') return 'expertise';
    if (key === 'maxPrecision') return 'precision';
    if (key === 'maxSkill') return 'skill';
    return '';
  }

  // Handle portrait selection
  function handlePortraitClick() {
    setPortraitModalOpen(true);
  }

  // Handle portrait selection from modal
  async function handlePortraitSelect(portraitObj: PortraitConfig) {
    await addOrUpdatePortrait(portraitObj);
    setPortrait(portraitObj.name);
    setPortraitConfig(portraitObj);
    setPortraitPreviewUrl(portraitObj.fullSizeImage || portraitObj.thumbnail);
  }

  // Update preview when portrait changes
  useEffect(() => {
    if (portrait) {
      let cancelled = false;
      (async () => {
        const portraits = await getPortraits();
        if (cancelled) return;
        const found = portraits.find((p: PortraitConfig) => p.name === portrait);
        if (found) setPortraitPreviewUrl(found.fullSizeImage || found.thumbnail);
        else setPortraitPreviewUrl(null);
      })();
      return () => { cancelled = true; };
    } else {
      setPortraitPreviewUrl(null);
    }
  }, [portrait]);

  // Clear selected traits when member type changes
  useEffect(() => {
    setSelectedTraits([]);
  }, [type]);

  // Calculate cost live
  const memberCost = useMemo(() => calculateMemberCost(type, stats, selectedTraits), [type, stats, selectedTraits]);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const router = useRouter();

  async function validateMember() {
    // Name and surname required
    if (!name.trim()) return 'Name is required.';
    if (!surname.trim()) return 'Surname is required.';
    // Country required
    if (!country || country.length !== 2) return 'A valid country is required.';
    // Portrait required
    if (!portrait) return 'A portrait must be selected.';
    // Career stage required
    if (!careerStage) return 'Career stage is required.';
    // Traits: no duplicates
    const traitNames = selectedTraits.map(t => t.name);
    if (new Set(traitNames).size !== traitNames.length) return 'Duplicate traits are not allowed.';
    // Traits: max 6
    if (selectedTraits.length > 6) return 'A maximum of 6 traits is allowed.';
    // Stats: all required and 1-10
    const requiredStats = type === 'driver'
      ? ['speed', 'maxSpeed', 'focus', 'maxFocus']
      : type === 'engineer'
      ? ['expertise', 'maxExpertise', 'precision', 'maxPrecision']
      : ['speed', 'maxSpeed', 'skill', 'maxSkill'];
    for (const stat of requiredStats) {
      const val = stats[stat];
      if (typeof val !== 'number' || val < 1 || val > 10) {
        return `All stats must be set between 1 and 10. (${stat})`;
      }
    }
    // DecadeStartContent must be set (true/false)
    if (typeof decadeStartContent !== 'boolean') return '1st Season availability must be set.';
    return null;
  }

  async function handlePreviewClick() {
    const error = await validateMember();
    if (error) {
      toast.error(error);
      return;
    }
    setPreviewModalOpen(true);
  }

  // Handler for confirming in the preview modal
  function handleConfirm() {
    // Compose the member object
    const member = {
      id: initialValues?.id || (Date.now().toString(36) + Math.random().toString(36).slice(2)),
      name,
      surname,
      country,
      careerStage,
      portraitName: portrait,
      traits: selectedTraits,
      stats,
      cost: memberCost,
      type,
      decadeStartContent,
      createdAt: initialValues?.createdAt || Date.now(),
    };
    saveMember(member);
    router.push('/');
  }

  // Ensure all required stat keys are present in stats (default to 1)
  useEffect(() => {
    const requiredStats = type === 'driver'
      ? ['speed', 'maxSpeed', 'focus', 'maxFocus']
      : type === 'engineer'
      ? ['expertise', 'maxExpertise', 'precision', 'maxPrecision']
      : ['speed', 'maxSpeed', 'skill', 'maxSkill'];
    let needsUpdate = false;
    const next = { ...stats };
    for (const stat of requiredStats) {
      if (typeof next[stat] !== 'number' || next[stat] < 1 || next[stat] > 10) {
        next[stat] = 1;
        needsUpdate = true;
      }
    }
    if (needsUpdate) setStats(next);
  }, [type, stats]);

  async function handleRandomMember() {
    // Reset all parameters before randomizing
    setName('');
    setSurname('');
    setCountry('');
    setDecadeStartContent(false);
    setStats({});
    setSelectedTraits([]);
    setPortrait('');
    setPortraitPreviewUrl(null);
    setPortraitConfig(undefined);

    const country = RANDOM_NATIONS[Math.floor(Math.random() * RANDOM_NATIONS.length)];
    let decadeStartContent = false;
    if (type === 'driver') decadeStartContent = Math.random() < 0.1871;
    else if (type === 'engineer') decadeStartContent = Math.random() < 0.3333;
    else if (type === 'crew_chief') decadeStartContent = Math.random() < 0.3333;
    const careerStage = weightedCareerStage(type);
    const traits: TraitType[] = await fetchRandomTraits(type);
    // Fetch random name from API
    let randomName = { name: '', surname: '' };
    try {
      randomName = await fetchRandomName(country);
    } catch {
      // fallback: use empty strings if API fails
      randomName = { name: '', surname: '' };
    }
    let statTrait: 'none' | 'privateer' | 'rich' = 'none';
    if (type === 'driver') {
      const traitNames = (traits || []).map((t: TraitType) => t.name);
      if (traitNames.includes('Privateer')) statTrait = 'privateer';
      else if (traitNames.includes('RichParents')) statTrait = 'rich';
    }
    const stats = generateMemberStats(type === 'crew_chief' ? 'chief' : type, statTrait);
    setName(randomName.name);
    setSurname(randomName.surname);
    setCountry(country);
    setCareerStage(careerStage);
    setDecadeStartContent(decadeStartContent);
    setStats(stats);
    setSelectedTraits(traits);
    // Don't set portraitName
  }

  return (
    <>
      <PortraitSelectionModal
        isOpen={portraitModalOpen}
        onClose={() => setPortraitModalOpen(false)}
        onSelect={handlePortraitSelect}
      />
      <MemberPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        name={name}
        surname={surname}
        country={country}
        careerStage={careerStage}
        portraitUrl={portraitPreviewUrl}
        portraitName={portraitConfig?.name}
        traits={selectedTraits}
        stats={stats}
        cost={memberCost}
        type={type}
        decadeStartContent={decadeStartContent}
        onConfirm={handleConfirm}
        confirmText="Confirm/Save"
      />
      <div
        style={{
          fontFamily: 'Figtree, Inter, sans-serif',
          background: 'linear-gradient(180deg, #edeafc 0%, #e7e4d4 100%)',
          color: '#333',
          minHeight: '100vh',
        }}
        className="flex flex-col"
      >
        <header className="w-full py-6 flex flex-col items-center mb-8 relative">
          <Image src="/assets/GLLogo_New.png" alt="Golden Lap Logo" width={256} height={64} style={{ maxHeight: 64, width: 'auto', marginBottom: 8 }} />
          <h2 className="text-xl text-gray-600 font-bold tracking-wide font-[Figtree,Inter,sans-serif]">Team Member Creator</h2>
        </header>
        <main className="flex-1 flex flex-col items-center w-full">
          <div className="w-full max-w-[1440px] flex flex-row gap-8 px-4 items-stretch h-full min-h-0">
            <div className="flex-1 min-w-0 flex flex-col">
              <InformationSection
                memberTypes={memberTypes}
                type={type}
                onTypeChange={v => setType(v as 'driver' | 'engineer' | 'crew_chief')}
                name={name}
                onNameChange={setName}
                surname={surname}
                onSurnameChange={setSurname}
                portrait={<PortraitSelector value={portrait} onChange={setPortrait} previewUrl={portraitPreviewUrl} />}
                onPortraitClick={handlePortraitClick}
                decadeStartContent={decadeStartContent}
                onDecadeStartContentChange={setDecadeStartContent}
                nationalityCombobox={<NationalityCombobox value={country} onChange={setCountry} />}
                careerStage={careerStage}
                onCareerStageChange={setCareerStage}
                careerStages={careerStages}
                onRandomize={handleRandomMember}
              />
            </div>
            <div className="flex-shrink-0 w-auto flex flex-col">
              <StatsSection
                stats={stats}
                statDefs={statFields[type as keyof typeof statFields].map(sf => ({
                  key: sf.key,
                  label: sf.label,
                  min: sf.key.startsWith('max') ? (stats[getBaseKey(sf.key)] || 1) : 1,
                  max: 10,
                }))}
                onStatChange={handleStatChange}
              />
            </div>
          </div>
          <div className="w-full max-w-[1440px] grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 px-4 pb-32">
            <div className="col-span-2">
              <TraitsSection
                memberType={type}
                selectedTraits={selectedTraits}
                onTraitsChange={setSelectedTraits}
                initialTraitNames={Array.isArray(initialValues?.traits)
                  ? initialValues.traits.map(t => typeof t === 'string' ? t : t.name)
                  : undefined}
              />
            </div>
          </div>
        </main>
        {/* Footer */}
        <footer
          className="w-full fixed left-0 right-0 bottom-0 bg-white shadow-lg z-20"
          style={{ borderTop: '1.5px solid #d1cfc7', padding: '1rem 0' }}
        >
          <div className="w-full max-w-[1440px] mx-auto flex flex-row items-center justify-between px-8">
            <div className="text-lg font-semibold text-black font-[Figtree,Inter,sans-serif]">
              {type === 'driver' && 'Driver Cost: '}
              {type === 'engineer' && 'Engineer Cost: '}
              {type === 'crew_chief' && 'Crew Chief Cost: '}
              <span className="text-black" data-testid="member-cost">${memberCost}</span>
            </div>
            <Button
              onClick={handlePreviewClick}
            >
              {`Preview ${type === 'driver' ? 'Driver' : type === 'engineer' ? 'Engineer' : 'Crew Chief'}`}
            </Button>
          </div>
        </footer>
      </div>
    </>
  );
}

export { Button, fetchRandomName, fetchRandomTraits, RANDOM_NATIONS, CAREER_STAGES }; 