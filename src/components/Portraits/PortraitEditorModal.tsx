import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PortraitGeneratorPanel from './PortraitGeneratorPanel';
import { PortraitConfig } from '@/types/portrait';

// App style constants (matching Card/SectionHeader)
const cardBg = '#F5F5F2';
const cardBorder = '#AA8B83';
const sectionHeaderBg = '#d0cdbe';
const sectionHeaderBorder = '#d1cfc7';
const fontFamily = 'Figtree, Inter, sans-serif';

interface PortraitEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (portrait: PortraitConfig) => void;
  initialPortrait?: PortraitConfig;
}

export default function PortraitEditorModal({ isOpen, onClose, onSave, initialPortrait }: PortraitEditorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{
        background: cardBg,
        border: `2px solid ${cardBorder}`,
        borderRadius: 18,
        boxShadow: `0 4px 16px rgba(52, 79, 58, 0.10)`,
        padding: 0,
        fontFamily,
        maxHeight: '95vh',
        overflow: 'auto',
        minWidth: 360,
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        width: 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }} className="max-w-4xl">
        <DialogHeader>
          <DialogTitle asChild>
            <div style={{
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
              fontWeight: 700,
              fontSize: '1.18rem',
              color: '#222',
              fontFamily,
              letterSpacing: '0.01em',
            }}>Edit Portrait</div>
          </DialogTitle>
        </DialogHeader>
        <div style={{ padding: '2rem', fontFamily, overflow: 'auto' }}>
          <PortraitGeneratorPanel
            initialConfig={initialPortrait?.config}
            initialName={initialPortrait?.name}
            onSave={portrait => {
              onSave(portrait);
              onClose();
            }}
            onCancel={onClose}
            noCardWrapper
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 