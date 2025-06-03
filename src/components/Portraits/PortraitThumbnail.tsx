import React from 'react';
import { PortraitConfig } from '@/types/portrait';

function PortraitThumbnail({ portrait }: { portrait: PortraitConfig }) {
  const url = portrait.fullSizeImage || portrait.thumbnail;
  return (
    <img
      src={url}
      alt={portrait.name}
      width={40}
      height={40}
      style={{ borderRadius: 6, border: '1px solid #ccc', background: '#fff', flexShrink: 0 }}
    />
  );
}

export default PortraitThumbnail; 