import React from 'react';
import { getPortraits } from '@/utils/portraitStorage';
import PortraitThumbnail from '../Portraits/PortraitThumbnail';

interface PortraitThumbnailForMemberProps {
  portraitName?: string;
}

export default function PortraitThumbnailForMember({ portraitName }: PortraitThumbnailForMemberProps) {
  const [portrait, setPortrait] = React.useState<any>(null);

  React.useEffect(() => {
    if (!portraitName) {
      setPortrait(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const portraits = await getPortraits();
      if (cancelled) return;
      const found = portraits.find((p: any) => p.name === portraitName);
      setPortrait(found || null);
    })();
    return () => { cancelled = true; };
  }, [portraitName]);

  if (portrait) {
    return <PortraitThumbnail portrait={portrait} />;
  }

  return (
    <div style={{ 
      width: 40, 
      height: 40, 
      borderRadius: 6, 
      background: '#ece9e2', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: '#bbb', 
      fontWeight: 700, 
      fontSize: 22 
    }}>
      ?
    </div>
  );
} 