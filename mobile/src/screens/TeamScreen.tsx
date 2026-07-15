import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Screen, Title, Card, Badge, Button, Field, ErrorText, OkText } from '../ui';
import { C } from '../theme';

const roleLabel = (r: string) => (r === 'ADMIN' ? 'Administrador' : 'Recepcionista');

export function TeamScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'RECEPCIONISTA' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');

  const load = useCallback(() => {
    api.get('/users').then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    setError('');
    setOk('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'RECEPCIONISTA' });
      setOk('Persona agregada.');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo crear');
    }
  };

  const toggle = (u: any) => {
    const doIt = async () => {
      try {
        await api.patch(`/users/${u.id}`, { active: !u.active });
        load();
      } catch (e: any) {
        setError(e?.response?.data?.message || 'No se pudo');
      }
    };
    if (u.active) {
      Alert.alert('Desactivar', `Desactivar a ${u.name}?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desactivar', style: 'destructive', onPress: doIt },
      ]);
    } else {
      doIt();
    }
  };

  const remove = (u: any) => {
    Alert.alert(
      'Eliminar usuario',
      `Eliminar a ${u.name} definitivamente? No se puede deshacer. Si solo queres quitarle el acceso, mejor desactivalo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setError('');
            setOk('');
            try {
              await api.delete(`/users/${u.id}`);
              setOk(`${u.name} fue eliminado.`);
              load();
            } catch (e: any) {
              setError(e?.response?.data?.message || 'No se pudo eliminar');
            }
          },
        },
      ],
    );
  };

  const saveReset = async (u: any) => {
    if (newPass.trim().length < 4) {
      setError('La clave debe tener al menos 4 caracteres.');
      return;
    }
    setError('');
    try {
      await api.patch(`/users/${u.id}`, { password: newPass });
      setResetId(null);
      setNewPass('');
      setOk(`Clave de ${u.name} actualizada.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo cambiar la clave');
    }
  };

  return (
    <Screen>
      <Title>Equipo</Title>

      <Card>
        <Text style={s.cardTitle}>Agregar persona</Text>
        <Field label="Nombre" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        <Field
          label="Correo"
          value={form.email}
          onChangeText={(t) => setForm({ ...form, email: t })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Contraseña (min. 4)"
          value={form.password}
          onChangeText={(t) => setForm({ ...form, password: t })}
          secureTextEntry
        />
        <Text style={s.label}>Rol</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {['RECEPCIONISTA', 'ADMIN'].map((r) => {
            const on = form.role === r;
            return (
              <Text
                key={r}
                onPress={() => setForm({ ...form, role: r })}
                style={[s.roleChip, on && { color: C.cyan, borderColor: C.cyan + '66', backgroundColor: C.cyan + '18' }]}
              >
                {roleLabel(r)}
              </Text>
            );
          })}
        </View>
        <ErrorText>{error}</ErrorText>
        <OkText>{ok}</OkText>
        <Button title="Agregar al equipo" onPress={create} />
      </Card>

      {users.map((u) => {
        const isMe = u.id === user?.id;
        return (
          <Card key={u.id}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>
                  {u.name} {isMe ? <Text style={{ color: C.textFaint, fontSize: 12 }}>(vos)</Text> : ''}
                </Text>
                <Text style={s.email}>{u.email}</Text>
              </View>
              <Badge label={roleLabel(u.role)} color={u.role === 'ADMIN' ? C.cyan : C.textFaint} />
            </View>
            {!u.active && <View style={{ marginTop: 6 }}><Badge label="Inactivo" /></View>}
            {!isMe && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button
                  title="Clave"
                  variant="ghost"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setResetId(resetId === u.id ? null : u.id);
                    setNewPass('');
                  }}
                />
                <Button
                  title={u.active ? 'Desactivar' : 'Activar'}
                  variant="ghost"
                  style={{ flex: 1 }}
                  onPress={() => toggle(u)}
                />
                <Button
                  title="Eliminar"
                  variant="danger"
                  style={{ flex: 1 }}
                  onPress={() => remove(u)}
                />
              </View>
            )}
            {resetId === u.id && (
              <View style={{ marginTop: 10 }}>
                <Field
                  value={newPass}
                  onChangeText={setNewPass}
                  placeholder={`Nueva clave para ${u.name}`}
                  secureTextEntry
                />
                <Button title="Guardar clave" onPress={() => saveReset(u)} />
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  cardTitle: { color: C.text, fontWeight: '700', marginBottom: 10 },
  label: { color: C.textMuted, fontSize: 13, marginBottom: 5 },
  roleChip: {
    color: C.textMuted,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
    fontSize: 13,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: C.text, fontWeight: '700', fontSize: 15 },
  email: { color: C.textFaint, fontSize: 12, marginTop: 1 },
});
