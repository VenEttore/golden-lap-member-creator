"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import PortraitSelectionModal from '../Portraits/PortraitSelectionModal';
import { PortraitConfig } from '@/types/portrait';
import { addOrUpdatePortrait, getPortraits } from '@/utils/portraitStorage';
import { Combobox, ComboboxOption } from '../ui/combobox';
import { Toggle } from '../ui/toggle';
import { Select } from '../ui/select';
import TraitsSection from '../Traits/TraitsSection';
import MemberPreviewModal from './MemberPreviewModal';
import { saveMember } from '@/utils/memberStorage';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { generateMemberStats } from '../../utils/memberStatGenerator';
import type { MouseEvent } from 'react';

// Color palette and card styles from sample
const cardBorder = '#AA8B83';
const cardShadow = 'rgba(52, 79, 58, 0.10)';
const sectionHeaderBg = '#d0cdbe';
const sectionHeaderBorder = '#d1cfc7';
const cardBg = '#F5F5F2';

// Cost calculation point values from docs
const DRIVER_POINT_VALUES = [0, 1, 2, 3, 4, 5, 7, 10, 14, 18, 24];
const ENG_CREW_POINT_VALUES = [0, 1, 2, 3, 4, 6, 9, 13, 18, 24, 31];

export function calculateMemberCost(type: 'driver' | 'engineer' | 'crew_chief', stats: Record<string, number>, selectedTraits: { name: string }[]) {
  // Trait modifiers
  const hasRichParents = selectedTraits.some(t => t.name === 'RichParents');
  const hasPrivateer = selectedTraits.some(t => t.name === 'Privateer');
  if (hasRichParents && type === 'driver') return 0;

  if (type === 'driver') {
    const speed = stats.speed || 0;
    const focus = stats.focus || 0;
    const maxSpeed = stats.maxSpeed || 0;
    const maxFocus = stats.maxFocus || 0;
    const pv = DRIVER_POINT_VALUES;
    let cost = Math.ceil(pv[speed] + pv[focus] + (maxSpeed + maxFocus) / 2);
    if (hasPrivateer) cost = Math.max(0, cost - 5);
    return cost;
  } else if (type === 'engineer') {
    const expertise = stats.expertise || 0;
    const precision = stats.precision || 0;
    const maxExpertise = stats.maxExpertise || 0;
    const maxPrecision = stats.maxPrecision || 0;
    const pv = ENG_CREW_POINT_VALUES;
    return Math.ceil((pv[expertise] + pv[precision] + (maxExpertise + maxPrecision) / 2) / 2.5);
  } else if (type === 'crew_chief') {
    const speed = stats.speed || 0;
    const skill = stats.skill || 0;
    const maxSpeed = stats.maxSpeed || 0;
    const maxSkill = stats.maxSkill || 0;
    const pv = ENG_CREW_POINT_VALUES;
    return Math.ceil((pv[skill] + pv[speed] + (maxSkill + maxSpeed) / 2) / 3);
  }
  return 0;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: sectionHeaderBg,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderBottom: `2px solid ${sectionHeaderBorder}`,
        marginTop: 0,
        marginBottom: 0,
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
      {children}
    </div>
  );
}

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
      <SectionHeader>{title}</SectionHeader>
      <div className="py-8 px-8 flex-1 flex flex-col gap-4">{children}</div>
    </div>
  );
}

const memberTypes = [
  { value: 'driver', label: 'Driver' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'crew_chief', label: 'Crew Chief' },
];

// Improved PortraitSelector component (legacy-inspired)
function PortraitSelector({ value, onChange, previewUrl }: { value: string; onChange: (val: string) => void; previewUrl?: string | null }) {
  const [portraitUrl, setPortraitUrl] = useState<string | null>(previewUrl || null);
  const hasPortrait = Boolean(value);

  useEffect(() => {
    if (previewUrl) {
      setPortraitUrl(previewUrl);
      return;
    }
    if (value) {
      let cancelled = false;
      (async () => {
        const portraits = await getPortraits();
        if (cancelled) return;
        const found = portraits.find((p: PortraitConfig) => p.name === value);
        setPortraitUrl(found ? (found.fullSizeImage || found.thumbnail) : null);
      })();
      return () => { cancelled = true; };
    } else {
      setPortraitUrl(null);
    }
  }, [value, previewUrl]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
      <div
        style={{
          position: 'relative',
          width: 128,
          height: 128,
          borderRadius: '50%',
          background: hasPortrait ? '#e5e5e5' : '#d1cfc7',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(52,79,58,0.10)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.15s',
        }}
        tabIndex={0}
        onClick={() => onChange('')}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange(''); }}
        aria-label="Change Portrait"
      >
        {/* Portrait image or placeholder */}
        {hasPortrait && portraitUrl ? (
          <Image
            src={portraitUrl || ''}
            alt={value}
            width={128}
            height={128}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        ) : (
          <div style={{ width: 128, height: 128, borderRadius: '50%', background: '#d1cfc7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, color: '#aaa', fontWeight: 700, fontFamily: 'Figtree, Inter, sans-serif' }}>?</div>
        )}
        {/* Overlay on hover */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'rgba(52,52,52,0.32)',
            color: '#fff',
            fontFamily: 'Figtree, Inter, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.15s',
          }}
          className="portrait-hover-overlay"
        >
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 2 }}>
              <circle cx="12" cy="13" r="3" />
              <path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
            </svg>
            {hasPortrait ? 'Change Portrait' : 'Add Portrait'}
          </span>
        </div>
        <style>{`
          .portrait-hover-overlay {
            pointer-events: none;
          }
          div[aria-label="Change Portrait"]:hover .portrait-hover-overlay,
          div[aria-label="Change Portrait"]:focus .portrait-hover-overlay {
            opacity: 1;
            pointer-events: auto;
          }
        `}</style>
      </div>
    </div>
  );
}

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
        const res = await fetch('https://flagcdn.com/en/codes.json');
        if (!res.ok) throw new Error('Failed to fetch countries');
        
        const data = await res.json();
        if (!isMounted) return;

        const arr = Object.entries(data)
          .filter(([code]) => {
            // Filter out US states
            if (code.toLowerCase().startsWith('us-')) return false;
            
            // Filter out UK sub-nationalities
            const ukSubNationalities = ['gb-eng', 'gb-sct', 'gb-wls', 'gb-nir'];
            if (ukSubNationalities.includes(code.toLowerCase())) return false;
            
            // Filter out other sub-nationalities (add more as needed)
            const otherSubNationalities = [
              'cn-hk', // Hong Kong
              'cn-mo', // Macau
              'pt-20', // Azores
              'pt-30', // Madeira
              'es-ce', // Ceuta
              'es-ml', // Melilla
              'fr-bl', // Saint Barthélemy
              'fr-mf', // Saint Martin
              'fr-nc', // New Caledonia
              'fr-pf', // French Polynesia
              'fr-re', // Réunion
              'fr-yt', // Mayotte
              'nl-aw', // Aruba
              'nl-cw', // Curaçao
              'nl-sx', // Sint Maarten
              'no-21', // Svalbard
              'no-22', // Jan Mayen
              'us-as', // American Samoa
              'us-gu', // Guam
              'us-mp', // Northern Mariana Islands
              'us-pr', // Puerto Rico
              'us-vi', // U.S. Virgin Islands
            ];
            if (otherSubNationalities.includes(code.toLowerCase())) return false;
            
            return true;
          })
          .map(([code, name]) => ({
            value: code.toUpperCase(),
            label: String(name),
            iconUrl: `https://flagcdn.com/${code.toLowerCase()}.svg`,
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

// Update StatsRow to accept onDotClick and highlight logic
function StatsRow({ label, value, min, max, onDecrement, onIncrement, onDotClick }: { label: string; value: number; min: number; max: number; onDecrement: () => void; onIncrement: () => void; onDotClick: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4 w-full py-2">
      <span className="w-32 text-lg font-bold text-gray-700 whitespace-nowrap flex-shrink-0 text-left min-w-0 overflow-hidden font-[Figtree,Inter,sans-serif]">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-[180px] justify-center">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="stat-btn flex-shrink-0"
          style={{
            background: '#fd655c', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)', padding: 0, outline: 'none', cursor: value <= min ? 'not-allowed' : 'pointer', opacity: value <= min ? 0.5 : 1, transition: 'background 0.15s, box-shadow 0.15s', fontSize: 22, fontFamily: 'Figtree,Inter,sans-serif', fontWeight: 700,
          }}
          tabIndex={value <= min ? -1 : 0}
          onMouseOver={(e: MouseEvent<HTMLButtonElement>) => { if (!(value <= min)) e.currentTarget.style.background = '#b92d2a'; }}
          onMouseOut={(e: MouseEvent<HTMLButtonElement>) => { if (!(value <= min)) e.currentTarget.style.background = '#fd655c'; }}
          onFocus={(e: React.FocusEvent<HTMLButtonElement>) => { if (!(value <= min)) e.currentTarget.style.background = '#b92d2a'; }}
          onBlur={(e: React.FocusEvent<HTMLButtonElement>) => { if (!(value <= min)) e.currentTarget.style.background = '#fd655c'; }}
        >
          <Image src="/assets/ChevronLeft.png" alt="<" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
        <div className="flex flex-row gap-[2px] items-center">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className={`stat-dot ${i < value ? 'filled' : i < max ? 'max' : 'disabled'}`}
              style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block', marginRight: i === 9 ? 0 : 2, background: i < value ? '#E9A727' : i < max ? '#fffbe6' : '#e0ded9', border: '1.5px solid ' + (i < value ? '#E9A727' : i < max ? '#E9A727' : '#d1cfc7'), boxShadow: i < value ? '0 2px 6px rgba(233, 167, 39, 0.13)' : i < max ? '0 1px 4px rgba(233, 167, 39, 0.10)' : '0 1px 2px rgba(52, 79, 58, 0.10)', opacity: i < value ? 1 : i < max ? 1 : 0.6, cursor: i < max ? 'pointer' : 'default', verticalAlign: 'middle' }}
              onClick={() => i < max && onDotClick(i + 1)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onIncrement}
          disabled={value >= max}
          className="stat-btn flex-shrink-0"
          style={{
            background: '#fd655c', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)', padding: 0, outline: 'none', cursor: value >= max ? 'not-allowed' : 'pointer', opacity: value >= max ? 0.5 : 1, transition: 'background 0.15s, box-shadow 0.15s', fontSize: 22, fontFamily: 'Figtree,Inter,sans-serif', fontWeight: 700,
          }}
          tabIndex={value >= max ? -1 : 0}
          onMouseOver={(e: MouseEvent<HTMLButtonElement>) => { if (!(value >= max)) e.currentTarget.style.background = '#b92d2a'; }}
          onMouseOut={(e: MouseEvent<HTMLButtonElement>) => { if (!(value >= max)) e.currentTarget.style.background = '#fd655c'; }}
          onFocus={(e: React.FocusEvent<HTMLButtonElement>) => { if (!(value >= max)) e.currentTarget.style.background = '#b92d2a'; }}
          onBlur={(e: React.FocusEvent<HTMLButtonElement>) => { if (!(value >= max)) e.currentTarget.style.background = '#fd655c'; }}
        >
          <Image src="/assets/ChevronLeft.png" alt=">" width={18} height={18} style={{ filter: 'brightness(0) invert(1)', transform: 'rotate(180deg)' }} />
        </button>
      </div>
      <span className="stat-value text-xl text-gray-700 text-right pl-4 flex-shrink-0 w-8 min-w-[2ch] font-[Figtree,Inter,sans-serif] tracking-wide" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
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

  // Special logic for drivers: Privateer and RichParents mutually exclusive, weighted
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
    // Weighted trait count: 2 and 3 most common, 4 less, 1 less than 4, 0 rare, 5 rarest
    const traitCountWeights = [
      2, 2, 2, 2, 2, 2, 2, // 2 traits (weight 7)
      3, 3, 3, 3, 3, 3, 3, // 3 traits (weight 7)
      4, 4, 4, 4,          // 4 traits (weight 4)
      1, 1, 1,             // 1 trait  (weight 3)
      5, 5,                // 5 traits (weight 2)
      0                    // 0 traits (weight 1)
    ];
    const count = traitCountWeights[Math.floor(Math.random() * traitCountWeights.length)];
    const shuffled = [...allTraits].sort(() => 0.5 - Math.random());
    let traits = shuffled.slice(0, count);
    if (specialTrait) traits = [specialTrait, ...traits].slice(0, count); // Max 5 traits
    return traits;
  } else {
    // Weighted trait count: 2 and 3 most common, 4 less, 1 less than 4, 0 rare, 5 rarest
    const traitCountWeights = [
      2, 2, 2, 2, 2, 2, 2, // 2 traits (weight 7)
      3, 3, 3, 3, 3, 3, 3, // 3 traits (weight 7)
      4, 4, 4, 4,          // 4 traits (weight 4)
      1, 1, 1,             // 1 trait  (weight 3)
      5, 5,                // 5 traits (weight 2)
      0                    // 0 traits (weight 1)
    ];
    const count = traitCountWeights[Math.floor(Math.random() * traitCountWeights.length)];
    const shuffled = [...allTraits].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
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
  function setStatDirect(key: string, value: number) {
    setStats(prev => {
      const next = { ...prev, [key]: Math.max(1, value) };
      // If base stat, auto-increase max if needed
      const maxKey = getMaxKey(key);
      if (maxKey && !key.startsWith('max') && value > (prev[maxKey] || 1)) {
        next[maxKey] = value;
      }
      // If max stat, clamp to base
      const baseKey = getBaseKey(key);
      if (key.startsWith('max') && value < (prev[baseKey] || 1)) {
        next[key] = prev[baseKey] || 1;
      }
      return next;
    });
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
    // Filter career stages if decadeStartContent is false
    const availableStages = decadeStartContent
      ? CAREER_STAGES
      : CAREER_STAGES.filter(cs => cs !== 'last_year');
    const careerStage = availableStages[Math.floor(Math.random() * availableStages.length)];
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
              <Card title="Information">
                <div className="py-2 px-6 flex flex-col gap-3 h-full">
                  {/* Member Type Selector */}
                  <div className="flex justify-center mb-1 gap-2 items-center">
                    <button
                      type="button"
                      aria-label="Randomize Member"
                      onClick={handleRandomMember}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#fd655c',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)',
                        cursor: 'pointer',
                        marginRight: 12,
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = '#b92d2a'; }}
                      onMouseOut={e => { e.currentTarget.style.background = '#fd655c'; }}
                      onFocus={e => { e.currentTarget.style.background = '#b92d2a'; }}
                      onBlur={e => { e.currentTarget.style.background = '#fd655c'; }}
                    >
                      <Image src="/assets/dice.svg" alt="Randomize" width={24} height={24} style={{ display: 'block', filter: 'invert(1) brightness(2)' }} />
                    </button>
                    <div className="inline-flex rounded-md bg-[#f8f7f4] border border-[#E5E7EB] shadow-sm overflow-hidden">
                      {memberTypes.map(mt => (
                        <button
                          key={mt.value}
                          type="button"
                          onClick={() => setType(mt.value as 'driver' | 'engineer' | 'crew_chief')}
                          className={`px-6 py-2 font-semibold font-[Figtree,Inter,sans-serif] text-base transition-all focus:outline-none ${type === mt.value ? 'bg-[#fd655c] text-white' : 'bg-transparent text-[#b92d2a]'}`}
                          style={{ borderRight: mt.value !== memberTypes[memberTypes.length-1].value ? '1px solid #E5E7EB' : undefined, cursor: type === mt.value ? 'default' : 'pointer' }}
                        >
                          {mt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-center h-full">
                    {/* Portrait and 1st Season toggle */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-[#AA8B83]" onClick={handlePortraitClick} style={{ cursor: 'pointer' }}>
                        <PortraitSelector
                          value={portrait}
                          onChange={setPortrait}
                          previewUrl={portraitPreviewUrl}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1 mt-2">
                        <span className="text-[15px] font-semibold text-gray-700 font-[Figtree,Inter,sans-serif]">1st Season:</span>
                        <Toggle
                          pressed={decadeStartContent}
                          onClick={() => setDecadeStartContent(f => !f)}
                          className="px-5 py-2 rounded-full border font-semibold font-[Figtree,Inter,sans-serif] text-base min-w-[120px] transition-all shadow-none cursor-pointer"
                          style={{ minWidth: 120 }}
                        >
                          {decadeStartContent ? 'Available' : 'Unavailable'}
                        </Toggle>
                      </div>
                    </div>
                    {/* Fields */}
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Name</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" className="w-full rounded-md border-2 border-[#E5E7EB] bg-white font-medium px-4 py-3 text-base shadow-sm font-[Figtree,Inter,sans-serif] text-[#333] focus:border-[#fd655c] focus:ring-2 focus:ring-coral-200 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Surname</label>
                          <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="Enter surname" className="w-full rounded-md border-2 border-[#E5E7EB] bg-white font-medium px-4 py-3 text-base shadow-sm font-[Figtree,Inter,sans-serif] text-[#333] focus:border-[#fd655c] focus:ring-2 focus:ring-coral-200 transition-colors" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Nation of Origin</label>
                          <NationalityCombobox value={country} onChange={setCountry} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Career Stage</label>
                          <Select value={careerStage} onChange={e => setCareerStage(e.target.value)}>
                            {careerStages.map(cs => <option key={cs.value} value={cs.value}>{cs.label}</option>)}
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="flex-shrink-0 w-auto flex flex-col">
              <Card title="Stats">
                <div className="flex flex-col gap-2">
                  {statFields[type as keyof typeof statFields].map(sf => {
                    const isMax = sf.key.startsWith('max');
                    const baseKey = getBaseKey(sf.key);
                    const baseVal = stats[baseKey] || 1;
                    return (
                      <StatsRow
                        key={sf.key}
                        label={sf.label}
                        value={stats[sf.key] || 1}
                        min={isMax ? baseVal : 1}
                        max={10}
                        onDecrement={() => handleStatChange(sf.key, -1)}
                        onIncrement={() => handleStatChange(sf.key, 1)}
                        onDotClick={v => setStatDirect(sf.key, v)}
                      />
                    );
                  })}
                </div>
              </Card>
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