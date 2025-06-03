import React from 'react';
import ReactDOM from 'react-dom';

interface TraitTooltipProps {
  title: string;
  description: string;
  x: number;
  y: number;
  hideTooltip?: () => void;
}

// Helper to clamp a value between min and max
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function TraitTooltipBody({ title, description, x, y }: TraitTooltipProps) {
  // Tooltip dimensions and offset (approximate, matches legacy)
  const OFFSET = 16;
  const TOOLTIP_WIDTH = 340; // px
  const TOOLTIP_HEIGHT = 70; // px

  let left = x + OFFSET;
  let top = y + OFFSET;

  // If tooltip would overflow right, shift left
  if (left + TOOLTIP_WIDTH > window.innerWidth) {
    left = x - TOOLTIP_WIDTH - OFFSET;
    if (left < 0) left = window.innerWidth - TOOLTIP_WIDTH - 8; // fallback
  }
  // If tooltip would overflow bottom, shift up
  if (top + TOOLTIP_HEIGHT > window.innerHeight) {
    top = y - TOOLTIP_HEIGHT - OFFSET;
    if (top < 0) top = window.innerHeight - TOOLTIP_HEIGHT - 8; // fallback
  }

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        flexWrap: 'nowrap',
        background: 'none',
        boxShadow: '0 6px 32px rgba(0,0,0,0.28)',
        borderRadius: 14,
        overflow: 'hidden',
        minWidth: 0,
        maxWidth: 600,
        pointerEvents: 'none',
        fontFamily: 'Figtree, Inter, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fdf6e3',
          color: '#222',
          fontWeight: 700,
          fontSize: '1.05em',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          padding: '0.7em 1.5em',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '14px 0 0 14px',
          whiteSpace: 'nowrap',
          boxShadow: 'none',
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: '#232323',
          color: '#fff',
          fontFamily: 'Figtree, Inter, sans-serif',
          fontWeight: 400,
          fontSize: '1em',
          padding: '0.7em 1.6em 0.7em 1.2em',
          display: 'flex',
          alignItems: 'center',
          borderRadius: '0 14px 14px 0',
          minWidth: 0,
          maxWidth: 420,
          textAlign: 'left',
          whiteSpace: 'pre-line',
        }}
      >
        {description}
      </div>
    </div>
  );
}

export function TraitTooltip(props: TraitTooltipProps) {
  if (typeof window === 'undefined') return null;
  return ReactDOM.createPortal(
    <TraitTooltipBody {...props} />,
    document.body
  );
}

// Hook to manage tooltip state and positioning
export function useTraitTooltip() {
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; title: string; description: string } | null>(null);

  const showTooltip = React.useCallback((e: React.MouseEvent, title: string, description: string) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title,
      description,
    });
  }, []);

  const moveTooltip = React.useCallback((e: React.MouseEvent) => {
    setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  }, []);

  const hideTooltip = React.useCallback(() => {
    setTooltip(null);
  }, []);

  // Pass hideTooltip to the tooltip props
  const tooltipWithHide = tooltip ? { ...tooltip, hideTooltip } : null;

  return {
    tooltip: tooltipWithHide,
    showTooltip,
    moveTooltip,
    hideTooltip,
  };
}

export { clamp }; 