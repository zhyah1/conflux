import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div
      className="flex items-center justify-center font-bold text-lg bg-primary text-primary-foreground rounded-md"
      style={{ width: props.width, height: props.height }}
    >
      CF
    </div>
  );
}
