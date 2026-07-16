import { ReactNode, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardTypeOptions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from './theme';
import { ValidationError } from './validation';

export function Screen({
  children,
  scroll = true,
  refreshing,
}: {
  children?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.body }} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {refreshing ? (
            <ActivityIndicator color={C.cyan} style={{ marginTop: 20 }} />
          ) : (
            children
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}

export function Card({
  children,
  accent,
  style,
}: {
  children: ReactNode;
  accent?: string;
  style?: any;
}) {
  return (
    <View
      style={[
        s.card,
        accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Badge({
  label,
  color = C.textFaint,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[s.badge, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

// Chip seleccionable basado en View (NO usar <Text> con padding como boton:
// en RN los Text con padding se enciman al saltar de linea con flexWrap).
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? C.cyan + '66' : C.line,
        backgroundColor: active ? C.cyan + '18' : 'transparent',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
      }}
    >
      <Text style={{ color: active ? C.cyan : C.textMuted, fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: any;
}) {
  const bg =
    variant === 'primary' ? C.cyan : variant === 'danger' ? C.danger + '22' : 'transparent';
  const fg =
    variant === 'primary' ? C.body : variant === 'danger' ? C.danger : C.textMuted;
  const border = variant === 'ghost' ? C.line : variant === 'danger' ? C.danger + '55' : bg;
  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg, borderColor: border }, style, loading && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: '700' }}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textFaint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

// Campo de contrasena con "ojito" para ver/ocultar lo que se escribe.
export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          style={[s.input, { paddingRight: 46 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textFaint}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShow((v) => !v)}
          style={{ position: 'absolute', right: 12, padding: 4 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={C.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: C.body, justifyContent: 'center' }}>
      <ActivityIndicator color={C.cyan} />
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={{ color: C.danger, marginVertical: 6 }}>{children}</Text>;
}

export function OkText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={{ color: C.success, marginVertical: 6 }}>{children}</Text>;
}

// Feedback en vivo debajo de un campo: gris (vacio) / rojo (mal) / verde (bien).
export function FieldHint({
  value,
  validate,
  ok,
  hint,
}: {
  value: string;
  validate: (v: string) => ValidationError;
  ok?: string;
  hint?: string;
}) {
  const v = value.trim();
  let color = C.textFaint;
  let text = hint ?? '';
  if (v) {
    const err = validate(value);
    if (err) {
      color = C.danger;
      text = err;
    } else if (ok) {
      color = C.success;
      text = ok;
    } else {
      text = '';
    }
  }
  if (!text) return null;
  return (
    <Text style={{ color, fontSize: 12, marginTop: -6, marginBottom: 10 }}>
      {text}
    </Text>
  );
}

const s = StyleSheet.create({
  title: { color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 14 },
  card: {
    backgroundColor: C.surface,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  btn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: C.textMuted, fontSize: 13, marginBottom: 5 },
  input: {
    backgroundColor: C.surface2,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
  },
});
