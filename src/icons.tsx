// Inline SVG icon set - consistent 1.5px stroke. Ported from the v2 prototype.
import type { SVGProps, ReactNode } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const Icon = ({ size = 18, fill = 'none', stroke = 'currentColor', children, ...p }: IconProps & { children?: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
);

export const I = {
  Home: (p: IconProps) => <Icon {...p}><path d="M3 10.5 12 3l9 7.5V21h-6v-7h-6v7H3z" /></Icon>,
  Work: (p: IconProps) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>,
  About: (p: IconProps) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></Icon>,
  Lab: (p: IconProps) => <Icon {...p}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /></Icon>,
  Book: (p: IconProps) => <Icon {...p}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 0 2 2h12" /></Icon>,
  Mail: (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>,
  Link: (p: IconProps) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.7-1.7" /></Icon>,
  Arrow: (p: IconProps) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>,
  ArrowUR: (p: IconProps) => <Icon {...p}><path d="M7 17 17 7M8 7h9v9" /></Icon>,
  Close: (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>,
  Git: (p: IconProps) => <Icon {...p}><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="6" cy="6" r="2.5" /><path d="M6 8.5v7M8.5 6H15a3 3 0 0 1 3 3v6.5" /></Icon>,
  Linked: (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></Icon>,
  Map: (p: IconProps) => <Icon {...p}><path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Icon>,
  File: (p: IconProps) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></Icon>,
  Zap: (p: IconProps) => <Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></Icon>,
  Flask: (p: IconProps) => <Icon {...p}><path d="M9 3h6M10 3v7L4 20a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3" /></Icon>,
  Cpu: (p: IconProps) => <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></Icon>,
  DB: (p: IconProps) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0" /></Icon>,
  Search: (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>,
  Play: (p: IconProps) => <Icon {...p}><path d="M7 4v16l13-8z" /></Icon>,
  Pause: (p: IconProps) => <Icon {...p}><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></Icon>,
  Terminal: (p: IconProps) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></Icon>,
  Copy: (p: IconProps) => <Icon {...p}><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M3 15V5a2 2 0 0 1 2-2h10" /></Icon>,
  Check: (p: IconProps) => <Icon {...p}><path d="M5 12l4 4L19 7" /></Icon>,
  Minus: (p: IconProps) => <Icon {...p}><path d="M5 12h14" /></Icon>,
  Plus: (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Sparkle: (p: IconProps) => <Icon {...p}><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3.5 3.5M14.5 14.5 18 18M6 18l3.5-3.5M14.5 9.5 18 6" /></Icon>,
  Code: (p: IconProps) => <Icon {...p}><path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 4l-4 16" /></Icon>,
  Layers: (p: IconProps) => <Icon {...p}><path d="m12 2 10 6-10 6-10-6zM2 14l10 6 10-6M2 18l10 6 10-6" /></Icon>,
  Eye: (p: IconProps) => <Icon {...p}><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>,
  Compass: (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="m16 8-5 3-3 5 5-3z" /></Icon>,
  Key: (p: IconProps) => <Icon {...p}><circle cx="7" cy="17" r="3" /><path d="m9 15 9-9M15 9l3 3M12 12l3 3" /></Icon>,
};

export type IconName = keyof typeof I;
