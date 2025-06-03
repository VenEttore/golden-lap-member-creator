import React from 'react';
import { Button } from '../MemberCreator/MemberCreatorModern';

interface MemberHeaderProps {
  onAdd: () => void;
  onAddToModpack: () => void;
  onBatchDelete: () => void;
  onGenerateRandom: () => void;
  selectedCount: number;
}

export default function MemberHeader({
  onAdd,
  onAddToModpack,
  onBatchDelete,
  onGenerateRandom,
  selectedCount,
}: MemberHeaderProps) {
  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      <Button onClick={onAdd}>Add Member</Button>
      <Button onClick={onGenerateRandom} style={{ background: '#e7e4d4', color: '#333' }}>
        Generate Random
      </Button>
      <Button
        onClick={onAddToModpack}
        style={{ background: '#ece9e2', color: '#b92d2a' }}
        disabled={selectedCount === 0}
      >
        Add to Modpack ({selectedCount})
      </Button>
      <Button
        onClick={onBatchDelete}
        style={{ background: '#ece9e2', color: '#b92d2a' }}
        disabled={selectedCount === 0}
      >
        Delete Selected ({selectedCount})
      </Button>
    </div>
  );
} 