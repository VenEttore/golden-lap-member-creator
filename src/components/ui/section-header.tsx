import { theme } from '@/styles/theme';

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className = '' }: SectionHeaderProps) {
  return (
    <div
      style={{
        background: theme.colors.sectionHeaderBg,
        borderTopLeftRadius: theme.borderRadius.sectionHeader,
        borderTopRightRadius: theme.borderRadius.sectionHeader,
        borderBottom: `2px solid ${theme.colors.sectionHeaderBorder}`,
        marginTop: 0,
        marginBottom: 0,
        padding: theme.spacing.sectionHeaderPadding,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      }}
      className={`font-bold text-[#222] flex items-center gap-3 font-[Figtree,Inter,sans-serif] tracking-[0.01em] justify-center text-center ${className}`}
    >
      {children}
    </div>
  );
} 