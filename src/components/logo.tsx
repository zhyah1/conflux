import type { HTMLAttributes } from 'react';

export function Logo(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`flex items-center justify-center font-bold text-lg bg-primary text-primary-foreground rounded-md ${props.className}`}
    >
      CF
    </div>
  );
}
