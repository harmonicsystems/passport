import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '@market-passport/shared';

export default function BoothLookup() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // QR Scanner setup
  useEffect(() => {
    if (!scanMode) return;

    let stream: MediaStream | null = null;
    let reader: any = null;

    async function startScanner() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        reader = new BrowserQRCodeReader();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Start decoding
          reader.decodeFromVideoElement(videoRef.current, (result: any) => {
            if (result) {
              const userId = result.getText();
              if (userId && userId.length > 10) {
                // Looks like a Firebase UID
                navigate(`/booth/checkin/${userId}`);
              }
            }
          });
        }
      } catch (err) {
        console.error('Scanner error:', err);
        setScanMode(false);
      }
    }

    startScanner();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (reader) {
        reader.reset();
      }
    };
  }, [scanMode, navigate]);

  // Search by name
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // Search by display name (case-insensitive would need a cloud function)
      // For MVP, do a simple prefix match
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      setSearchResults(users);
    } catch (err) {
      console.error('Search error:', err);
    }
    setSearching(false);
  };

  // Scan mode view
  if (scanMode) {
    return (
      <div className="page" style={{ padding: 0 }}>
        <div
          style={{
            flex: 1,
            background: '#000',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Scan overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '250px',
                height: '250px',
                border: '3px solid white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              top: 'var(--space-lg)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
            }}
          >
            Scan visitor's QR code
          </div>
        </div>

        <div style={{ padding: 'var(--space-lg)', background: 'var(--color-cream)' }}>
          <button className="btn btn-secondary btn-large" onClick={() => setScanMode(false)}>
            Cancel Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Check-in Booth</h1>
        <p className="page-subtitle">Scan or search for visitors</p>
      </div>

      {/* Scan button */}
      <button
        className="btn btn-primary btn-large mb-lg"
        onClick={() => setScanMode(true)}
      >
        Scan Visitor QR
      </button>

      {/* Search */}
      <div className="card mb-lg">
        <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 500 }}>
          Or search by name
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter name..."
            style={{
              flex: 1,
              padding: 'var(--space-md)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
          />
          <button className="btn btn-secondary" onClick={handleSearch} disabled={searching}>
            {searching ? '...' : 'Search'}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="stack" style={{ marginTop: 'var(--space-md)' }}>
            {searchResults.map((visitor) => (
              <button
                key={visitor.id}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => navigate(`/booth/checkin/${visitor.id}`)}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{visitor.displayName || 'Unknown'}</div>
                  <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {visitor.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="stack">
        <Link to="/passport" className="btn btn-secondary">
          View My Passport
        </Link>
        <button className="btn btn-secondary" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
