import type { SVGProps } from "react";

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
      <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4" />
      <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
      <path d="M12 2v10" />
      <path d="m16 6-4 4-4-4" />
    </svg>
  );
}
