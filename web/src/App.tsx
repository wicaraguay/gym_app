import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { MemberDetail } from './pages/MemberDetail';
import { Plans } from './pages/Plans';
import { Team } from './pages/Team';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { NotFound, Forbidden } from './pages/StatusPage';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Cargando...
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="plans" element={<Plans />} />
        <Route
          path="team"
          element={user?.role === 'ADMIN' ? <Team /> : <Forbidden />}
        />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        {/* Cualquier ruta desconocida dentro de la sesion: 404 CON el menu
            visible, para que el usuario pueda navegar a otra seccion. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
