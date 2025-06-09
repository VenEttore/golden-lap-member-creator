import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTraitTooltip, TraitTooltip } from './TraitTooltip';
import { Card } from '../ui/Card';
import { MemberType, Trait } from '@/types/member';
import { filterTraits } from '@/utils/traitUtils';

const driversSheet = '/assets/drivers_sheet.png';
const engcrewSheet = '/assets/engcrew_sheet.png';

interface IconData {
  [key: string]: {
    x: number;
    y: number;
  };
}

// Reusable TraitIcon component
function TraitIcon({ traitName, memberType, iconData, size = 24, className = '' }: {
  traitName: string;
  memberType: MemberType;
  iconData: IconData;
  size?: number;
  className?: string;
}) {
  if (!iconData) return null;
  const icon = iconData[traitName];
  const sheet = memberType === 'driver' ? driversSheet : engcrewSheet;
  const scale = size / 80;
  const sheetSize = memberType === 'driver'
    ? `${640 * scale}px ${400 * scale}px`
    : `${640 * scale}px ${320 * scale}px`;
  if (!icon) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundPosition: `-${icon.x * scale}px -${icon.y * scale}px`,
        backgroundSize: sheetSize,
        backgroundRepeat: 'no-repeat',
        verticalAlign: 'middle',
      }}
      className={className}
      aria-label={traitName}
    />
  );
}

interface TraitsSectionProps {
  memberType: MemberType;
  selectedTraits: Trait[];
  onTraitsChange: (traits: Trait[]) => void;
  initialTraitNames?: string[];
}

// Career stage traits that should be filtered out
const CAREER_STAGE_TRAITS = ['EarlyCareer', 'MidCareer', 'LateCareer', 'LastYear'];

// SectorPips component for selected traits indicator
function SectorPips({ count }: { count: number }) {
  // Legacy filter for selected pips
  const selectedFilter =
    'brightness(0) saturate(100%) invert(34%) sepia(99%) saturate(749%) hue-rotate(110deg) brightness(95%) contrast(101%)';
  return (
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, i) => (
        <Image
          key={i}
          src="/assets/SectorPip.png"
          alt={i < count ? 'Selected' : 'Unselected'}
          width={32}
          height={22}
          style={{
            filter: i < count ? selectedFilter : undefined,
            display: 'block',
          }}
        />
      ))}
    </div>
  );
}

export default function TraitsSection({ memberType, selectedTraits, onTraitsChange, initialTraitNames }: TraitsSectionProps) {
  const [availableTraits, setAvailableTraits] = useState<Trait[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [iconData, setIconData] = useState<IconData | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedSortAsc, setSelectedSortAsc] = useState(true);
  const { tooltip, showTooltip, moveTooltip, hideTooltip } = useTraitTooltip();

  useEffect(() => {
    // Load traits based on member type
    const loadTraits = async () => {
      try {
        // Load member type specific traits
        const memberTypeResponse = await fetch(`/data/traits/${memberType}_traits.json`);
        const memberTypeData = await memberTypeResponse.json();
        
        // Load generic traits
        const genericResponse = await fetch('/data/traits/generic_traits.json');
        const genericData = await genericResponse.json();
        
        // Combine and filter out career stage traits
        const allTraits = [...memberTypeData, ...genericData].filter(
          trait => !CAREER_STAGE_TRAITS.includes(trait.name)
        );
        
        setAvailableTraits(allTraits);
      } catch (error) {
        console.error('Error loading traits:', error);
      }
    };

    loadTraits();
  }, [memberType]);

  useEffect(() => {
    // Load icon data based on member type
    const loadIconData = async () => {
      try {
        const iconDataUrl = memberType === 'driver'
          ? '/assets/drivers_data.json'
          : '/assets/engcrew_data.json';
        const response = await fetch(iconDataUrl);
        const data = await response.json();
        setIconData(data);
      } catch {
        setIconData(null);
      }
    };
    loadIconData();
  }, [memberType]);

  const handleInitialTraits = useCallback(() => {
    if (
      Array.isArray(initialTraitNames) &&
      initialTraitNames.length > 0 &&
      selectedTraits.length === 0 &&
      availableTraits.length > 0
    ) {
      const mapped = initialTraitNames.map(name =>
        availableTraits.find(t => t.name === name || t.display_name === name)
      ).filter(Boolean);
      if (mapped.length > 0) onTraitsChange(mapped as Trait[]);
    }
  }, [initialTraitNames, availableTraits, selectedTraits.length, onTraitsChange]);

  useEffect(() => {
    handleInitialTraits();
  }, [handleInitialTraits]);

  // Hide tooltip when selectedTraits changes (e.g., trait removed)
  useEffect(() => {
    hideTooltip();
  }, [selectedTraits, hideTooltip]);

  const filteredTraits = filterTraits(availableTraits, searchQuery, selectedTraits);

  // Sort filteredTraits by display_name
  const sortedTraits = [...filteredTraits].sort((a, b) =>
    sortAsc
      ? a.display_name.localeCompare(b.display_name)
      : b.display_name.localeCompare(a.display_name)
  );

  // Sort selectedTraits by display_name
  const sortedSelectedTraits = [...selectedTraits].sort((a, b) =>
    selectedSortAsc
      ? a.display_name.localeCompare(b.display_name)
      : b.display_name.localeCompare(a.display_name)
  );

  const canSelectTrait = (trait: Trait) => {
    // If trait has no category (empty string), it can always be selected
    if (!trait.category) return true;
    
    // Check if we already have a trait with this category
    return !selectedTraits.some(t => t.category === trait.category);
  };

  const handleTraitSelect = (trait: Trait) => {
    if (selectedTraits.some(t => t.name === trait.name)) {
      onTraitsChange(selectedTraits.filter(t => t.name !== trait.name));
    } else {
      // Check if we're at the trait limit
      if (selectedTraits.length >= 5) {
        return;
      }
      
      // Check if we can select this trait based on category
      if (!canSelectTrait(trait)) {
        return;
      }
      
      onTraitsChange([...selectedTraits, trait]);
    }
  };

  const renderTraitIcon = (traitName: string) => {
    if (!iconData) return null;
    return (
      <TraitIcon
        traitName={traitName}
        memberType={memberType}
        iconData={iconData}
        size={24}
      />
    );
  };

  return (
    <Card title="Traits">
      <div className="flex gap-4 h-[400px]">
        {/* Available Traits Table */}
        <div className="flex-[2_2_0%] flex flex-col min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search traits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-base border rounded-lg px-4"
              style={{ height: 40, minHeight: 40, maxHeight: 40, borderRadius: 8, paddingTop: 0, paddingBottom: 0, boxSizing: 'border-box' }}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: '#ece9e2', fontWeight: 700, fontSize: '1.05rem', color: '#333', borderBottom: '1.5px solid #e0ded9' }}>
                  <th className="p-2 w-[220px] min-w-[180px] max-w-[300px] cursor-pointer select-none" style={{ userSelect: 'none', fontWeight: 700, color: '#333', padding: '0.5rem 1rem', background: 'none', border: 'none' }} onClick={() => setSortAsc((asc) => !asc)}>
                    Trait
                    <span style={{ marginLeft: 8, fontSize: '1.1em', color: '#b0926a', verticalAlign: 'middle' }}>{sortAsc ? '▲' : '▼'}</span>
                  </th>
                  <th className="p-2" style={{ fontWeight: 700, color: '#333', padding: '0.5rem 1rem', background: 'none', border: 'none' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {sortedTraits.map((trait, idx) => {
                  const isDisabled = !canSelectTrait(trait);
                  return (
                    <tr
                      key={trait.name}
                      className={`border-b cursor-pointer ${selectedTraits.some(t => t.name === trait.name) ? 'bg-blue-50' : ''} ${isDisabled ? 'opacity-50' : ''}`}
                      style={{ 
                        background: !selectedTraits.some(t => t.name === trait.name) && idx % 2 === 1 ? '#f0ede7' : undefined, 
                        cursor: isDisabled ? 'not-allowed' : 'pointer', 
                        transition: 'background 0.13s' 
                      }}
                      onMouseOver={e => { 
                        if (!selectedTraits.some(t => t.name === trait.name) && !isDisabled) { 
                          (e.currentTarget as HTMLTableRowElement).style.background = '#fbe7e6'; 
                        } 
                      }}
                      onMouseOut={e => { 
                        if (!selectedTraits.some(t => t.name === trait.name)) { 
                          (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 1 ? '#f0ede7' : ''; 
                        } 
                      }}
                      onClick={() => !isDisabled && handleTraitSelect(trait)}
                    >
                      <td className="p-2 w-[220px] min-w-[180px] max-w-[300px] whitespace-nowrap overflow-ellipsis overflow-hidden flex items-center">
                        {renderTraitIcon(trait.name)}
                        <span style={{ marginLeft: 8 }}>{trait.display_name}</span>
                      </td>
                      <td className="p-2">{trait.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tooltip && (
              <TraitTooltip
                title={tooltip.title}
                description={tooltip.description}
                x={tooltip.x}
                y={tooltip.y}
              />
            )}
          </div>
        </div>
        {/* Selected Traits */}
        <div className="flex-[1_1_0%] flex flex-col min-w-[180px] max-w-[320px]">
          <div className="mb-2 flex items-center gap-4 px-4 rounded-lg" style={{ height: 40, background: '#e0ded9', minHeight: 40, maxHeight: 40, alignItems: 'center', justifyContent: 'flex-start', borderRadius: 8 }}>
            <span className="font-bold text-[#222]" style={{ fontSize: '1.18rem', letterSpacing: '0.01em' }}>Selected</span>
            <SectorPips count={selectedTraits.length} />
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: '#ece9e2', fontWeight: 700, fontSize: '1.05rem', color: '#333', borderBottom: '1.5px solid #e0ded9' }}>
                  <th className="p-2 cursor-pointer select-none" style={{ userSelect: 'none', fontWeight: 700, color: '#333', padding: '0.5rem 1rem', background: 'none', border: 'none' }} onClick={() => setSelectedSortAsc((asc) => !asc)}>
                    Selected Trait
                    <span style={{ marginLeft: 8, fontSize: '1.1em', color: '#b0926a', verticalAlign: 'middle' }}>{selectedSortAsc ? '▲' : '▼'}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSelectedTraits.map((trait, idx) => (
                  <tr
                    key={trait.name}
                    className="border-b cursor-pointer"
                    style={{ background: idx % 2 === 1 ? '#f0ede7' : undefined, cursor: 'pointer', transition: 'background 0.13s' }}
                    onMouseOver={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#fbe7e6'; }}
                    onMouseOut={e => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 1 ? '#f0ede7' : ''; }}
                    onClick={() => handleTraitSelect(trait)}
                    onMouseEnter={e => showTooltip(e, trait.display_name, trait.description)}
                    onMouseMove={moveTooltip}
                    onMouseLeave={hideTooltip}
                  >
                    <td className="p-2 flex items-center">
                      {renderTraitIcon(trait.name)}
                      <span style={{ marginLeft: 8 }}>{trait.display_name}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { TraitIcon }; 