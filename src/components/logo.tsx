import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22V12" />
      <path d="M12 12L6 9" />
      <path d="M12 12L18 9" />
      <path d="M12 12L6 15" />
      <path d="M12 12L18 15" />
      <path d="M12 2L6 9" />
      <path d="M12 2L18 9" />
      <path d="M6 9L6 15" />
      <path d="M18 9L18 15" />
    </svg>
  );
}
