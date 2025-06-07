import React from 'react';
import { Toggle } from '../ui/toggle';

interface ToggleButtonProps {
  value: boolean;
  onChange: (v: boolean) => void;
  onText?: string;
  offText?: string;
  className?: string;
}

export function ToggleButton({ value, onChange, onText = 'On', offText = 'Off', className = '' }: ToggleButtonProps) {
  return (
    <Toggle
      pressed={value}
      onClick={() => onChange(!value)}
      className={`px-5 py-2 rounded-full border font-semibold font-[Figtree,Inter,sans-serif] text-base min-w-[120px] transition-all shadow-none cursor-pointer ${className}`}
      style={{ minWidth: 120 }}
    >
      {value ? onText : offText}
    </Toggle>
  );
} 