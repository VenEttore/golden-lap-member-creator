interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      {title && (
        <div className="text-lg font-semibold mb-4">{title}</div>
      )}
      {children}
    </div>
  );
} 