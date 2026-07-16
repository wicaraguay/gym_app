import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Screen, Title, Card, Button } from '../ui';
import { C } from '../theme';

interface Summary {
  monthlyIncome: number;
  activeMembers: number;
  paidMemberships: number;
  pendingMemberships: number;
  pendingBalance: number;
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={{ flex: 1, minWidth: '45%' }} accent={color}>
      <Text style={{ color: C.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </Card>
  );
}

export function DashboardScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const nav = useNavigation<any>();
  const [data, setData] = useState<Summary | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [mafDays, setMafDays] = useState('');
  const [mafReason, setMafReason] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api.get('/dashboard/summary').then((r) => setData(r.data)).catch(() => {});
    api.get('/dashboard/notifications').then((r) => setNotifs(r.data)).catch(() => {});
    if (isAdmin) {
      api.get('/memberships/freeze-batches').then((r) => setBatches(r.data)).catch(() => {});
    }
  }, [isAdmin]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const freezeAll = () => {
    const days = Number(mafDays);
    if (!days || days <= 0) return;

    // Sin membresias vigentes no hay nada que congelar: avisamos y salimos.
    const activasCount =
      (data?.paidMemberships ?? 0) + (data?.pendingMemberships ?? 0);
    if (activasCount === 0) {
      Alert.alert(
        'No hay clientes para congelar',
        'En este momento no tienes clientes con una membresia activa. El congelamiento masivo corre el vencimiento de las membresias vigentes, y ahora no hay ninguna.',
        [{ text: 'Entendido' }],
      );
      return;
    }

    Alert.alert(
      'Congelamiento masivo',
      `Congelar ${days} dias a TODAS las membresias activas? Corre el vencimiento de todos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Congelar a todos',
          onPress: async () => {
            setMsg('');
            try {
              const r = await api.post('/memberships/freeze-all', {
                days,
                reason: mafReason || undefined,
              });
              // Red de seguridad: backend no encontro vigentes (p. ej. futuras).
              if (r.data.affected === 0) {
                Alert.alert(
                  'No hay clientes para congelar',
                  'No se encontraron membresias vigentes para congelar en este momento.',
                  [{ text: 'Entendido' }],
                );
                return;
              }
              setMsg(`Listo: ${r.data.affected} membresia(s) congelada(s).`);
              setMafDays('');
              setMafReason('');
              load();
            } catch (e: any) {
              setMsg(e?.response?.data?.message || 'Error al congelar');
            }
          },
        },
      ],
    );
  };

  const revert = (b: any) => {
    Alert.alert(
      'Revertir masivo',
      `Revertir este masivo de ${b.days} dias? Se les quita a los ${b.count} cliente(s).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revertir a todos',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/memberships/freeze-batch/${b.batchId}`);
              load();
            } catch {
              setMsg('No se pudo revertir');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen refreshing={!data}>
      <Title>Dashboard</Title>
      <View style={s.grid}>
        <Stat label="Ingresos del mes" value={`$${(data?.monthlyIncome ?? 0).toFixed(2)}`} color={C.success} />
        <Stat label="Saldo por cobrar" value={`$${(data?.pendingBalance ?? 0).toFixed(2)}`} color={C.warning} />
        <Stat label="Clientes activos" value={`${data?.activeMembers ?? 0}`} color={C.cyan} />
        <Stat label="Membresias al dia" value={`${data?.paidMemberships ?? 0}`} color={C.success} />
      </View>

      {notifs.length > 0 && (
        <Card style={{ marginTop: 12 }}>
          <Text style={s.cardTitle}>Avisos ({notifs.length})</Text>
          {notifs.map((n) => {
            const cobro = n.type === 'cobro';
            return (
              <TouchableOpacity
                key={`${n.type}-${n.membershipId}`}
                onPress={() =>
                  nav.navigate('Clientes', {
                    screen: 'MemberDetail',
                    params: { id: n.memberId, name: n.memberName },
                  })
                }
                style={{
                  borderLeftColor: cobro ? C.warning : C.cyan,
                  borderLeftWidth: 3,
                  paddingLeft: 10,
                  paddingVertical: 6,
                  marginBottom: 2,
                }}
              >
                <Text style={{ color: C.text, fontSize: 14 }}>{n.memberName}</Text>
                <Text style={{ color: cobro ? C.warning : C.cyan, fontSize: 12 }}>
                  {cobro
                    ? `Debe $${Number(n.balance).toFixed(2)} · hace ${n.daysSince} dias`
                    : `Vence en ${n.daysLeft} dia${n.daysLeft === 1 ? '' : 's'}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      {isAdmin && (
        <Card style={{ marginTop: 12 }}>
          <Text style={s.cardTitle}>Congelamiento masivo</Text>
          <Text style={s.cardNote}>
            Feriados, mudanza, etc. Corre el vencimiento de TODAS las membresias
            activas.
          </Text>
          <View style={[s.chips, { alignItems: 'center' }]}>
            {[2, 3, 5, 8, 10, 15].map((d) => {
              const on = mafDays === String(d);
              return (
                <Text
                  key={d}
                  onPress={() => setMafDays(String(d))}
                  style={[s.chip, on && s.chipOn]}
                >
                  {d} dias
                </Text>
              );
            })}
            <TextInput
              style={s.dayInput}
              placeholder="otros"
              placeholderTextColor={C.textFaint}
              keyboardType="numeric"
              value={mafDays}
              onChangeText={setMafDays}
            />
          </View>
          <TextInput
            style={s.input}
            placeholder="Motivo (ej. Feriado, Mudanza)"
            placeholderTextColor={C.textFaint}
            value={mafReason}
            onChangeText={setMafReason}
          />
          <Button title="Congelar a todos" onPress={freezeAll} />
          {msg ? <Text style={{ color: C.success, marginTop: 8 }}>{msg}</Text> : null}

          {batches.length > 0 && (
            <View style={{ marginTop: 16, borderTopColor: C.line, borderTopWidth: 1, paddingTop: 12 }}>
              <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 8 }}>
                Congelamientos masivos activos
              </Text>
              {batches.map((b) => (
                <View key={b.batchId} style={s.batch}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text }}>
                      {b.days} dias{b.reason ? ` · ${b.reason}` : ''}
                    </Text>
                    <Text style={{ color: C.textFaint, fontSize: 12 }}>
                      {b.count} cliente(s) · {new Date(b.createdAt).toLocaleDateString('es-EC')}
                    </Text>
                  </View>
                  <Button title="Revertir" variant="danger" style={{ paddingHorizontal: 14 }} onPress={() => revert(b)} />
                </View>
              ))}
            </View>
          )}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardTitle: { color: C.text, fontWeight: '700', marginBottom: 4 },
  cardNote: { color: C.textFaint, fontSize: 12, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    color: C.textMuted,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: 'hidden',
    fontSize: 13,
  },
  chipOn: { color: C.cyan, borderColor: C.cyan + '66', backgroundColor: C.cyan + '18' },
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
  input: {
    backgroundColor: C.surface2,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    marginBottom: 12,
  },
  batch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface2,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});
