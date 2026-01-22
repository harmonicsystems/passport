import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Visitor pages
import Landing from './pages/Landing';
import Passport from './pages/Passport';
import VisitorScan from './pages/VisitorScan';
import Demo from './pages/Demo';
import DemoQR from './pages/DemoQR';
import Celebrate from './pages/Celebrate';

// Booth pages
import BoothLookup from './pages/booth/BoothLookup';
import BoothCheckIn from './pages/booth/BoothCheckIn';

// Admin pages
import Admin from './pages/Admin';

// Loading spinner
function LoadingScreen() {
  return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="text-center">
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>Loading...</div>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/passport" replace />;
  }

  return <>{children}</>;
}

// Mode indicator bar
function ModeBar() {
  const { user, role } = useAuth();
  const location = window.location.pathname;

  if (!user) return null;

  const isBooth = location.startsWith('/booth');
  const isAdmin = location.startsWith('/admin');

  if (!isBooth && !isAdmin) return null;

  return (
    <div
      style={{
        background: isBooth ? 'var(--color-booth)' : 'var(--color-admin)',
        color: 'white',
        padding: 'var(--space-xs) var(--space-md)',
        fontSize: '0.75rem',
        fontWeight: 600,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}
    >
      {isBooth ? '📋 Booth Mode' : '⚙️ Admin Mode'}
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Determine mode for CSS class
  const path = window.location.pathname;
  const modeClass = path.startsWith('/booth')
    ? 'mode-booth'
    : path.startsWith('/admin')
    ? 'mode-admin'
    : 'mode-visitor';

  return (
    <div className={`app ${modeClass}`}>
      <ModeBar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/demo-qr" element={<DemoQR />} />
        <Route path="/celebrate/:visitCount" element={<Celebrate />} />

        {/* Visitor (requires auth) */}
        <Route
          path="/passport"
          element={
            <ProtectedRoute allowedRoles={['visitor', 'staff', 'admin']}>
              <Passport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan"
          element={
            <ProtectedRoute allowedRoles={['visitor', 'staff', 'admin']}>
              <VisitorScan />
            </ProtectedRoute>
          }
        />

        {/* Booth (staff or admin) */}
        <Route
          path="/booth"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <BoothLookup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booth/checkin/:userId"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <BoothCheckIn />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
