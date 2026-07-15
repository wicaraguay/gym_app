import { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { C } from './theme';

// Punto UNICO de captura. El dia que integres Sentry en el mobile:
//   import * as Sentry from '@sentry/react-native';
//   Sentry.captureException(error);  <- va SOLO aca.
function report(error: unknown, componentStack?: string) {
  console.error('[app-error]', error);
  if (componentStack) console.error('[app-error] stack:', componentStack);
}

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

// Debe ser class component: React solo expone getDerivedStateFromError /
// componentDidCatch en clases.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    report(error, info?.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.body,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            borderWidth: 1,
            borderColor: C.danger + '55',
            backgroundColor: C.surface,
            borderRadius: 18,
            padding: 22,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 34 }}>⚠️</Text>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '800', marginTop: 8 }}>
            Algo salio mal
          </Text>
          <Text
            style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 }}
          >
            Ocurrio un error inesperado. Tus datos estan a salvo.
          </Text>
          <TouchableOpacity
            onPress={this.reset}
            style={{
              marginTop: 18,
              backgroundColor: C.cyan,
              borderRadius: 12,
              paddingHorizontal: 22,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: C.body, fontWeight: '700' }}>Reintentar</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <Text
              style={{ color: C.danger, fontSize: 11, marginTop: 14, textAlign: 'center' }}
              numberOfLines={4}
            >
              {error.message}
            </Text>
          )}
        </View>
      </View>
    );
  }
}
