export const theme = {
  colors: {
    cardBorder: '#AA8B83',
    cardShadow: 'rgba(52, 79, 58, 0.10)',
    sectionHeaderBg: '#d0cdbe',
    sectionHeaderBorder: '#d1cfc7',
    cardBg: '#F5F5F2',
  },
  spacing: {
    cardPadding: '2rem',
    sectionHeaderPadding: '0.75rem 1.5rem',
  },
  borderRadius: {
    card: '18px',
    sectionHeader: '14px',
  },
  typography: {
    sectionHeader: {
      fontSize: '1.18rem',
      fontWeight: 'bold',
      fontFamily: 'Figtree, Inter, sans-serif',
      letterSpacing: '0.01em',
    },
  },
  shadows: {
    card: '0 4px 16px rgba(52, 79, 58, 0.10)',
  },
} as const; 