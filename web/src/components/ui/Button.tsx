import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
  };
  const variants = {
    primary: 'bg-neon-cyan text-body hover:shadow-neon-cyan hover:brightness-110',
    ghost: 'border border-line text-slate-300 hover:bg-white/5 hover:text-white',
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
