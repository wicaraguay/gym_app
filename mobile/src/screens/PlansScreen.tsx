import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Screen, Title, Card, Badge, Button, Field, Chip, ErrorText, FieldHint } from '../ui';
import { validateRequired, validatePrice, firstError } from '../validation';
import { C } from '../theme';

const durationLabel = (p: any) =>
  p.durationMonths > 0
    ? p.durationMonths === 1
      ? '1 mes'
      : `${p.durationMonths} meses`
    : `${p.durationDays} dias`;

export function PlansScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', price: '', amount: '1', unit: 'mes' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editErr, setEditErr] = useState('');

  const load = useCallback(() => {
    api.get('/plans').then((r) => setPlans(r.data)).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    const amount = Number(form.amount);
    const v = firstError(
      validateRequired(form.name, 'El nombre'),
      validatePrice(form.price),
      !Number.isFinite(amount) || amount < 1 ? 'La duracion debe ser al menos 1.' : null,
    );
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const payload: any = { name: form.name.trim(), price: Number(form.price) };
      if (form.unit === 'mes') payload.durationMonths = amount;
      else payload.durationDays = amount;
      await api.post('/plans', payload);
      setForm({ name: '', price: '', amount: '1', unit: 'mes' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo crear el plan');
    } finally {
      setBusy(false);
    }
  };

  const savePrice = async (id: string) => {
    const v = validatePrice(editPrice);
    if (v) {
      setEditErr(v);
      return;
    }
    setEditErr('');
    try {
      await api.patch(`/plans/${id}`, { price: Number(editPrice) });
      setEditId(null);
      load();
    } catch (e: any) {
      setEditErr(e?.response?.data?.message || 'No se pudo guardar');
    }
  };

  const toggle = async (p: any) => {
    try {
      await api.patch(`/plans/${p.id}`, { active: !p.active });
      load();
    } catch {
      /* no-op */
    }
  };

  const remove = (p: any) => {
    Alert.alert(
      'Eliminar plan',
      `Eliminar "${p.name}"? Solo es posible si no tiene membresias.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/plans/${p.id}`);
              load();
            } catch (e: any) {
              setError(e?.response?.data?.message || 'No se puede eliminar');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Title>Planes</Title>

      {isAdmin && (
        <Card>
          <Text style={s.cardTitle}>Crear plan nuevo</Text>
          <Field
            label="Nombre (ej. Mensual)"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />
          <Field
            label="Precio ($)"
            value={form.price}
            onChangeText={(t) => setForm({ ...form, price: t })}
            keyboardType="numeric"
          />
          <FieldHint value={form.price} validate={(v) => validatePrice(v)} ok="Precio valido." />
          <Field
            label="Duracion"
            value={form.amount}
            onChangeText={(t) => setForm({ ...form, amount: t })}
            keyboardType="numeric"
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <Chip label="mes(es)" active={form.unit === 'mes'} onPress={() => setForm({ ...form, unit: 'mes' })} />
            <Chip label="dia(s)" active={form.unit === 'dia'} onPress={() => setForm({ ...form, unit: 'dia' })} />
          </View>
          <ErrorText>{error}</ErrorText>
          <Button title="Crear plan" onPress={create} loading={busy} />
        </Card>
      )}

      {plans.map((p) => (
        <Card key={p.id} accent={p.active ? C.success : C.textFaint}>
          <View style={s.row}>
            <Text style={s.name}>{p.name}</Text>
            {!p.active && <Badge label="Inactivo" />}
          </View>
          <Text style={s.dur}>Duracion: {durationLabel(p)}</Text>

          {editId === p.id ? (
            <View>
              <Field
                label="Nuevo precio ($)"
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
              />
              <ErrorText>{editErr}</ErrorText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Guardar" onPress={() => savePrice(p.id)} style={{ flex: 1 }} />
                <Button title="Cancelar" variant="ghost" onPress={() => setEditId(null)} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <Text style={s.price}>
              ${Number(p.price).toFixed(2)}
              <Text style={s.per}> / {durationLabel(p)}</Text>
            </Text>
          )}

          {isAdmin && editId !== p.id && (
            <View style={s.actions}>
              <Button
                title="Precio"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => {
                  setEditId(p.id);
                  setEditPrice(String(p.price));
                  setEditErr('');
                }}
              />
              <Button
                title={p.active ? 'Desactivar' : 'Activar'}
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => toggle(p)}
              />
              <Button title="Eliminar" variant="danger" style={{ flex: 1 }} onPress={() => remove(p)} />
            </View>
          )}
        </Card>
      ))}

      {!isAdmin && (
        <Text style={s.note}>Crear o editar planes es solo para administradores.</Text>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  cardTitle: { color: C.text, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: C.text, fontWeight: '700', fontSize: 16 },
  dur: { color: C.textFaint, fontSize: 13, marginTop: 2, marginBottom: 8 },
  price: { color: C.text, fontSize: 24, fontWeight: '800' },
  per: { color: C.textFaint, fontSize: 12, fontWeight: '400' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  note: { color: C.textFaint, fontSize: 12, marginTop: 8 },
});
