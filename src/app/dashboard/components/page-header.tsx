import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string | ReactNode;
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between space-y-2 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{title}</h1>
        {description && <div className="text-muted-foreground">{description}</div>}
      </div>
      {children && <div className="flex items-center space-x-2">{children}</div>}
    </div>
  );
}
