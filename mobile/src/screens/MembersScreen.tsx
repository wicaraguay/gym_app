import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { Badge, Field, Button, ErrorText } from '../ui';
import {
  validateCedulaOrRuc,
  validateEmail,
  validatePhone,
  splitFullName,
  detectIdType,
  firstError,
} from '../validation';
import { C, stateColor } from '../theme';

const FILTERS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'PAGADO', label: 'Al dia' },
  { key: 'PENDIENTE', label: 'Deben' },
  { key: 'VENCIDO', label: 'Vencidas' },
];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtVence(iso?: string | null, expired?: boolean) {
  if (!iso) return null;
  const d = new Date(iso);
  const txt = `${d.getDate()} ${MESES[d.getMonth()]}`;
  return expired ? `Vencio ${txt}` : `Vence ${txt}`;
}

export function MembersScreen() {
  const nav = useNavigation<any>();
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [total, setTotal] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    identification: '',
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Feedback en vivo de la identificacion (cedula vs RUC).
  const idType = detectIdType(form.identification);
  const idErr = form.identification.trim()
    ? validateCedulaOrRuc(form.identification)
    : null;

  const load = useCallback(() => {
    api
      .get('/members', { params: { search, status, limit: 50 } })
      .then((r) => {
        setMembers(r.data.data);
        setTotal(r.data.total);
      })
      .catch(() => {});
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const create = async () => {
    const name = splitFullName(form.name);
    const e = firstError(
      validateCedulaOrRuc(form.identification),
      name ? null : 'Escribi nombre y apellido (al menos dos palabras).',
      validatePhone(form.phone),
      validateEmail(form.email, true),
    );
    if (e) {
      setErr(e);
      return;
    }
    setErr('');
    setBusy(true);
    try {
      await api.post('/members', {
        identification: form.identification.trim(),
        firstName: name!.firstName,
        lastName: name!.lastName,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setForm({ identification: '', name: '', phone: '', email: '', address: '' });
      setShowNew(false);
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'No se pudo crear el cliente');
    } finally {
      setBusy(false);
    }
  };

  const inits = (m: any) =>
    `${m.firstName?.[0] ?? ''}${m.lastName?.[0] ?? ''}`.toUpperCase();

  const renderItem = ({ item: m }: { item: any }) => {
    const color = stateColor({ active: m.active, expired: m.expired, owes: m.owes });
    const vence = fmtVence(m.endDate, m.expired);
    return (
      <TouchableOpacity
        style={[s.card, { borderLeftColor: color }]}
        onPress={() => nav.navigate('MemberDetail', { id: m.id, name: `${m.firstName} ${m.lastName}` })}
      >
        <View style={s.avatar}>
          <Text style={{ color: C.cyan, fontWeight: '700' }}>{inits(m)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>
            {m.firstName} {m.lastName}
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {m.identification}
            {m.planName ? ` · ${m.planName}` : ''}
          </Text>
          {m.owes ? (
            <Text style={{ color: C.warning, fontWeight: '700', fontSize: 13, marginTop: 2 }}>
              Debe ${Number(m.balance).toFixed(2)}
            </Text>
          ) : vence ? (
            <Text style={{ color: C.textFaint, fontSize: 12, marginTop: 2 }}>{vence}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.body }} edges={['top']}>
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={s.title}>Clientes</Text>
                <Text style={s.count}>{total} cliente(s)</Text>
              </View>
              <Button
                title="+ Nuevo"
                onPress={() => {
                  setErr('');
                  setShowNew(true);
                }}
                style={{ paddingHorizontal: 16 }}
              />
            </View>
            <TextInput
              style={s.search}
              placeholder="Buscar por nombre o cedula..."
              placeholderTextColor={C.textFaint}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            <View style={s.chips}>
              {FILTERS.map((f) => {
                const on = status === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setStatus(f.key)}
                    style={[s.chip, on && { backgroundColor: C.cyan + '22', borderColor: C.cyan + '66' }]}
                  >
                    <Text style={{ color: on ? C.cyan : C.textMuted, fontSize: 13, fontWeight: '600' }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: C.textFaint, textAlign: 'center', marginTop: 20 }}>
            Sin resultados.
          </Text>
        }
      />

      <Modal
        visible={showNew}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNew(false)}
      >
        <View style={s.modalWrap}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Nuevo cliente</Text>
            <Field
              label="Cedula / RUC"
              value={form.identification}
              onChangeText={(t) => setForm({ ...form, identification: t })}
              keyboardType="numeric"
            />
            <Text
              style={{
                color: idErr ? C.danger : idType ? C.success : C.textFaint,
                fontSize: 12,
                marginTop: -8,
                marginBottom: 10,
              }}
            >
              {form.identification.trim()
                ? idErr
                  ? idErr
                  : idType === 'CEDULA'
                    ? 'Cedula valida'
                    : 'RUC valido'
                : 'Cedula = 10 digitos · RUC = 13 digitos'}
            </Text>
            <Field
              label="Nombre completo"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
            <Field
              label="Telefono"
              value={form.phone}
              onChangeText={(t) => setForm({ ...form, phone: t })}
              keyboardType="phone-pad"
            />
            <Field
              label="Email (opcional)"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Direccion (para facturacion)"
              value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })}
            />
            <ErrorText>{err}</ErrorText>
            <Button title="Guardar cliente" onPress={create} loading={busy} />
            <Button
              title="Cancelar"
              variant="ghost"
              onPress={() => setShowNew(false)}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { color: C.text, fontSize: 22, fontWeight: '800' },
  count: { color: C.textFaint, fontSize: 13, marginBottom: 12 },
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
  search: {
    backgroundColor: C.surface2,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#ffffff0d',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderColor: C.line,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.cyan + '1a',
    borderWidth: 1,
    borderColor: C.cyan + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: C.text, fontWeight: '700', fontSize: 15 },
  sub: { color: C.textFaint, fontSize: 12, marginTop: 1 },
});
