import { InputHTMLAttributes, ReactNode, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

// Campo de contrasena con boton de "ojito" para ver/ocultar lo que se escribe.
export function PasswordInput({ className = '', icon, ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
      )}
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={`w-full ${icon ? 'pl-10' : 'px-3.5'} pr-10 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 placeholder:text-slate-500 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan/40 transition-all ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Ocultar contrasena' : 'Ver contrasena'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
