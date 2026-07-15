interface Props {
  data: { label: string; value: number }[];
}

export function MiniBars({ data }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-slate-500">
        Sin datos todavia
      </div>
    );
  }
  return (
    <div className="flex items-end gap-3 h-44 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            ${d.value.toFixed(0)}
          </span>
          <div className="w-full flex items-end h-full">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-neon-cyan/20 to-neon-cyan transition-all"
              style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
