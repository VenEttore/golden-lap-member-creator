import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TraitIcon } from '../Traits/TraitsSection';
import { Button } from './MemberCreatorModern';
import { TraitTooltip, useTraitTooltip } from '../Traits/TraitTooltip';
import { getPortraits } from '@/utils/portraitStorage';
import Image from 'next/image';
import { codeToFlagCdn } from '@/utils/flagUtils';

const cardBg = '#f7f5f2';
const coral = '#fd655c';
const coralDark = '#b92d2a';
const sectionHeaderBg = '#ece9e2';
const sectionHeaderBorder = '#e0ded9';
const fontFamily = 'Figtree, Inter, sans-serif';

interface MemberPreviewModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  surname: string;
  country: string;
  careerStage: string;
  portraitUrl: string | null;
  portraitName?: string;
  traits: { name: string; display_name: string; description: string }[];
  stats: Record<string, number>;
  cost: number;
  type: 'driver' | 'engineer' | 'crew_chief';
  decadeStartContent?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
}

const BASE_STATS: Record<string, { base: string; max: string; label: string }[]> = {
  driver: [
    { base: 'speed', max: 'maxSpeed', label: 'Speed' },
    { base: 'focus', max: 'maxFocus', label: 'Focus' },
  ],
  engineer: [
    { base: 'expertise', max: 'maxExpertise', label: 'Expertise' },
    { base: 'precision', max: 'maxPrecision', label: 'Precision' },
  ],
  crew_chief: [
    { base: 'speed', max: 'maxSpeed', label: 'Speed' },
    { base: 'skill', max: 'maxSkill', label: 'Skill' },
  ],
};

const CAREER_STAGE_LABELS: Record<string, string> = {
  early: 'Early Career',
  mid: 'Mid Career',
  late: 'Late Career',
  last_year: 'Last Year',
};

// Type alias for icon data used by trait icons (sprite sheet positions)
type IconData = { [traitName: string]: { x: number; y: number; width?: number; height?: number } };

export default function MemberPreviewModal({ open, onClose, name, surname, country, careerStage, portraitUrl, portraitName, traits, stats, cost, type, decadeStartContent, onConfirm, confirmText }: MemberPreviewModalProps) {
  // Load iconData for trait icons
  const [iconData, setIconData] = useState<IconData>({});
  const { tooltip, showTooltip, hideTooltip, moveTooltip } = useTraitTooltip();

  useEffect(() => {
    const loadIconData = async () => {
      try {
        const iconDataUrl = type === 'driver'
          ? '/assets/drivers_data.json'
          : '/assets/engcrew_data.json';
        const response = await fetch(iconDataUrl);
        const data = await response.json();
        setIconData(data || {});
      } catch {
        setIconData({});
      }
    };
    loadIconData();
  }, [type]);

  // Download JSON handler
  function handleDownload() {
    // Format country code (2-letter, lowercase)
    const countryCode = country.length === 2 ? country.toLowerCase() : country.toLowerCase();
    // Use the portraitName if available, else fallback to name+surname
    const portraitFile = portraitName && portraitName.trim()
      ? portraitName.trim() + '.png'
      : `${name}${surname}`.replace(/\s+/g, '') + '.png';
    const portraitPath = `Textures/Portraits/${portraitFile}`;
    // Map careerStage to the correct trait name
    const CAREER_STAGE_TRAIT_MAP: Record<string, string> = {
      early: 'EarlyCareer',
      mid: 'MidCareer',
      late: 'LateCareer',
      last_year: 'LastYear',
    };
    const careerStageTrait = CAREER_STAGE_TRAIT_MAP[careerStage] || careerStage;
    // Traits: career stage trait + up to 5 others (no duplicates)
    const traitNames = [careerStageTrait, ...traits.map(t => t.name).filter(t => t !== careerStageTrait)].slice(0, 6);
    // Common fields
    const base = {
      Name: name,
      Surname: surname,
      CountryCode: countryCode,
      PortraitPath: portraitPath,
      Traits: traitNames,
      DecadeStartContent: !!decadeStartContent,
    };
    let member: Record<string, unknown> = {};
    if (type === 'driver') {
      member = {
        ...base,
        Speed: stats.speed || 0,
        MaxSpeed: stats.maxSpeed || 0,
        Focus: stats.focus || 0,
        MaxFocus: stats.maxFocus || 0,
      };
    } else if (type === 'engineer') {
      member = {
        ...base,
        Expertise: stats.expertise || 0,
        MaxExpertise: stats.maxExpertise || 0,
        Precision: stats.precision || 0,
        MaxPrecision: stats.maxPrecision || 0,
      };
    } else if (type === 'crew_chief') {
      member = {
        ...base,
        Speed: stats.speed || 0,
        MaxSpeed: stats.maxSpeed || 0,
        Skill: stats.skill || 0,
        MaxSkill: stats.maxSkill || 0,
      };
    }
    // Use only name and surname for the file name (no member type)
    const fileName = `${name} ${surname}.json`;
    const blob = new Blob([JSON.stringify(member, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Helper: Render stat dots (legacy style: filled, max, disabled)
  function renderStatDots(label: string, baseValue: number, maxValue: number, max: number = 10) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }} key={label}>
        <span style={{ fontWeight: 700, color: '#444', fontSize: '1.08rem', marginRight: 8, letterSpacing: '0.01em', minWidth: 60 }}>{label}:</span>
        <div style={{ display: 'flex', gap: 2.88 }}>
          {Array.from({ length: max }).map((_, i) => {
            const style: React.CSSProperties = {
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'inline-block',
              marginRight: i === max - 1 ? 0 : 2.88,
              transition: 'background 0.2s, border 0.2s',
            };
            if (i < baseValue) {
              style.background = '#E9A727';
              style.border = '1.5px solid #E9A727';
              style.boxShadow = '0 2px 6px rgba(233, 167, 39, 0.13)';
              style.opacity = 1;
            } else if (i < maxValue) {
              style.background = '#fffbe6';
              style.border = '1.5px solid #E9A727';
              style.boxShadow = '0 1px 4px rgba(233, 167, 39, 0.10)';
              style.opacity = 1;
            } else {
              style.background = '#e0ded9';
              style.border = '1.5px solid #d1cfc7';
              style.boxShadow = '0 1px 2px rgba(52, 79, 58, 0.10)';
              style.opacity = 0.6;
            }
            return <span key={i} style={style} />;
          })}
        </div>
      </div>
    );
  }

  // Get base stats for this member type
  const statDefs = BASE_STATS[type];

  // 1st Season value
  const firstSeason = decadeStartContent ? 'Available' : 'Unavailable';

  function getFlagUrl(country: string) {
    if (!country) return '';
    const code = codeToFlagCdn(country);
    return `https://flagcdn.com/${code}.svg`;
  }

  interface PortraitObj {
    name: string;
    fullSizeImage?: string;
    thumbnail?: string;
  }
  const [portraitObj, setPortraitObj] = React.useState<PortraitObj | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    async function loadPortrait() {
      if (portraitName) {
        const portraits: PortraitObj[] = await getPortraits();
        if (cancelled) return;
        const found = portraits.find((p) => p.name === portraitName);
        setPortraitObj(found || null);
      } else {
        setPortraitObj(null);
      }
    }
    loadPortrait();
    return () => { cancelled = true; };
  }, [portraitName]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{
          background: cardBg,
          border: 'none',
          borderRadius: 22,
          boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
          fontFamily,
          maxWidth: 340,
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'visible',
          padding: 0,
        }}
      >
        {/* Visually hidden DialogTitle for accessibility */}
        <DialogTitle asChild>
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
            Preview {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </DialogTitle>
        {/* Close X button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: coral,
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
          aria-label="Close preview"
          onMouseOver={e => (e.currentTarget.style.background = coralDark)}
          onMouseOut={e => (e.currentTarget.style.background = coral)}
        >
          ×
        </button>
        {/* Header */}
        <div style={{ background: sectionHeaderBg, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottom: `1.5px solid ${sectionHeaderBorder}`, width: '100%', textAlign: 'center', padding: '14px 0 10px 0', fontWeight: 800, fontSize: '1.18rem', color: '#222', letterSpacing: '0.01em' }}>
          {name} {surname}
        </div>
        {/* Card Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 24px 16px 24px', background: cardBg, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 }}>
          {/* Portrait */}
          <div style={{ width: 112, height: 112, borderRadius: '50%', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', background: '#f3f3f3', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {portraitObj ? (
              <Image src={portraitObj.fullSizeImage || portraitObj.thumbnail || ''} alt="Portrait" width={112} height={112} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              portraitUrl ? <Image src={portraitUrl} alt="Portrait" width={112} height={112} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#aaa', fontWeight: 700 }}>?</div>
            )}
          </div>
          {/* Flag, trait icons row (no border/bg, no career stage badge) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10 }}>
            {country && <Image src={getFlagUrl(country)} alt={country} width={32} height={22} style={{ borderRadius: 3, objectFit: 'cover', border: '1.5px solid #e0ded9', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginRight: 16 }} />}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 0, alignItems: 'center' }}>
              {traits.map((trait, idx) => (
                <span
                  key={trait.name}
                  style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', width: 28, height: 28, borderRadius: 7, marginRight: idx !== traits.length - 1 ? 1 : 0, justifyContent: 'center' }}
                  onMouseEnter={e => showTooltip(e, trait.display_name, trait.description)}
                  onMouseMove={moveTooltip}
                  onMouseLeave={hideTooltip}
                >
                  <TraitIcon traitName={trait.name} memberType={type} iconData={iconData} size={24} />
                </span>
              ))}
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
          {/* Stats */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
            {statDefs.map(({ base, max, label }) =>
              renderStatDots(label, stats[base] || 0, stats[max] || 0)
            )}
          </div>
          {/* Cost pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '10px 0 8px 0' }}>
            <span style={{ background: '#000', color: '#fff', borderRadius: 999, padding: '4px 18px', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.01em', minWidth: 56, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.13)' }}>${cost}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1.5px solid #e0ded9', margin: '8px 0', width: '100%' }} />
          {/* Status and 1st Season rows */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8, paddingLeft: 4 }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, color: '#444', fontSize: 14, marginRight: 2 }}>Status:</span>
              <span style={{ color: '#222', fontWeight: 400, fontSize: 14 }}>{CAREER_STAGE_LABELS[careerStage] || careerStage || '-'}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontWeight: 700, color: '#444', fontSize: 14, marginRight: 2 }}>1st Season:</span>
              <span style={{ color: '#222', fontWeight: 400, fontSize: 14 }}>{firstSeason}</span>
            </span>
          </div>
          {/* Download JSON button */}
          <Button
            onClick={onConfirm ? onConfirm : handleDownload}
            style={{ width: '100%', margin: '0 0 2px 0' }}
          >
            {confirmText || `Confirm`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 