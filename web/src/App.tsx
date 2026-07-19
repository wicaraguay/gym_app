import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { PublicLayout } from './public/PublicLayout';
import { Home } from './public/Home';
import { About } from './public/About';
import { Contact } from './public/Contact';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { MemberDetail } from './pages/MemberDetail';
import { Plans } from './pages/Plans';
import { Team } from './pages/Team';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { SiteAdmin } from './pages/SiteAdmin';
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
      {/* ----- Web publica (sin login) ----- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sobre-nosotros" element={<About />} />
        <Route path="/contacto" element={<Contact />} />
      </Route>

      {/* ----- Login ----- */}
      <Route
        path="/login"
        element={user ? <Navigate to="/admin" replace /> : <Login />}
      />

      {/* ----- Admin (protegido) ----- */}
      <Route
        path="/admin"
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
        <Route
          path="sitio"
          element={user?.role === 'ADMIN' ? <SiteAdmin /> : <Forbidden />}
        />
        {/* Ruta desconocida dentro del admin: 404 con el menu visible. */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
