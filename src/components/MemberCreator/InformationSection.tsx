import { Card } from '../ui/Card';
import React from 'react';
import Image from 'next/image';
import { ToggleButton } from './ToggleButton';
import { Select } from '../ui/select';

interface MemberTypeOption {
  value: string;
  label: string;
}

interface InformationSectionProps {
  memberTypes: MemberTypeOption[];
  type: string;
  onTypeChange: (type: string) => void;
  name: string;
  onNameChange: (v: string) => void;
  surname: string;
  onSurnameChange: (v: string) => void;
  portrait: React.ReactNode;
  onPortraitClick: () => void;
  decadeStartContent: boolean;
  onDecadeStartContentChange: (v: boolean) => void;
  nationalityCombobox: React.ReactNode;
  careerStage: string;
  onCareerStageChange: (v: string) => void;
  careerStages: { value: string; label: string }[];
  onRandomize: () => void;
}

export function InformationSection({
  memberTypes,
  type,
  onTypeChange,
  name,
  onNameChange,
  surname,
  onSurnameChange,
  portrait,
  onPortraitClick,
  decadeStartContent,
  onDecadeStartContentChange,
  nationalityCombobox,
  careerStage,
  onCareerStageChange,
  careerStages,
  onRandomize,
}: InformationSectionProps) {
  return (
    <Card title="Information">
      <div className="py-2 px-6 flex flex-col gap-3 h-full">
        {/* Member Type Selector */}
        <div className="flex justify-center mb-1 gap-2 items-center">
          <button
            type="button"
            aria-label="Randomize Member"
            onClick={onRandomize}
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
                onClick={() => onTypeChange(mt.value)}
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
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-[#AA8B83]" onClick={onPortraitClick} style={{ cursor: 'pointer' }}>
              {portrait}
            </div>
            <div className="flex flex-col items-center gap-1 mt-2">
              <span className="text-[15px] font-semibold text-gray-700 font-[Figtree,Inter,sans-serif]">1st Season:</span>
              <ToggleButton value={decadeStartContent} onChange={onDecadeStartContentChange} onText="Available" offText="Unavailable" />
            </div>
          </div>
          {/* Fields */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Name</label>
                <input type="text" value={name} onChange={e => onNameChange(e.target.value)} placeholder="Enter name" className="w-full rounded-md border-2 border-[#E5E7EB] bg-white font-medium px-4 py-3 text-base shadow-sm font-[Figtree,Inter,sans-serif] text-[#333] focus:border-[#fd655c] focus:ring-2 focus:ring-coral-200 transition-colors" />
              </div>
              <div className="flex-1">
                <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Surname</label>
                <input type="text" value={surname} onChange={e => onSurnameChange(e.target.value)} placeholder="Enter surname" className="w-full rounded-md border-2 border-[#E5E7EB] bg-white font-medium px-4 py-3 text-base shadow-sm font-[Figtree,Inter,sans-serif] text-[#333] focus:border-[#fd655c] focus:ring-2 focus:ring-coral-200 transition-colors" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Nation of Origin</label>
                {nationalityCombobox}
              </div>
              <div className="flex-1">
                <label className="block text-[1rem] font-bold text-gray-700 mb-1 font-[Figtree,Inter,sans-serif]">Career Stage</label>
                <Select value={careerStage} onChange={e => onCareerStageChange(e.target.value)}>
                  {careerStages.map(cs => <option key={cs.value} value={cs.value}>{cs.label}</option>)}
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 