import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Power,
  Trash2,
  Pencil,
  Wallet,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Snowflake,
  X,
  ChevronDown,
  History,
  Clock,
} from 'lucide-react';
import { api } from '../lib/api';
import { emitRefresh } from '../lib/events';
import {
  getReminderKind,
  reminderLabel,
  buildReminderMessage,
  whatsappUrl,
} from '../lib/whatsapp';
import {
  validateAmount,
  validateIdentification,
  validateEmail,
  validatePhone,
  validateDays,
  splitFullName,
  firstError,
} from '../lib/validation';
import { useAuth } from '../context/AuthContext';
import { useConfirm, useAlert } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';

// Estado TEMPORAL de una membresia, independiente del pago:
//   PROXIMA = aun no empieza (comprada por adelantado, en cola)
//   VIGENTE = corriendo ahora
//   VENCIDA = ya termino
type PeriodState = 'PROXIMA' | 'VIGENTE' | 'VENCIDA';

const periodState = (m: any): PeriodState => {
  const now = Date.now();
  if (new Date(m.startDate).getTime() > now) return 'PROXIMA';
  if (new Date(m.endDate).getTime() <= now) return 'VENCIDA';
  return 'VIGENTE';
};

const PERIOD_BADGE: Record<
  PeriodState,
  { color: 'cyan' | 'success' | 'danger'; label: string }
> = {
  PROXIMA: { color: 'cyan', label: 'En cola' },
  VIGENTE: { color: 'success', label: 'Vigente' },
  VENCIDA: { color: 'danger', label: 'Vencida' },
};

// Orden de la lista: primero la vigente que vence antes, luego las que vienen
// en cola (por fecha de inicio), y al fondo las vencidas (historial reciente).
const PERIOD_ORDER: Record<PeriodState, number> = {
  VIGENTE: 0,
  PROXIMA: 1,
  VENCIDA: 2,
};

const sortMemberships = (list: any[]): any[] =>
  [...list].sort((a, b) => {
    const sa = periodState(a);
    const sb = periodState(b);
    if (PERIOD_ORDER[sa] !== PERIOD_ORDER[sb]) {
      return PERIOD_ORDER[sa] - PERIOD_ORDER[sb];
    }
    const aStart = new Date(a.startDate).getTime();
    const bStart = new Date(b.startDate).getTime();
    const aEnd = new Date(a.endDate).getTime();
    const bEnd = new Date(b.endDate).getTime();
    if (sa === 'VENCIDA') return bEnd - aEnd; // mas reciente primero
    if (sa === 'PROXIMA') return aStart - bStart; // la que activa antes primero
    return aEnd - bEnd; // VIGENTE: la que vence antes primero
  });

const methodLabel = (m: string) =>
  m === 'TRANSFERENCIA' ? 'Transferencia' : m === 'TARJETA' ? 'Tarjeta' : 'Efectivo';

export function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const confirm = useConfirm();
  const notify = useAlert(); // ventanita para bloqueos
  const toast = useToast(); // toast en la esquina para exitos
  const [member, setMember] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [planId, setPlanId] = useState('');
  const [qty, setQty] = useState('1');
  // Desde cuando cuenta una renovacion: hoy / cuando vencio / una fecha exacta.
  const [startMode, setStartMode] = useState<'hoy' | 'vencio' | 'custom'>('hoy');
  const [customDate, setCustomDate] = useState('');
  const [abono, setAbono] = useState<Record<string, string>>({});
  const [payingId, setPayingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingMemId, setSavingMemId] = useState<string | null>(null);
  const [freezingBusy, setFreezingBusy] = useState(false);
  const [method, setMethod] = useState<Record<string, string>>({});
  const [freezingId, setFreezingId] = useState<string | null>(null);
  const [freezeVal, setFreezeVal] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [editMemId, setEditMemId] = useState<string | null>(null);
  const [editMemForm, setEditMemForm] = useState({ planId: '', quantity: '1' });
  const [businessName, setBusinessName] = useState('');

  const load = () => api.get(`/members/${id}`).then((r) => setMember(r.data));

  useEffect(() => {
    load();
    api.get('/plans').then((r) => setPlans(r.data));
    // Nombre del negocio para pre-armar el mensaje de WhatsApp (endpoint publico).
    api
      .get('/settings/public')
      .then((r) => setBusinessName(r.data.businessName || ''))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openEdit = () => {
    setEditForm({
      fullName: `${member.firstName} ${member.lastName}`.trim(),
      identificationType: member.identificationType,
      identification: member.identification,
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const name = splitFullName(editForm.fullName);
    const err = firstError(
      name ? null : 'Escribi nombre y apellido (al menos dos palabras).',
      validateIdentification(editForm.identification, editForm.identificationType),
      validatePhone(editForm.phone || ''),
      validateEmail(editForm.email || '', true),
    );
    if (err) {
      notify(err);
      return;
    }
    setSavingEdit(true);
    try {
      await api.patch(`/members/${id}`, {
        firstName: name!.firstName,
        lastName: name!.lastName,
        identificationType: editForm.identificationType,
        identification: editForm.identification.trim(),
        phone: (editForm.phone || '').trim() || undefined,
        email: (editForm.email || '').trim() || undefined,
        address: (editForm.address || '').trim() || undefined,
      });
      setEditing(false);
      toast.success('Datos guardados.');
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async () => {
    try {
      await api.patch(`/members/${id}`, { active: !member.active });
      toast.success(member.active ? 'Cliente desactivado.' : 'Cliente activado.');
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo actualizar');
    }
  };

  const deleteMember = async () => {
    const ok = await confirm({
      title: 'Eliminar cliente',
      message:
        'Eliminar este cliente de forma permanente? Solo es posible si no tiene historial.',
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success('Cliente eliminado.');
      navigate('/admin/members');
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se puede eliminar');
    }
  };

  const createMembership = async (anticipado = false, startDate?: string) => {
    if (!planId) {
      notify('Primero elegí una promoción (plan).');
      return;
    }
    if (!qty || Number(qty) < 1) {
      notify('Elegí la cantidad de meses (al menos 1).');
      return;
    }
    try {
      await api.post('/memberships', {
        memberId: id,
        planId,
        quantity: Number(qty),
        startAfterCurrent: anticipado,
        startDate,
      });
      setPlanId('');
      setQty('1');
      setStartMode('hoy');
      setCustomDate('');
      toast.success(anticipado ? 'Compra anticipada registrada.' : 'Membresia inscrita.');
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'Error al inscribir');
    }
  };

  // Editar una membresia creada por error (cambiar plan/cantidad). ADMIN.
  const openEditMem = (m: any) => {
    // Deriva la cantidad actual a partir del precio congelado (precio x qty).
    const unit = Number(m.plan?.price) || 0;
    const derivedQty = unit > 0 ? Math.max(1, Math.round(Number(m.priceSnapshot) / unit)) : 1;
    setEditMemForm({ planId: m.planId, quantity: String(derivedQty) });
    setEditMemId(editMemId === m.id ? null : m.id);
  };

  const saveEditMem = async (m: any) => {
    // Cambiar una membresia con pagos recalcula precio/vencimiento: confirmar.
    if ((m.payments?.length || 0) > 0) {
      const ok = await confirm({
        title: 'Cambiar la membresia',
        message: `Esta membresia ya tiene ${m.payments.length} pago(s). Cambiar el plan o la cantidad recalcula el precio y el vencimiento. Continuar?`,
        confirmText: 'Cambiar',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setSavingMemId(m.id);
    try {
      await api.patch(`/memberships/${m.id}`, {
        planId: editMemForm.planId,
        quantity: Number(editMemForm.quantity),
      });
      setEditMemId(null);
      toast.success('Membresia actualizada.');
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo editar la membresia');
    } finally {
      setSavingMemId(null);
    }
  };

  const deleteMembership = async (m: any) => {
    const pagos = m.payments?.length || 0;
    const totalPagos = (m.payments || []).reduce(
      (s: number, p: any) => s + Number(p.amount),
      0,
    );
    const ok = await confirm({
      title: 'Eliminar membresia',
      message:
        pagos > 0
          ? `Esta membresia tiene ${pagos} abono(s) por $${totalPagos.toFixed(2)}. Al eliminarla se borran TAMBIEN esos pagos. Seguro? (solo hacelo si fue un error)`
          : 'Eliminar esta membresia? No tiene pagos, se borra limpio.',
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/memberships/${m.id}`);
      toast.success('Membresia eliminada.');
      load();
      emitRefresh();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const registerAbono = async (membershipId: string, max: number) => {
    // El abono debe ser positivo y NO puede superar el saldo pendiente.
    const err = validateAmount(abono[membershipId] || '', { max, label: 'El abono' });
    if (err) {
      notify(err); // ventanita: imposible que no lo vea (ej. abono de mas)
      return;
    }
    setPayingId(membershipId);
    try {
      await api.post('/payments', {
        membershipId,
        amount: Number(abono[membershipId]),
        method: method[membershipId] || 'EFECTIVO',
      });
      setAbono({ ...abono, [membershipId]: '' });
      toast.success('Abono registrado.');
      load();
      emitRefresh(); // la campanita suelta al cliente al que se le cobro
    } catch (err: any) {
      notify(err.response?.data?.message || 'Error al registrar el abono');
    } finally {
      setPayingId(null);
    }
  };

  const freezeMembership = async (membershipId: string) => {
    const err = validateDays(freezeVal);
    if (err) {
      notify(err);
      return;
    }
    setFreezingBusy(true);
    try {
      await api.post(`/memberships/${membershipId}/freeze`, { days: Number(freezeVal) });
      setFreezingId(null);
      setFreezeVal('');
      toast.success('Membresia congelada.');
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo congelar');
    } finally {
      setFreezingBusy(false);
    }
  };

  // Solo se cancela el congelamiento INDIVIDUAL desde aca. El masivo se
  // revierte completo desde el Dashboard (por logica, no cliente por cliente).
  const cancelFreeze = async (freezeId: string) => {
    const ok = await confirm({
      title: 'Quitar congelamiento',
      message: 'Quitar este congelamiento? Se restan los dias del vencimiento.',
      confirmText: 'Quitar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/memberships/freezes/${freezeId}`);
      toast.success('Congelamiento quitado.');
      load();
    } catch (err: any) {
      notify(err.response?.data?.message || 'No se pudo quitar');
    }
  };

  if (!member) return <p className="text-slate-400">Cargando...</p>;

  const inits = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();

  // --- Resumen del cliente (para el vistazo rapido) ---
  const memberships: any[] = member.memberships || [];
  const orderedMemberships = sortMemberships(memberships);
  // Solo la VIGENTE queda visible. La cola y el historial se colapsan para no
  // acumular tarjetas ni scrolear tanto (el saldo pendiente se avisa en el toggle).
  const vigentes = orderedMemberships.filter(
    (m) => periodState(m) === 'VIGENTE',
  );
  const enCola = orderedMemberships.filter(
    (m) => periodState(m) === 'PROXIMA',
  );
  const vencidas = orderedMemberships.filter(
    (m) => periodState(m) === 'VENCIDA',
  );
  const colaSaldo = enCola.filter((m) => Number(m.balance) > 0).length;
  const vencSaldo = vencidas.filter((m) => Number(m.balance) > 0).length;
  const totalPagado = memberships
    .flatMap((m) => m.payments || [])
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const saldoTotal = memberships.reduce(
    (s: number, m: any) => s + (m.status !== 'PAGADO' ? Number(m.balance) : 0),
    0,
  );
  const alDia = saldoTotal <= 0;

  const waDigits = (member.phone || '').replace(/\D/g, '');
  const waPhone = waDigits
    ? waDigits.startsWith('0')
      ? '593' + waDigits.slice(1)
      : waDigits
    : '';

  const selectedPlan = plans.find((p) => p.id === planId);
  const qtyLabel = (n: number) =>
    !selectedPlan
      ? `x${n}`
      : selectedPlan.durationMonths > 0
        ? `${selectedPlan.durationMonths * n} mes(es)`
        : `${selectedPlan.durationDays * n} dias`;
  const totalInscribir = selectedPlan
    ? Number(selectedPlan.price) * Number(qty || 1)
    : 0;
  // La membresia que termina MAS TARDE entre las no vencidas (la actual o la
  // ultima en cola). La compra anticipada arranca cuando ESTA termina, igual
  // que hace el backend (orderBy endDate desc).
  const activeMembership = memberships
    .filter((m: any) => new Date(m.endDate) > new Date())
    .sort(
      (a: any, b: any) =>
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )[0];

  // Si NO tiene una vigente pero SI tiene historial, la ultima que vencio.
  // Sirve para ofrecer "renovar contando los dias que entreno" (backdate).
  const lastExpired = !activeMembership
    ? memberships
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
        )[0]
    : undefined;

  // Mensaje de WhatsApp pre-armado segun el ESTADO de la membresia del cliente
  // (saldo / vencida / por vencer / al dia / sin membresia). Solo pre-llena;
  // el dueno revisa y envia.
  const reminderInput = {
    firstName: member.firstName,
    businessName,
    saldoTotal,
    activeEndDate: activeMembership?.endDate ?? null,
    lastExpiredEndDate: lastExpired?.endDate ?? null,
    hasAnyMembership: memberships.length > 0,
  };
  const reminderKind = getReminderKind(reminderInput);
  const waUrl = waPhone
    ? whatsappUrl(waPhone, buildReminderMessage(reminderInput, reminderKind))
    : '';

  // Opciones de "empieza a contar" al inscribir sin membresia vigente.
  // "Al vencer" solo tiene sentido si hay una vencida detras (renovacion).
  // "Otra fecha" sirve para cargar clientes que ya venian del cuaderno con su
  // fecha real de inicio (arranque en frio del sistema).
  const startModes: [('hoy' | 'vencio' | 'custom'), string][] = lastExpired
    ? [
        ['hoy', 'Hoy'],
        ['vencio', 'Al vencer'],
        ['custom', 'Otra fecha'],
      ]
    : [
        ['hoy', 'Hoy'],
        ['custom', 'Otra fecha'],
      ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        to="/admin/members"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Clientes
      </Link>

      {/* Encabezado de perfil / edicion */}
      {editing && editForm ? (
        <Card className="p-4 sm:p-5">
          <p className="text-sm font-medium text-white mb-3">Editar cliente</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">
                Nombre completo
              </label>
              <Input
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Tipo de identificacion
              </label>
              <select
                value={editForm.identificationType}
                onChange={(e) =>
                  setEditForm({ ...editForm, identificationType: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 focus:border-neon-cyan focus:outline-none"
              >
                <option value="CEDULA">Cedula</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="CONSUMIDOR_FINAL">Consumidor final</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Identificacion
              </label>
              <Input
                inputMode={
                  editForm.identificationType === 'PASAPORTE' ? 'text' : 'numeric'
                }
                value={editForm.identification}
                onChange={(e) => {
                  // Cedula/RUC: solo digitos con su tope (10 / 13). Pasaporte:
                  // alfanumerico. Consumidor final: digitos.
                  const t = editForm.identificationType;
                  let v = e.target.value;
                  if (t === 'CEDULA') v = v.replace(/\D/g, '').slice(0, 10);
                  else if (t === 'RUC' || t === 'CONSUMIDOR_FINAL')
                    v = v.replace(/\D/g, '').slice(0, 13);
                  else v = v.slice(0, 20); // pasaporte
                  setEditForm({ ...editForm, identification: v });
                }}
              />
              {editForm.identification.trim() &&
                validateIdentification(
                  editForm.identification,
                  editForm.identificationType,
                ) && (
                  <p className="text-danger text-xs mt-1">
                    {validateIdentification(
                      editForm.identification,
                      editForm.identificationType,
                    )}
                  </p>
                )}
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Telefono</label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">
                Direccion (para facturacion)
              </label>
              <Input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-cyan/60 flex items-center justify-center text-lg font-bold text-on-accent">
                {inits}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    {member.firstName} {member.lastName}
                  </h1>
                  {!member.active && <Badge color="neutral">Inactivo</Badge>}
                </div>
                <p className="text-slate-400 text-sm break-words">
                  {member.identification}
                  {member.phone ? ` · ${member.phone}` : ''}
                  {member.email ? ` · ${member.email}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:ml-auto sm:shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={openEdit}
                className="flex-1 sm:flex-none"
              >
                <Pencil size={15} /> Editar
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleActive}
                    className="flex-1 sm:flex-none"
                  >
                    <Power size={15} />{' '}
                    {member.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={deleteMember}
                    className="flex-1 sm:flex-none"
                  >
                    <Trash2 size={15} /> Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Indicadores rapidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={alDia ? CheckCircle2 : AlertCircle}
          label="Estado"
          value={alDia ? 'Al dia' : 'Debe'}
          accent={alDia ? 'success' : 'warning'}
        />
        <StatCard
          icon={Wallet}
          label="Saldo pendiente"
          value={`$${saldoTotal.toFixed(2)}`}
          accent={saldoTotal > 0 ? 'warning' : 'success'}
        />
        <StatCard
          icon={TrendingUp}
          label="Total pagado"
          value={`$${totalPagado.toFixed(2)}`}
          accent="cyan"
        />
        <StatCard
          icon={CreditCard}
          label="Membresias"
          value={memberships.length}
          accent="warning"
        />
      </div>

      {/* Cuerpo: membresias + panel de acciones */}
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* Membresias (columna ancha) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Membresias</h2>

          {(() => {
            // Una sola funcion para pintar la tarjeta (activas e historial)
            const renderMembership = (m: any) => {
            const price = Number(m.priceSnapshot);
            const balance = Number(m.balance);
            const progress = price > 0 ? ((price - balance) / price) * 100 : 0;
            const period = periodState(m);
            const periodBadge = PERIOD_BADGE[period];
            const owes = balance > 0;
            // Borde de color = estado (mismo criterio que la lista de clientes)
            const accentBorder =
              period === 'VIGENTE'
                ? 'border-l-success'
                : period === 'PROXIMA'
                  ? 'border-l-neon-cyan'
                  : 'border-l-danger';
            return (
              <Card
                key={m.id}
                className={`p-4 sm:p-5 border-l-4 ${accentBorder} ${
                  period === 'PROXIMA' ? 'bg-neon-cyan/[0.03]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">
                      {m.plan.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(m.startDate).toLocaleDateString('es-EC')} —{' '}
                      {new Date(m.endDate).toLocaleDateString('es-EC')}
                      {period === 'PROXIMA' && (
                        <span className="text-neon-cyan">
                          {' '}
                          · empieza cuando termine la actual
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge color={periodBadge.color}>{periodBadge.label}</Badge>
                    {owes && <Badge color="warning">Pendiente</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm mb-2">
                  <span className="text-slate-400">
                    Precio:{' '}
                    <span className="text-slate-200 font-medium">
                      ${price.toFixed(2)}
                    </span>
                  </span>
                  <span className="text-slate-400">
                    Saldo:{' '}
                    <span
                      className={`font-medium ${
                        balance > 0 ? 'text-warning' : 'text-success'
                      }`}
                    >
                      ${balance.toFixed(2)}
                    </span>
                  </span>
                </div>

                <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-4">
                  <div
                    className="h-full bg-neon-cyan transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {balance > 0 ? (
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">
                      Registrar un pago (abono)
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder={`Monto (falta $${balance.toFixed(2)})`}
                        value={abono[m.id] || ''}
                        onChange={(e) =>
                          setAbono({ ...abono, [m.id]: e.target.value })
                        }
                        className="sm:max-w-[180px]"
                      />
                      <select
                        value={method[m.id] || 'EFECTIVO'}
                        onChange={(e) =>
                          setMethod({ ...method, [m.id]: e.target.value })
                        }
                        className="px-3 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 text-sm focus:border-neon-cyan focus:outline-none"
                      >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                      </select>
                      <Button
                        onClick={() => registerAbono(m.id, balance)}
                        disabled={payingId === m.id}
                      >
                        {payingId === m.id ? 'Cobrando...' : 'Cobrar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-success inline-flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Pagada. La nota de venta se
                    entrega en fisico.
                  </p>
                )}

                {/* Congelar: SOLO la vigente. En cola o vencida no se congela. */}
                {period === 'VIGENTE' && (
                <div className="mt-3">
                  {freezingId === m.id ? (
                    <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-2">
                      <p className="text-xs text-slate-400">
                        Congelar (corre el vencimiento):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[2, 5, 10, 15].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setFreezeVal(String(d))}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                              freezeVal === String(d)
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
                          value={freezeVal}
                          onChange={(e) => setFreezeVal(e.target.value)}
                          className="w-20 px-2 py-1.5 rounded-lg bg-body border border-line text-slate-100 text-xs focus:border-neon-cyan focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => freezeMembership(m.id)}
                          disabled={freezingBusy}
                        >
                          {freezingBusy ? 'Congelando...' : 'Confirmar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFreezingId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFreezingId(m.id);
                        setFreezeVal('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-neon-cyan transition-colors"
                    >
                      <Snowflake size={13} /> Congelar membresia
                      {m.frozenDays > 0 && (
                        <span className="text-slate-500">
                          · ya congelada {m.frozenDays}d
                        </span>
                      )}
                    </button>
                  )}
                </div>
                )}

                {m.payments?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <p className="text-xs text-slate-500 mb-2">
                      Historial de abonos
                    </p>
                    <div className="space-y-1">
                      {m.payments.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex justify-between text-xs text-slate-400"
                        >
                          <span>
                            {new Date(p.paidAt).toLocaleString('es-EC')}
                            <span className="text-slate-500">
                              {' '}
                              · {methodLabel(p.method)}
                            </span>
                          </span>
                          <span className="text-neon-cyan font-medium">
                            ${Number(p.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {m.freezes?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <p className="text-xs text-slate-500 mb-2">
                      Congelamientos ({m.frozenDays} dias en total)
                    </p>
                    <div className="space-y-1">
                      {m.freezes.map((f: any) => (
                        <div
                          key={f.id}
                          className="flex justify-between text-xs text-slate-400"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {new Date(f.createdAt).toLocaleDateString('es-EC')}
                            {f.reason && (
                              <span className="text-slate-500">· {f.reason}</span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                f.bulk
                                  ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30'
                                  : 'bg-white/5 text-slate-400 border-white/10'
                              }`}
                            >
                              {f.bulk ? 'masivo' : 'individual'}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-2 shrink-0">
                            <span className="text-slate-300 font-medium">
                              +{f.days}d
                            </span>
                            {/* El masivo no se quita aca, solo el individual */}
                            {!f.bulk && (
                              <button
                                type="button"
                                onClick={() => cancelFreeze(f.id)}
                                title="Quitar este congelamiento"
                                className="text-slate-500 hover:text-danger transition-colors"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-line">
                    {editMemId === m.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">
                          Corregir la membresia (plan / cantidad)
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={editMemForm.planId}
                            onChange={(e) =>
                              setEditMemForm({ ...editMemForm, planId: e.target.value })
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-line text-slate-100 text-sm focus:border-neon-cyan focus:outline-none"
                          >
                            {plans
                              .filter((p) => p.active)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} — ${Number(p.price).toFixed(2)}
                                </option>
                              ))}
                          </select>
                          <select
                            value={editMemForm.quantity}
                            onChange={(e) =>
                              setEditMemForm({ ...editMemForm, quantity: e.target.value })
                            }
                            className="px-3 py-2 rounded-xl bg-surface-2 border border-line text-slate-100 text-sm focus:border-neon-cyan focus:outline-none"
                          >
                            {[1, 2, 3, 6, 12].map((n) => (
                              <option key={n} value={n}>
                                {n} periodo(s)
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => saveEditMem(m)}
                            disabled={savingMemId === m.id}
                          >
                            {savingMemId === m.id ? 'Guardando...' : 'Guardar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditMemId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Se recalcula precio y vencimiento; los pagos ya hechos se
                          conservan y se restan del nuevo total.
                        </p>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => openEditMem(m)}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-neon-cyan transition-colors"
                        >
                          <Pencil size={13} /> Editar membresia
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMembership(m)}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-danger transition-colors"
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
            };

            // Grupo colapsable reutilizable (cola / historial)
            const renderGroup = (
              title: string,
              Icon: any,
              items: any[],
              open: boolean,
              toggle: () => void,
              saldo: number,
            ) =>
              items.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={toggle}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-surface border border-line text-sm text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon size={15} className="text-slate-500" />
                      {title} ({items.length})
                      {saldo > 0 && (
                        <span className="text-warning text-xs">
                          · {saldo} con saldo pendiente
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="space-y-4 mt-4">
                      {items.map(renderMembership)}
                    </div>
                  )}
                </div>
              );

            return (
              <>
                {vigentes.map(renderMembership)}

                {vigentes.length === 0 && enCola.length === 0 && vencidas.length > 0 && (
                  <p className="text-sm text-slate-500">
                    Este cliente no tiene una membresia vigente.
                  </p>
                )}

                {renderGroup(
                  'En cola',
                  Clock,
                  enCola,
                  showQueue,
                  () => setShowQueue((v) => !v),
                  colaSaldo,
                )}
                {renderGroup(
                  'Historial de membresias',
                  History,
                  vencidas,
                  showHistory,
                  () => setShowHistory((v) => !v),
                  vencSaldo,
                )}
              </>
            );
          })()}

          {memberships.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-slate-400 text-sm">
                Este cliente aun no tiene membresias.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Inscribilo en un plan con el panel de la derecha.
              </p>
            </Card>
          )}
        </div>

        {/* Panel de acciones rapidas */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            {activeMembership ? (
              <>
                <p className="text-sm font-medium text-white mb-1">
                  Ya tiene cobertura
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Cubierto hasta el{' '}
                  {new Date(activeMembership.endDate).toLocaleDateString('es-EC')}
                  . Podes comprar el proximo plan o promo ahora: entra en cola y
                  arranca cuando termine el ultimo periodo (no pierde dias).
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-white mb-1">
                  Inscribir plan
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Toma hoy como inicio y calcula el vencimiento automaticamente.
                </p>
              </>
            )}
            <div className="space-y-2">
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 focus:border-neon-cyan focus:outline-none"
              >
                <option value="">Selecciona un plan o promo...</option>
                {plans
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${Number(p.price).toFixed(2)}
                    </option>
                  ))}
              </select>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Cantidad de periodos
                </label>
                <select
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-line text-slate-100 focus:border-neon-cyan focus:outline-none"
                >
                  {[1, 2, 3, 6, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} ({qtyLabel(n)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Renovacion de un vencido: el dueno elige desde cuando cuenta:
                  hoy (perdona), cuando vencio (cuenta todo), o una fecha exacta
                  (ej. el dia que el cliente volvio a entrenar tras descansar). */}
              {!activeMembership && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Empieza a contar
                  </label>
                  <div
                    className={`grid gap-2 ${
                      startModes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                    }`}
                  >
                    {startModes.map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setStartMode(mode)}
                        className={`px-2 py-2 rounded-xl text-xs border transition-all ${
                          startMode === mode
                            ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40'
                            : 'border-line text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {startMode === 'custom' && (
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={
                        lastExpired
                          ? new Date(lastExpired.endDate)
                              .toISOString()
                              .slice(0, 10)
                          : undefined
                      }
                      max={new Date().toISOString().slice(0, 10)}
                      className="mt-2 w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-slate-100 text-sm focus:border-neon-cyan focus:outline-none"
                    />
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    {startMode === 'hoy' &&
                      (lastExpired
                        ? 'Arranca hoy (perdona los dias sin entrenar).'
                        : 'Arranca hoy.')}
                    {startMode === 'vencio' &&
                      lastExpired &&
                      `Arranca el ${new Date(
                        lastExpired.endDate,
                      ).toLocaleDateString('es-EC')} (cuenta todo desde que vencio).`}
                    {startMode === 'custom' &&
                      (lastExpired
                        ? 'Arranca en la fecha que elijas (ej. el dia que volvio a entrenar).'
                        : 'Arranca en la fecha real de inicio (ej. lo que dice tu cuaderno).')}
                  </p>
                </div>
              )}

              {selectedPlan && (
                <p className="text-sm text-slate-300">
                  Total:{' '}
                  <span className="font-semibold text-neon-cyan">
                    ${totalInscribir.toFixed(2)}
                  </span>{' '}
                  <span className="text-xs text-slate-500">
                    · {qtyLabel(Number(qty))}
                    {activeMembership
                      ? ` · empieza el ${new Date(
                          activeMembership.endDate,
                        ).toLocaleDateString('es-EC')}`
                      : startMode === 'vencio' && lastExpired
                        ? ` · empieza el ${new Date(
                            lastExpired.endDate,
                          ).toLocaleDateString('es-EC')}`
                        : startMode === 'custom' && customDate
                          ? ` · empieza el ${customDate
                              .split('-')
                              .reverse()
                              .join('/')}`
                          : ''}
                  </span>
                </p>
              )}

              <Button
                onClick={() => {
                  const sd = activeMembership
                    ? undefined
                    : startMode === 'vencio' && lastExpired
                      ? lastExpired.endDate
                      : startMode === 'custom' && customDate
                        ? customDate
                        : undefined;
                  createMembership(!!activeMembership, sd);
                }}
                className="w-full"
              >
                <Plus size={16} />{' '}
                {activeMembership ? 'Comprar anticipado' : 'Inscribir'}
              </Button>
            </div>
          </Card>

          {waPhone && (
            <Card className="p-4 sm:p-5">
              <p className="text-sm font-medium text-white mb-3">Contacto</p>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-all"
              >
                <MessageCircle size={16} /> Enviar WhatsApp
              </a>
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                Mensaje segun estado: {reminderLabel(reminderKind)}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
