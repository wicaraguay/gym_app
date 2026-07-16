import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingDown,
  Users,
  CheckCircle2,
  Snowflake,
  RotateCcw,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useConfirm, useAlert } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Batch {
  batchId: string;
  count: number;
  days: number;
  reason: string | null;
  createdAt: string;
}

interface Summary {
  monthlyIncome: number;
  totalMembers: number;
  activeMembers: number;
  paidMemberships: number;
  pendingMemberships: number;
  pendingBalance: number;
  recentPayments: {
    id: string;
    amount: number;
    paidAt: string;
    member: string;
    plan: string;
  }[];
}

export function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const confirm = useConfirm();
  const notify = useAlert(); // ventanita para bloqueos
  const toast = useToast(); // toast para exitos
  const [data, setData] = useState<Summary | null>(null);
  const [mafDays, setMafDays] = useState('');
  const [mafReason, setMafReason] = useState('');
  const [mafLoading, setMafLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);

  const load = () => api.get('/dashboard/summary').then((r) => setData(r.data));
  const loadBatches = () =>
    api.get('/memberships/freeze-batches').then((r) => setBatches(r.data));

  useEffect(() => {
    load();
    if (isAdmin) loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doFreezeAll = async () => {
    const days = Number(mafDays);
    if (!days || days <= 0) {
      notify('Ingresá cuántos días vas a congelar (mayor a 0).');
      return;
    }

    // Sin membresias vigentes no hay nada que congelar: avisamos y salimos,
    // en vez de pedir confirmar y despues reportar "0 congeladas".
    const activasCount =
      (data?.paidMemberships ?? 0) + (data?.pendingMemberships ?? 0);
    if (activasCount === 0) {
      notify(
        'En este momento no tienes clientes con una membresia activa. El congelamiento masivo corre el vencimiento de las membresias vigentes, y ahora no hay ninguna.',
        'No hay clientes para congelar',
      );
      return;
    }

    const ok = await confirm({
      title: 'Congelamiento masivo',
      message: `Congelar ${days} dias a TODAS las membresias activas? Corre el vencimiento de todos.`,
      confirmText: 'Congelar a todos',
    });
    if (!ok) return;
    setMafLoading(true);
    try {
      const res = await api.post('/memberships/freeze-all', {
        days,
        reason: mafReason || undefined,
      });
      // Red de seguridad: el backend no encontro vigentes (p. ej. todas futuras).
      if (res.data.affected === 0) {
        notify(
          'No se encontraron membresias vigentes para congelar en este momento.',
          'No hay clientes para congelar',
        );
        return;
      }
      toast.success(`Listo: ${res.data.affected} membresia(s) congelada(s) ${days} dias.`);
      setMafDays('');
      setMafReason('');
      load();
      loadBatches();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Error al congelar');
    } finally {
      setMafLoading(false);
    }
  };

  const revertBatch = async (b: Batch) => {
    const ok = await confirm({
      title: 'Revertir masivo',
      message: `Revertir este masivo de ${b.days} dias? Se les quita a los ${b.count} cliente(s) que lo recibieron.`,
      confirmText: 'Revertir a todos',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const r = await api.delete(`/memberships/freeze-batch/${b.batchId}`);
      toast.success(`Masivo revertido a ${r.data.reverted} cliente(s).`);
      loadBatches();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo revertir');
    }
  };

  if (!data) return <p className="text-slate-400">Cargando...</p>;

  const totalMs = data.paidMemberships + data.pendingMemberships || 1;
  const paidPct = (data.paidMemberships / totalMs) * 100;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm">Resumen general del negocio</p>
      </div>

      {/* Metric cards: 2x2 en movil, 4 en una fila en desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Ingresos del mes"
          value={`$${data.monthlyIncome.toFixed(2)}`}
          accent="success"
        />
        <StatCard
          icon={TrendingDown}
          label="Saldo por cobrar"
          value={`$${data.pendingBalance.toFixed(2)}`}
          accent="warning"
        />
        <StatCard
          icon={Users}
          label="Clientes activos"
          value={data.activeMembers}
          accent="cyan"
        />
        <StatCard
          icon={CheckCircle2}
          label="Membresias al dia"
          value={`${data.paidMemberships} / ${totalMs}`}
          accent="success"
        />
      </div>

      {/* Estado de membresias + congelamiento masivo, lado a lado en desktop */}
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Card className="p-5">
          <h3 className="font-semibold text-white mb-4">Estado de membresias</h3>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Al dia</span>
            <span className="text-success font-medium">
              {data.paidMemberships}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-slate-400">Pendientes</span>
            <span className="text-warning font-medium">
              {data.pendingMemberships}
            </span>
          </div>
          <div className="h-3 rounded-full bg-surface-2 overflow-hidden flex">
            <div className="h-full bg-success" style={{ width: `${paidPct}%` }} />
            <div
              className="h-full bg-warning"
              style={{ width: `${100 - paidPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {paidPct.toFixed(0)}% de las membresias estan pagadas por completo.
          </p>
        </Card>

        {/* Congelamiento masivo (solo admin) */}
        {isAdmin && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Snowflake size={16} className="text-neon-cyan" />
            <p className="text-sm font-medium text-white">
              Congelamiento masivo
            </p>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Feriados, mudanza de local, etc. Corre el vencimiento de TODAS las
            membresias activas.
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {[2, 3, 5, 8, 10, 15].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMafDays(String(d))}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  mafDays === String(d)
                    ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40'
                    : 'border-line text-slate-300 hover:bg-white/5'
                }`}
              >
                {d} dias
              </button>
            ))}
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="otros"
              value={mafDays}
              onChange={(e) => setMafDays(e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg bg-surface-2 border border-line text-slate-100 text-xs focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Motivo (ej. Feriado, Mudanza)"
              value={mafReason}
              onChange={(e) => setMafReason(e.target.value)}
              className="sm:max-w-xs"
            />
            <Button onClick={doFreezeAll} disabled={mafLoading || !mafDays}>
              {mafLoading ? 'Congelando...' : 'Congelar a todos'}
            </Button>
          </div>

          {/* Historial de masivos activos: revertir a todos desde aca */}
          {batches.length > 0 && (
            <div className="mt-5 pt-4 border-t border-line">
              <p className="text-xs text-slate-400 mb-2">
                Congelamientos masivos activos
              </p>
              <div className="space-y-2">
                {batches.map((b) => (
                  <div
                    key={b.batchId}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2 border border-line"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200">
                        {b.days} dias
                        {b.reason && (
                          <span className="text-slate-400"> · {b.reason}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.count} cliente(s) ·{' '}
                        {new Date(b.createdAt).toLocaleDateString('es-EC')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => revertBatch(b)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
                    >
                      <RotateCcw size={13} /> Revertir a todos
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        )}
      </div>
    </div>
  );
}
