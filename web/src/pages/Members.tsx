import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Phone, X } from 'lucide-react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

type BadgeColor = 'success' | 'warning' | 'danger' | 'neutral';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  identification: string;
  phone?: string;
  email?: string;
  active?: boolean;
  planName?: string | null;
  endDate?: string | null;
  balance: number;
  hasMembership: boolean;
  expired: boolean;
  owes: boolean;
}

const EMPTY = {
  identification: '',
  fullName: '',
  phone: '',
  email: '',
};

// Dos dimensiones independientes (vencida / debe) -> hasta dos badges.
// vencida + debe conviven: se muestran los dos.
function statusBadges(m: Member): { color: BadgeColor; label: string }[] {
  if (!m.hasMembership) return [{ color: 'neutral', label: 'Sin membresia' }];
  const badges: { color: BadgeColor; label: string }[] = [];
  if (m.expired) badges.push({ color: 'danger', label: 'Vencida' });
  if (m.owes) badges.push({ color: 'warning', label: 'Pendiente' });
  if (badges.length === 0) badges.push({ color: 'success', label: 'Al dia' });
  return badges;
}

// Chips de filtro (key = valor que espera el backend; 'TODOS' = sin filtro).
// Pendientes = debe pago (aunque este vencida). Vencidas = expiro el mes.
const FILTERS: { key: string; label: string }[] = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'PAGADO', label: 'Al dia' },
  { key: 'PENDIENTE', label: 'Deben' },
  { key: 'VENCIDO', label: 'Vencidas' },
];

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

// "Vence 15 ago" (vigente) / "Vencio 02 jul" (vencida)
function fmtVence(iso?: string | null, expired?: boolean): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const txt = `${d.getDate()} ${MESES[d.getMonth()]}`;
  return expired ? `Vencio ${txt}` : `Vence ${txt}`;
}

export function Members() {
  const navigate = useNavigate();
  const LIMIT = 8;
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/members', { params: { search, page, limit: LIMIT, status } })
      .then((r) => {
        setMembers(r.data.data);
        setTotal(r.data.total);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page, status]);

  const totalPages = Math.ceil(total / LIMIT);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // Un solo campo "Nombre completo" -> lo dividimos en nombres/apellidos
      // (primera mitad = nombres, segunda mitad = apellidos).
      const tokens = form.fullName.trim().split(/\s+/).filter(Boolean);
      const mid = Math.max(1, Math.ceil(tokens.length / 2));
      await api.post('/members', {
        identification: form.identification,
        firstName: tokens.slice(0, mid).join(' '),
        lastName: tokens.slice(mid).join(' '),
        phone: form.phone || undefined,
        email: form.email || undefined,
      });
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el cliente');
    }
  };

  const inits = (m: Member) =>
    `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Encabezado: apila en movil */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm">
            {total} cliente{total === 1 ? '' : 's'}
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="w-full sm:w-auto"
        >
          {showForm ? <X size={16} /> : <UserPlus size={16} />}
          {showForm ? 'Cerrar' : 'Nuevo cliente'}
        </Button>
      </div>

      {/* Formulario de alta */}
      {showForm && (
        <Card className="p-4 sm:p-5 animate-fade-in">
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Cedula / RUC"
              inputMode="numeric"
              value={form.identification}
              onChange={(e) => setForm({ ...form, identification: e.target.value })}
              required
            />
            <Input
              placeholder="Nombre completo"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              className="sm:col-span-2"
            />
            <Input
              placeholder="Telefono"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Email (opcional)"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {error && (
              <p className="text-danger text-sm sm:col-span-2">{error}</p>
            )}
            <Button type="submit" className="w-full sm:col-span-2">
              Guardar cliente
            </Button>
          </form>
        </Card>
      )}

      {/* Buscador */}
      <Input
        placeholder="Buscar cliente por nombre o cedula..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        icon={<Search size={20} />}
        className="w-full py-3.5 text-base"
      />

      {/* Filtro por estado de membresia */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const activeChip = status === f.key;
          return (
            <button
              key={f.key}
              onClick={() => {
                setStatus(f.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeChip
                  ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Listado en tarjetas: 2 en movil, 3 en tablet, 4 en escritorio */}
      {members.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400 text-sm">
            {search || status !== 'TODOS'
              ? 'Sin resultados para tu busqueda.'
              : 'No hay clientes todavia.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {members.map((m) => {
            const badges = statusBadges(m);
            const vence = fmtVence(m.endDate, m.expired);
            // Borde de color = estado, para leerlo de un vistazo sin texto.
            const accentBorder =
              m.active === false
                ? 'border-l-slate-600'
                : m.expired
                  ? 'border-l-danger'
                  : m.owes
                    ? 'border-l-warning'
                    : 'border-l-success';
            return (
              <button
                key={m.id}
                onClick={() => navigate(`/members/${m.id}`)}
                className={`flex flex-col gap-3 p-4 rounded-2xl bg-surface border border-line border-l-4 ${accentBorder} hover:bg-white/5 active:bg-white/10 transition-colors text-left`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-sm font-semibold text-neon-cyan shrink-0">
                    {inits(m)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {m.active === false && (
                      <Badge color="neutral">Inactivo</Badge>
                    )}
                    {badges.map((b) => (
                      <Badge key={b.label} color={b.color}>
                        {b.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-[15px]">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {m.identification}
                    {m.planName && (
                      <span className="text-slate-400"> · {m.planName}</span>
                    )}
                  </p>
                </div>

                <div className="mt-auto space-y-0.5">
                  {m.owes && (
                    <p className="text-sm font-semibold text-warning">
                      Debe ${Number(m.balance).toFixed(2)}
                    </p>
                  )}
                  {(vence || m.phone) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      {vence && <span className="shrink-0">{vence}</span>}
                      {vence && m.phone && <span>·</span>}
                      {m.phone && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <Phone size={11} /> {m.phone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-400">
            Pagina {page} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
