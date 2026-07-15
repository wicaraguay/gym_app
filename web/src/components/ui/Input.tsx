import { InputHTMLAttributes, ReactNode } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ className = '', icon, ...props }: Props) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
      )}
      <input
        className={`w-full ${icon ? 'pl-10' : 'px-3.5'} pr-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 placeholder:text-slate-500 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/40 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
