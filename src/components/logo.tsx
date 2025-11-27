import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Box } from 'lucide-react';

export function Logo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'flex items-center justify-center bg-black text-primary rounded-md border border-primary/30 shadow-lg shadow-primary/20',
        className
      )}
    >
      <Box className="h-[60%] w-[60%]" />
    </div>
  );
}
