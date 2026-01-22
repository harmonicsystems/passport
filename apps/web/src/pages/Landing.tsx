import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user, role, signInWithGoogle } = useAuth();

  // Redirect if already signed in
  useEffect(() => {
    if (user) {
      navigate('/passport');
    }
  }, [user, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginTop: 'auto' }}>
        <h1 className="page-title">Market Passport</h1>
        <p className="page-subtitle">Your digital garden at the farmers market</p>
      </div>

      <div className="stack" style={{ marginBottom: 'auto' }}>
        <button className="btn btn-primary btn-large" onClick={handleSignIn}>
          Sign in with Google
        </button>

        <Link to="/demo" className="btn btn-secondary btn-large">
          See Demo Garden
        </Link>
      </div>

      <footer className="text-center text-muted" style={{ marginTop: 'var(--space-xl)' }}>
        <p style={{ fontSize: '0.875rem' }}>
          Scan the market QR code to grow your garden
        </p>
      </footer>
    </div>
  );
}
