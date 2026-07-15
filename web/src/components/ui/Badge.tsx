import { ReactNode } from 'react';

type Color = 'cyan' | 'success' | 'warning' | 'danger' | 'neutral';

interface Props {
  color?: Color;
  children: ReactNode;
}

const COLORS: Record<Color, string> = {
  cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  neutral: 'bg-white/5 text-slate-400 border-white/10',
};

export function Badge({ color = 'cyan', children }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${COLORS[color]}`}
    >
      {children}
    </span>
  );
}
