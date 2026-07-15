import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

type Accent = 'cyan' | 'success' | 'warning' | 'danger';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: Accent;
  trend?: string;
  trendUp?: boolean;
}

const ACCENTS: Record<Accent, string> = {
  cyan: 'text-neon-cyan bg-neon-cyan/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  danger: 'text-danger bg-danger/10',
};

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'cyan',
  trend,
  trendUp,
}: Props) {
  return (
    <Card className="p-5 animate-fade-in">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${ACCENTS[accent]}`}
      >
        <Icon size={22} />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white leading-tight">{value}</p>
          <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        </div>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
              trendUp
                ? 'text-success bg-success/10'
                : 'text-danger bg-danger/10'
            }`}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
    </Card>
  );
}
