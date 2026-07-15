import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import { Field, Button, ErrorText } from '../ui';
import { C } from '../theme';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          'No se pudo conectar. Revisa el backend y la IP en src/api.ts.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <Text style={s.logo}>
          CROSS<Text style={{ color: C.text }}>FIT</Text>
        </Text>
        <Text style={s.subtitle}>Panel del dueño</Text>

        <Field
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <ErrorText>{error}</ErrorText>
        <Button title="Ingresar" onPress={submit} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.body },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 34, fontWeight: '800', color: C.cyan, textAlign: 'center' },
  subtitle: { color: C.textFaint, textAlign: 'center', marginBottom: 30, marginTop: 4 },
});
