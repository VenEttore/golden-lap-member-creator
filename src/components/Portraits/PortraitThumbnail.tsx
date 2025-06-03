import React from 'react';
import Image from 'next/image';
import { PortraitConfig } from '@/types/portrait';

function PortraitThumbnail({ portrait }: { portrait: PortraitConfig }) {
  const url = portrait.fullSizeImage || portrait.thumbnail;
  return (
    <Image
      src={url}
      alt={portrait.name}
      width={40}
      height={40}
      style={{ borderRadius: 6, border: '1px solid #ccc', background: '#fff', flexShrink: 0 }}
    />
  );
}

export default PortraitThumbnail; 