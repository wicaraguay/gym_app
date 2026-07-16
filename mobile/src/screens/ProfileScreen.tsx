import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Screen, Title, Card, Button, Field, ErrorText, OkText, FieldHint, PasswordField } from '../ui';
import {
  validateEmail,
  validateRequired,
  validatePassword,
  firstError,
} from '../validation';
import { C } from '../theme';

export function ProfileScreen() {
  const { logout, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', cedula: '', address: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwOk, setPwOk] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api.get('/users/me').then((r) =>
      setForm({
        name: r.data.name || '',
        email: r.data.email || '',
        cedula: r.data.cedula || '',
        address: r.data.address || '',
      }),
    );
  }, []);

  const saveProfile = async () => {
    setOkMsg('');
    const v = firstError(validateRequired(form.name, 'El nombre'), validateEmail(form.email));
    if (v) {
      setErr(v);
      return;
    }
    setErr('');
    setSavingProfile(true);
    try {
      await api.patch('/users/me', {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      setOkMsg('Datos guardados.');
      await refreshUser();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    setPwOk('');
    const v = firstError(
      validateRequired(pw.currentPassword, 'La contraseña actual'),
      validatePassword(pw.newPassword),
      pw.newPassword !== pw.confirm ? 'Las contraseñas nuevas no coinciden.' : null,
    );
    if (v) {
      setPwErr(v);
      return;
    }
    setPwErr('');
    setSavingPw(true);
    try {
      await api.patch('/users/me/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwOk('Contraseña actualizada.');
    } catch (e: any) {
      setPwErr(e?.response?.data?.message || 'No se pudo cambiar');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Screen>
      <Title>Mi perfil</Title>

      <Card>
        <Text style={{ color: C.text, fontWeight: '700', marginBottom: 10 }}>Mis datos</Text>
        <Field label="Nombre completo" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        <Field label="Cedula" value={form.cedula} onChangeText={(t) => setForm({ ...form, cedula: t })} keyboardType="numeric" />
        <Field label="Correo" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" autoCapitalize="none" />
        <FieldHint value={form.email} validate={(v) => validateEmail(v)} ok="Email valido." />
        <Field label="Direccion" value={form.address} onChangeText={(t) => setForm({ ...form, address: t })} />
        <ErrorText>{err}</ErrorText>
        <OkText>{okMsg}</OkText>
        <Button title="Guardar datos" onPress={saveProfile} loading={savingProfile} />
      </Card>

      <Card>
        <Text style={{ color: C.text, fontWeight: '700', marginBottom: 10 }}>Cambiar contraseña</Text>
        <PasswordField label="Contraseña actual" value={pw.currentPassword} onChangeText={(t) => setPw({ ...pw, currentPassword: t })} />
        <PasswordField label="Nueva contraseña (min. 6)" value={pw.newPassword} onChangeText={(t) => setPw({ ...pw, newPassword: t })} />
        <FieldHint value={pw.newPassword} validate={(v) => validatePassword(v)} ok="Contraseña valida." hint="Minimo 6 caracteres." />
        <PasswordField label="Repetir nueva" value={pw.confirm} onChangeText={(t) => setPw({ ...pw, confirm: t })} />
        <FieldHint value={pw.confirm} validate={(v) => (v === pw.newPassword ? null : 'Las contraseñas no coinciden.')} ok="Coincide." />
        <ErrorText>{pwErr}</ErrorText>
        <OkText>{pwOk}</OkText>
        <Button title="Actualizar contraseña" onPress={changePassword} loading={savingPw} />
      </Card>

      <Button title="Cerrar sesion" variant="danger" onPress={logout} style={{ marginTop: 8 }} />
    </Screen>
  );
}
