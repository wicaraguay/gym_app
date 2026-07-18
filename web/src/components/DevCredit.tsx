// Credito del desarrollador. Reutilizable: se usa en el login y en el admin.
export function DevCredit({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-slate-600 ${className}`}>
      Desarrollado por{' '}
      <a
        href="https://willytech.dev/"
        target="_blank"
        rel="noreferrer"
        className="text-slate-400 hover:text-neon-cyan transition-colors font-medium"
      >
        Willy Tech
      </a>
    </p>
  );
}
