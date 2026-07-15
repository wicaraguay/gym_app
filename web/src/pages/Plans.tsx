import { FormEvent, useEffect, useState } from 'react';
import { CreditCard, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: string;
  durationDays: number;
  durationMonths: number;
  active: boolean;
}

const durationLabel = (p: Plan) =>
  p.durationMonths > 0
    ? p.durationMonths === 1
      ? '1 mes'
      : `${p.durationMonths} meses`
    : `${p.durationDays} dias`;

export function Plans() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const confirm = useConfirm();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: '', price: '', amount: '1', unit: 'mes' });
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 8;

  const load = () => api.get('/plans').then((r) => setPlans(r.data));
  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: any = { name: form.name, price: Number(form.price) };
      if (form.unit === 'mes') payload.durationMonths = Number(form.amount);
      else payload.durationDays = Number(form.amount);
      await api.post('/plans', payload);
      setForm({ name: '', price: '', amount: '1', unit: 'mes' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  const savePrice = async (id: string) => {
    await api.patch(`/plans/${id}`, { price: Number(editPrice) });
    setEditing(null);
    load();
  };

  const toggleActive = async (p: Plan) => {
    await api.patch(`/plans/${p.id}`, { active: !p.active });
    load();
  };

  const deletePlan = async (p: Plan) => {
    const ok = await confirm({
      title: 'Eliminar plan',
      message: `Eliminar el plan "${p.name}" de forma permanente? Solo es posible si no tiene membresias.`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    setError('');
    try {
      await api.delete(`/plans/${p.id}`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se puede eliminar');
    }
  };

  // Paginacion en cliente: /plans devuelve todo, cortamos de a 8.
  const totalPages = Math.max(1, Math.ceil(plans.length / LIMIT));
  const currentPage = Math.min(page, totalPages);
  const pageItems = plans.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Planes</h1>
        <p className="text-slate-400 text-sm">
          Precios y duracion de las membresias
        </p>
      </div>

      {isAdmin && (
        <Card className="p-4 sm:p-5">
          <p className="text-sm font-medium text-white mb-3">Crear plan nuevo</p>
          <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Nombre (ej. Mensual)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Precio"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-20"
                required
              />
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 focus:border-neon-cyan focus:outline-none"
              >
                <option value="mes">mes(es)</option>
                <option value="dia">dia(s)</option>
              </select>
            </div>
            <Button type="submit">
              <Plus size={16} /> Crear
            </Button>
          </form>
          {error && <p className="text-danger text-sm mt-2">{error}</p>}
        </Card>
      )}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pageItems.map((p) => (
          <Card
            key={p.id}
            className={`p-5 border-l-4 ${
              p.active ? 'border-l-success' : 'border-l-slate-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                <CreditCard size={20} className="text-neon-cyan" />
              </div>
              {!p.active && <Badge color="neutral">Inactivo</Badge>}
            </div>
            <h3 className="font-semibold text-white">{p.name}</h3>
            <p className="text-slate-500 text-sm mb-3">
              {p.description || `Duracion: ${durationLabel(p)}`}
            </p>

            {editing === p.id ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-28"
                />
                <Button size="sm" onClick={() => savePrice(p.id)}>
                  Guardar
                </Button>
              </div>
            ) : (
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-white">
                    ${Number(p.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {' '}
                    / {durationLabel(p)}
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditing(p.id);
                      setEditPrice(String(p.price));
                    }}
                    className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                  >
                    <Pencil size={12} /> Precio
                  </button>
                )}
              </div>
            )}
            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-line flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(p)}
                  className="flex-1"
                >
                  <Power size={14} /> {p.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deletePlan(p)}
                  className="flex-1"
                >
                  <Trash2 size={14} /> Eliminar
                </Button>
              </div>
            )}
          </Card>
        ))}
        {plans.length === 0 && (
          <p className="col-span-full text-slate-500 text-sm">
            No hay planes todavia.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-400">
            Pagina {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
