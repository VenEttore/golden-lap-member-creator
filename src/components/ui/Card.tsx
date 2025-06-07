import { theme } from '@/styles/theme';
import { SectionHeader } from './section-header';

interface CardProps {
  children: React.ReactNode;
  title: string;
  className?: string;
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div
      style={{
        background: theme.colors.cardBg,
        border: `2px solid ${theme.colors.cardBorder}`,
        boxShadow: theme.shadows.card,
        borderRadius: theme.borderRadius.card,
        paddingTop: 0,
      }}
      className={`overflow-hidden flex flex-col min-h-[260px] p-0 gap-0 ${className}`}
    >
      <SectionHeader>{title}</SectionHeader>
      <div className="py-8 px-8 flex-1 flex flex-col gap-4">{children}</div>
    </div>
  );
} 