interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
      <div>
        <h1
          className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-white"
          style={{ letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm" style={{ color: '#8b949e' }}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex gap-4">{children}</div>}
    </div>
  );
}
