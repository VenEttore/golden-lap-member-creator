import React, { useState } from 'react';
import { useTraitTooltip, TraitTooltip } from '../Traits/TraitTooltip';
import { TraitIcon } from '../Traits/TraitsSection';

interface TraitIconsCellProps {
  traits: { name: string; display_name: string; description: string }[];
  memberType: 'driver' | 'engineer' | 'crew_chief';
  iconData: Record<string, Record<string, { display_name: string; description: string }>>;
}

export default function TraitIconsCell({ traits, memberType, iconData }: TraitIconsCellProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { tooltip, showTooltip, moveTooltip, hideTooltip } = useTraitTooltip();

  if (!iconData || !iconData[memberType] || !traits) return null;

  return (
    <div className="flex flex-row gap-1 items-center">
      {traits.map((trait, idx) => (
        <span
          key={trait.name}
          className="trait-icon-hover-area"
          onMouseEnter={e => { 
            showTooltip(e, trait.display_name, trait.description); 
            setHoveredIndex(idx); 
          }}
          onMouseMove={moveTooltip}
          onMouseLeave={() => { 
            hideTooltip(); 
            setHoveredIndex(null); 
          }}
          style={{ display: 'inline-block', cursor: 'pointer' }}
        >
          <TraitIcon 
            traitName={trait.name} 
            memberType={memberType} 
            iconData={iconData[memberType]} 
            size={24} 
          />
          {tooltip && hoveredIndex === idx && (
            <TraitTooltip {...tooltip} />
          )}
        </span>
      ))}
    </div>
  );
} 