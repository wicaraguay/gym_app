import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Screen, Title, Card, Badge } from '../ui';
import { C } from '../theme';

const durationLabel = (p: any) =>
  p.durationMonths > 0
    ? p.durationMonths === 1
      ? '1 mes'
      : `${p.durationMonths} meses`
    : `${p.durationDays} dias`;

export function PlansScreen() {
  const [plans, setPlans] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get('/plans').then((r) => setPlans(r.data)).catch(() => {});
    }, []),
  );

  return (
    <Screen>
      <Title>Planes</Title>
      {plans.map((p) => (
        <Card key={p.id} accent={p.active ? C.success : C.textFaint}>
          <View style={s.row}>
            <Text style={s.name}>{p.name}</Text>
            {!p.active && <Badge label="Inactivo" />}
          </View>
          <Text style={s.dur}>Duracion: {durationLabel(p)}</Text>
          <Text style={s.price}>
            ${Number(p.price).toFixed(2)}
            <Text style={s.per}> / {durationLabel(p)}</Text>
          </Text>
        </Card>
      ))}
      <Text style={s.note}>
        Crear o editar planes se hace desde la web.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: C.text, fontWeight: '700', fontSize: 16 },
  dur: { color: C.textFaint, fontSize: 13, marginTop: 2, marginBottom: 8 },
  price: { color: C.text, fontSize: 24, fontWeight: '800' },
  per: { color: C.textFaint, fontSize: 12, fontWeight: '400' },
  note: { color: C.textFaint, fontSize: 12, marginTop: 8 },
});
