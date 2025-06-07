import { Card } from '../ui/Card';
import React from 'react';
import Image from 'next/image';

interface StatDef {
  key: string;
  label: string;
  min: number;
  max: number;
}

interface StatsSectionProps {
  stats: Record<string, number>;
  statDefs: StatDef[];
  onStatChange: (key: string, delta: number) => void;
}

export function StatsSection({ stats, statDefs, onStatChange }: StatsSectionProps) {
  return (
    <Card title="Stats">
      <div className="flex flex-col gap-2">
        {statDefs.map(({ key, label, min, max }) => {
          const value = stats[key] || 1;
          return (
            <div key={key} className="flex items-center gap-4 w-full py-2">
              <span className="w-32 text-lg font-bold text-gray-700 whitespace-nowrap flex-shrink-0 text-left min-w-0 overflow-hidden font-[Figtree,Inter,sans-serif]">{label}</span>
              <div className="flex items-center gap-2 flex-1 min-w-[180px] justify-center">
                {/* Decrement button */}
                <button
                  type="button"
                  onClick={() => onStatChange(key, -1)}
                  disabled={value <= min}
                  className="stat-btn flex-shrink-0"
                  style={{
                    background: '#fd655c', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)', padding: 0, outline: 'none', cursor: value <= min ? 'not-allowed' : 'pointer', opacity: value <= min ? 0.5 : 1, transition: 'background 0.15s, box-shadow 0.15s', fontSize: 22, fontFamily: 'Figtree,Inter,sans-serif', fontWeight: 700, }}
                  tabIndex={value <= min ? -1 : 0}
                  onMouseOver={e => { if (!(value <= min)) e.currentTarget.style.background = '#b92d2a'; }}
                  onMouseOut={e => { if (!(value <= min)) e.currentTarget.style.background = '#fd655c'; }}
                  onFocus={e => { if (!(value <= min)) e.currentTarget.style.background = '#b92d2a'; }}
                  onBlur={e => { if (!(value <= min)) e.currentTarget.style.background = '#fd655c'; }}
                >
                  <Image src="/assets/ChevronLeft.png" alt="<" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} />
                </button>
                {/* Stat dots */}
                <div className="flex flex-row gap-[2px] items-center">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`stat-dot ${i < value ? 'filled' : 'empty'}`}
                      style={{ width: 14, height: 14, borderRadius: '50%', display: 'inline-block', marginRight: i === 9 ? 0 : 2, background: i < value ? '#E9A727' : '#fff', border: '1.5px solid ' + (i < value ? '#E9A727' : '#d1cfc7'), boxShadow: i < value ? '0 2px 6px rgba(233, 167, 39, 0.13)' : '0 1px 2px rgba(52, 79, 58, 0.10)', opacity: 1, cursor: 'pointer', verticalAlign: 'middle' }}
                      onClick={() => onStatChange(key, i + 1 - value)}
                    />
                  ))}
                </div>
                {/* Increment button */}
                <button
                  type="button"
                  onClick={() => onStatChange(key, 1)}
                  disabled={value >= max}
                  className="stat-btn flex-shrink-0"
                  style={{
                    background: '#fd655c', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(214, 72, 67, 0.10)', padding: 0, outline: 'none', cursor: value >= max ? 'not-allowed' : 'pointer', opacity: value >= max ? 0.5 : 1, transition: 'background 0.15s, box-shadow 0.15s', fontSize: 22, fontFamily: 'Figtree,Inter,sans-serif', fontWeight: 700, }}
                  tabIndex={value >= max ? -1 : 0}
                  onMouseOver={e => { if (!(value >= max)) e.currentTarget.style.background = '#b92d2a'; }}
                  onMouseOut={e => { if (!(value >= max)) e.currentTarget.style.background = '#fd655c'; }}
                  onFocus={e => { if (!(value >= max)) e.currentTarget.style.background = '#b92d2a'; }}
                  onBlur={e => { if (!(value >= max)) e.currentTarget.style.background = '#fd655c'; }}
                >
                  <Image src="/assets/ChevronLeft.png" alt=">" width={18} height={18} style={{ filter: 'brightness(0) invert(1)', transform: 'rotate(180deg)' }} />
                </button>
              </div>
              <span className="stat-value text-xl text-gray-700 text-right pl-4 flex-shrink-0 w-8 min-w-[2ch] font-[Figtree,Inter,sans-serif] tracking-wide" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
} 