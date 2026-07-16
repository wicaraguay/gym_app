import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Screen, Card, Badge, Button, Field, ErrorText, Chip } from '../ui';
import {
  validateAmount,
  validateDays,
  validateEmail,
  validatePhone,
  splitFullName,
  firstError,
} from '../validation';
import { C } from '../theme';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};

function period(m: any): { label: string; color: string } {
  const now = Date.now();
  if (new Date(m.startDate).getTime() > now) return { label: 'En cola', color: C.cyan };
  if (new Date(m.endDate).getTime() <= now) return { label: 'Vencida', color: C.danger };
  return { label: 'Vigente', color: C.success };
}

export function MemberDetailScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [member, setMember] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [amount, setAmount] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [freezeVal, setFreezeVal] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [planId, setPlanId] = useState('');
  const [qty, setQty] = useState(1);
  const [startMode, setStartMode] = useState<'hoy' | 'vencio' | 'custom'>('hoy');
  const [customDate, setCustomDate] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [editMemId, setEditMemId] = useState<string | null>(null);
  const [editMemForm, setEditMemForm] = useState({ planId: '', quantity: 1 });

  const load = useCallback(() => {
    api.get(`/members/${id}`).then((r) => setMember(r.data)).catch(() => {});
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    api.get('/plans').then((r) => setPlans(r.data)).catch(() => {});
  }, []);

  const cobrar = async (mem: any) => {
    // El abono debe ser positivo y NO puede superar el saldo pendiente.
    const err = validateAmount(amount[mem.id] || '', {
      max: Number(mem.balance),
      label: 'El abono',
    });
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.post('/payments', {
        membershipId: mem.id,
        amount: Number(amount[mem.id]),
        method: method[mem.id] || 'EFECTIVO',
      });
      setAmount({ ...amount, [mem.id]: '' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo registrar el abono');
    } finally {
      setBusy(false);
    }
  };

  // Congelar: solo la membresia VIGENTE (el backend rechaza en cola/vencida).
  const freeze = async (mem: any) => {
    const err = validateDays(freezeVal[mem.id] || '');
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.post(`/memberships/${mem.id}/freeze`, { days: Number(freezeVal[mem.id]) });
      setFreezeVal({ ...freezeVal, [mem.id]: '' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo congelar');
    } finally {
      setBusy(false);
    }
  };

  // Quitar un congelamiento individual (el masivo se revierte desde el Dashboard).
  const cancelFreeze = (f: any) => {
    Alert.alert(
      'Quitar congelamiento',
      'Se restan los dias del vencimiento. Seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            setError('');
            try {
              await api.delete(`/memberships/freezes/${f.id}`);
              load();
            } catch (e: any) {
              setError(e?.response?.data?.message || 'No se pudo quitar');
            }
          },
        },
      ],
    );
  };

  const openEditMember = () => {
    setError('');
    setEditForm({
      name: `${member.firstName} ${member.lastName}`.trim(),
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
    });
    setEditOpen(true);
  };
  const saveMember = async () => {
    const name = splitFullName(editForm.name);
    const e2 = firstError(
      name ? null : 'Escribi nombre y apellido (al menos dos palabras).',
      validatePhone(editForm.phone || ''),
      validateEmail(editForm.email || '', true),
    );
    if (e2) {
      setError(e2);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.patch(`/members/${id}`, {
        firstName: name!.firstName,
        lastName: name!.lastName,
        phone: (editForm.phone || '').trim() || undefined,
        email: (editForm.email || '').trim() || undefined,
        address: (editForm.address || '').trim() || undefined,
      });
      setEditOpen(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };
  const toggleActive = async () => {
    try {
      await api.patch(`/members/${id}`, { active: !member.active });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo');
    }
  };

  const createMembership = async (anticipado: boolean, startDate?: string) => {
    if (!planId) {
      setError('Elegi un plan');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.post('/memberships', {
        memberId: id,
        planId,
        quantity: qty,
        startAfterCurrent: anticipado,
        startDate,
      });
      setPlanId('');
      setQty(1);
      setStartMode('hoy');
      setCustomDate('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al inscribir');
    } finally {
      setBusy(false);
    }
  };

  const openEditMem = (m: any) => {
    setError('');
    const unit = Number(m.plan?.price) || 0;
    const q = unit > 0 ? Math.max(1, Math.round(Number(m.priceSnapshot) / unit)) : 1;
    setEditMemForm({ planId: m.planId, quantity: q });
    setEditMemId(editMemId === m.id ? null : m.id);
  };
  const saveEditMem = async (m: any) => {
    const doSave = async () => {
      setError('');
      setBusy(true);
      try {
        await api.patch(`/memberships/${m.id}`, {
          planId: editMemForm.planId,
          quantity: editMemForm.quantity,
        });
        setEditMemId(null);
        load();
      } catch (e: any) {
        setError(e?.response?.data?.message || 'No se pudo editar');
      } finally {
        setBusy(false);
      }
    };
    // Cambiar una membresia con pagos recalcula precio/vencimiento: confirmar.
    if ((m.payments?.length || 0) > 0) {
      Alert.alert(
        'Cambiar la membresia',
        `Esta membresia ya tiene ${m.payments.length} pago(s). Cambiar el plan o la cantidad recalcula el precio y el vencimiento. Continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cambiar', style: 'destructive', onPress: doSave },
        ],
      );
    } else {
      doSave();
    }
  };
  const deleteMembership = (m: any) => {
    const pagos = m.payments?.length || 0;
    const total = (m.payments || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0,
    );
    Alert.alert(
      'Eliminar membresia',
      pagos > 0
        ? `Tiene ${pagos} abono(s) por $${total.toFixed(2)}. Se borran TAMBIEN esos pagos. Seguro?`
        : 'Eliminar esta membresia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/memberships/${m.id}`);
              load();
            } catch (e: any) {
              setError(e?.response?.data?.message || 'No se pudo eliminar');
            }
          },
        },
      ],
    );
  };

  if (!member) return <Screen refreshing />;

  const nowMs = Date.now();
  const activeMembership = (member.memberships || [])
    .filter((m: any) => new Date(m.endDate).getTime() > nowMs)
    .sort(
      (a: any, b: any) =>
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )[0];
  const lastExpired = !activeMembership
    ? (member.memberships || [])
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
        )[0]
    : undefined;

  // Ordena: Vigente (la que vence antes) primero, luego En cola, luego Vencidas.
  const ORDER: Record<string, number> = { Vigente: 0, 'En cola': 1, Vencida: 2 };
  const memberships: any[] = [...(member.memberships || [])].sort((a, b) => {
    const pa = period(a).label;
    const pb = period(b).label;
    if (ORDER[pa] !== ORDER[pb]) return ORDER[pa] - ORDER[pb];
    const aStart = new Date(a.startDate).getTime();
    const bStart = new Date(b.startDate).getTime();
    const aEnd = new Date(a.endDate).getTime();
    const bEnd = new Date(b.endDate).getTime();
    if (pa === 'Vencida') return bEnd - aEnd; // vencida mas reciente primero
    if (pa === 'En cola') return aStart - bStart; // la que activa antes primero
    return aEnd - bEnd; // Vigente: la que vence antes, primero
  });

  return (
    <Screen>
      <Text style={s.name}>
        {member.firstName} {member.lastName}
      </Text>
      <Text style={s.sub}>
        {member.identification}
        {member.phone ? ` · ${member.phone}` : ''}
      </Text>
      {!member.active && (
        <View style={{ marginTop: 8 }}>
          <Badge label="Inactivo" />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Button
          title="Editar cliente"
          variant="ghost"
          onPress={openEditMember}
          style={{ flex: 1 }}
        />
        {isAdmin && (
          <Button
            title={member.active ? 'Desactivar' : 'Activar'}
            variant="ghost"
            onPress={toggleActive}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {error ? <Text style={{ color: C.danger, marginTop: 8 }}>{error}</Text> : null}

      <Text style={s.section}>Membresias</Text>

      {memberships.length === 0 && (
        <Text style={{ color: C.textFaint }}>Este cliente aun no tiene membresias.</Text>
      )}

      {memberships.map((m) => {
        const p = period(m);
        const balance = Number(m.balance);
        const owes = balance > 0;
        return (
          <Card key={m.id} accent={p.color}>
            <View style={s.rowBetween}>
              <Text style={s.plan}>{m.plan?.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Badge label={p.label} color={p.color} />
                {owes ? <Badge label="Debe" color={C.warning} /> : null}
              </View>
            </View>
            <Text style={s.dates}>
              {fmt(m.startDate)} — {fmt(m.endDate)}
            </Text>
            <View style={s.rowBetween}>
              <Text style={s.money}>Precio: ${Number(m.priceSnapshot).toFixed(2)}</Text>
              <Text style={[s.money, { color: owes ? C.warning : C.success }]}>
                Saldo: ${balance.toFixed(2)}
              </Text>
            </View>

            {owes && (
              <View style={{ marginTop: 12, borderTopColor: C.line, borderTopWidth: 1, paddingTop: 12 }}>
                <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>
                  Registrar un cobro (abono)
                </Text>
                <Field
                  value={amount[m.id] || ''}
                  onChangeText={(t) => setAmount({ ...amount, [m.id]: t })}
                  placeholder={`Monto (falta $${balance.toFixed(2)})`}
                  keyboardType="numeric"
                />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  {['EFECTIVO', 'TRANSFERENCIA'].map((mt) => {
                    const on = (method[m.id] || 'EFECTIVO') === mt;
                    return (
                      <Text
                        key={mt}
                        onPress={() => setMethod({ ...method, [m.id]: mt })}
                        style={[s.methodChip, on && { color: C.cyan, borderColor: C.cyan + '66', backgroundColor: C.cyan + '18' }]}
                      >
                        {mt === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
                      </Text>
                    );
                  })}
                </View>
                <Button title="Cobrar" onPress={() => cobrar(m)} loading={busy} />
              </View>
            )}

            {p.label === 'Vigente' && (
              <View style={{ marginTop: 12, borderTopColor: C.line, borderTopWidth: 1, paddingTop: 12 }}>
                <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>
                  Congelar (corre el vencimiento)
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  {[2, 5, 10, 15].map((d) => (
                    <Chip
                      key={d}
                      label={`${d} dias`}
                      active={freezeVal[m.id] === String(d)}
                      onPress={() => setFreezeVal({ ...freezeVal, [m.id]: String(d) })}
                    />
                  ))}
                  <TextInput
                    style={s.dayInput}
                    placeholder="otros"
                    placeholderTextColor={C.textFaint}
                    keyboardType="numeric"
                    value={freezeVal[m.id] || ''}
                    onChangeText={(t) => setFreezeVal({ ...freezeVal, [m.id]: t })}
                  />
                </View>
                <Button title="Congelar" variant="ghost" onPress={() => freeze(m)} loading={busy} />
              </View>
            )}

            {m.freezes?.length > 0 && (
              <View style={{ marginTop: 12, borderTopColor: C.line, borderTopWidth: 1, paddingTop: 12 }}>
                <Text style={{ color: C.textFaint, fontSize: 12, marginBottom: 8 }}>
                  Congelamientos ({m.frozenDays} dias en total)
                </Text>
                {m.freezes.map((f: any) => (
                  <View key={f.id} style={[s.rowBetween, { marginBottom: 8 }]}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ color: C.textMuted, fontSize: 12 }}>
                        {new Date(f.createdAt).toLocaleDateString('es-EC')}
                        {f.reason ? ` · ${f.reason}` : ''}
                      </Text>
                      <Badge label={f.bulk ? 'masivo' : 'individual'} color={f.bulk ? C.cyan : C.textFaint} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600' }}>+{f.days}d</Text>
                      {!f.bulk && (
                        <Text onPress={() => cancelFreeze(f)} style={{ color: C.danger, fontSize: 12 }}>
                          Quitar
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {m.payments?.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: C.textFaint, fontSize: 12, marginBottom: 4 }}>
                  Abonos
                </Text>
                {m.payments.map((pmt: any) => (
                  <View key={pmt.id} style={s.rowBetween}>
                    <Text style={{ color: C.textFaint, fontSize: 12 }}>
                      {new Date(pmt.paidAt).toLocaleDateString('es-EC')}
                    </Text>
                    <Text style={{ color: C.cyan, fontSize: 12, fontWeight: '600' }}>
                      ${Number(pmt.amount).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {isAdmin && (
              <View style={{ marginTop: 12, borderTopColor: C.line, borderTopWidth: 1, paddingTop: 12 }}>
                {editMemId === m.id ? (
                  <View>
                    <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>
                      Corregir plan / cantidad
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {plans.filter((p) => p.active).map((p) => (
                        <Chip
                          key={p.id}
                          label={p.name}
                          active={editMemForm.planId === p.id}
                          onPress={() => setEditMemForm({ ...editMemForm, planId: p.id })}
                        />
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      {[1, 2, 3, 6, 12].map((n) => (
                        <Chip
                          key={n}
                          label={String(n)}
                          active={editMemForm.quantity === n}
                          onPress={() => setEditMemForm({ ...editMemForm, quantity: n })}
                        />
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button title="Guardar" onPress={() => saveEditMem(m)} loading={busy} style={{ flex: 1 }} />
                      <Button title="Cancelar" variant="ghost" onPress={() => setEditMemId(null)} style={{ flex: 1 }} />
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 18 }}>
                    <Text onPress={() => openEditMem(m)} style={{ color: C.textMuted, fontSize: 13 }}>
                      Editar membresia
                    </Text>
                    <Text onPress={() => deleteMembership(m)} style={{ color: C.danger, fontSize: 13 }}>
                      Eliminar
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        );
      })}

      {renderInscribir()}

      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Editar cliente</Text>
            <Field label="Nombre completo" value={editForm.name} onChangeText={(t) => setEditForm({ ...editForm, name: t })} />
            <Field label="Telefono" value={editForm.phone} onChangeText={(t) => setEditForm({ ...editForm, phone: t })} keyboardType="phone-pad" />
            <Field label="Email" value={editForm.email} onChangeText={(t) => setEditForm({ ...editForm, email: t })} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Direccion (para facturacion)" value={editForm.address} onChangeText={(t) => setEditForm({ ...editForm, address: t })} />
            <ErrorText>{error}</ErrorText>
            <Button title="Guardar" onPress={saveMember} loading={busy} />
            <Button title="Cancelar" variant="ghost" onPress={() => setEditOpen(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );

  // Panel de inscribir / renovar / comprar anticipado.
  function renderInscribir() {
    const sel = plans.find((p) => p.id === planId);
    const total = sel ? Number(sel.price) * qty : 0;
    const durLabel = sel
      ? sel.durationMonths > 0
        ? `${sel.durationMonths * qty} mes(es)`
        : `${sel.durationDays * qty} dias`
      : '';
    const startLabel = activeMembership
      ? fmt(activeMembership.endDate)
      : startMode === 'vencio' && lastExpired
        ? fmt(lastExpired.endDate)
        : startMode === 'custom' && customDate
          ? customDate.split('-').reverse().join('/')
          : 'hoy';

    return (
      <Card style={{ marginTop: 8 }} accent={activeMembership ? C.cyan : undefined}>
        <Text style={{ color: C.text, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
          {activeMembership ? 'Comprar el proximo mes (en cola)' : 'Inscribir / renovar'}
        </Text>
        {activeMembership && (
          <Text style={{ color: C.textFaint, fontSize: 12, marginBottom: 10 }}>
            Cubierto hasta el {fmt(activeMembership.endDate)}. La nueva entra en
            cola y arranca cuando esta termine — no pierde ni un dia.
          </Text>
        )}

        <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>Plan / promo</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {plans.filter((p) => p.active).map((p) => (
            <Chip
              key={p.id}
              label={`${p.name} $${Number(p.price).toFixed(0)}`}
              active={planId === p.id}
              onPress={() => setPlanId(p.id)}
            />
          ))}
        </View>

        <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>Cantidad de periodos</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {[1, 2, 3, 6, 12].map((n) => (
            <Chip key={n} label={String(n)} active={qty === n} onPress={() => setQty(n)} />
          ))}
        </View>

        {!activeMembership && lastExpired && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>Empieza a contar</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Hoy" active={startMode === 'hoy'} onPress={() => setStartMode('hoy')} />
              <Chip label="Al vencer" active={startMode === 'vencio'} onPress={() => setStartMode('vencio')} />
              <Chip label="Otra fecha" active={startMode === 'custom'} onPress={() => setStartMode('custom')} />
            </View>
            {startMode === 'custom' && (
              <View style={{ marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: C.line,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: C.surface2,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{ color: customDate ? C.text : C.textFaint, fontSize: 13 }}>
                    {customDate ? customDate.split('-').reverse().join('/') : 'Elegir fecha'}
                  </Text>
                </TouchableOpacity>
                {showPicker && (
                  <DateTimePicker
                    value={customDate ? new Date(customDate) : new Date()}
                    mode="date"
                    minimumDate={new Date(lastExpired.endDate)}
                    maximumDate={new Date()}
                    onChange={(e, date) => {
                      setShowPicker(false);
                      if (date && e.type !== 'dismissed') {
                        setCustomDate(date.toISOString().slice(0, 10));
                      }
                    }}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* Resumen: total + duracion + desde cuando */}
        {sel && (
          <View
            style={{
              backgroundColor: C.surface2,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: C.text, fontWeight: '800', fontSize: 17 }}>
              Total: ${total.toFixed(2)}
            </Text>
            <Text style={{ color: C.textFaint, fontSize: 12, marginTop: 2 }}>
              {durLabel} · empieza el {startLabel}
            </Text>
          </View>
        )}

        <Button
          title={activeMembership ? 'Comprar anticipado' : 'Inscribir'}
          loading={busy}
          onPress={() => {
            const sd = activeMembership
              ? undefined
              : startMode === 'vencio' && lastExpired
                ? lastExpired.endDate
                : startMode === 'custom' && customDate
                  ? customDate
                  : undefined;
            createMembership(!!activeMembership, sd);
          }}
        />
      </Card>
    );
  }
}

const s = StyleSheet.create({
  name: { color: C.text, fontSize: 22, fontWeight: '800' },
  sub: { color: C.textFaint, marginTop: 2 },
  section: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  plan: { color: C.text, fontWeight: '700', fontSize: 15, flex: 1 },
  dates: { color: C.textFaint, fontSize: 12, marginTop: 3, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  money: { color: C.textMuted, fontSize: 13 },
  methodChip: {
    color: C.textMuted,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
    fontSize: 13,
  },
  dayInput: {
    width: 72,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: C.text,
    backgroundColor: C.surface2,
    fontSize: 13,
  },
  modalWrap: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: C.surface,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 14 },
});
