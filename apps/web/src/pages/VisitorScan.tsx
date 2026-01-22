import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import {
  extractJwtFromQr,
  ensureGarden,
  addPlant,
  getNewlyEarnedReward,
  getPlantDisplay,
  selectPlantType,
  PLANT_EMOJI,
  type GardenPlant,
  type RewardTier,
} from '@market-passport/shared';
import GardenView from '../components/GardenView';

type ScanState = 'scanning' | 'checking' | 'success' | 'already' | 'error';

export default function VisitorScan() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScanState>('scanning');
  const [error, setError] = useState<string | null>(null);
  const [newPlant, setNewPlant] = useState<GardenPlant | null>(null);
  const [newReward, setNewReward] = useState<RewardTier | null>(null);
  const [visitCount, setVisitCount] = useState(0);

  // Badge icons
  const REWARD_ICONS: Record<string, string> = {
    'first-harvest': '🌱',
    'getting-started': '🧺',
    'regular': '📍',
    'community-builder': '👜',
    'season-finisher': '☕',
    'perennial': '⭐',
  };

  useEffect(() => {
    if (state !== 'scanning') return;

    let stream: MediaStream | null = null;
    let controls: any = null;
    let stopped = false;

    async function startScanner() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current && !stopped) {
          videoRef.current.srcObject = stream;

          controls = await reader.decodeFromVideoElement(videoRef.current, (result: any) => {
            if (result && !stopped) {
              const text = result.getText();
              if (text.startsWith('mp1:')) {
                stopped = true;
                handleScan(text);
              }
            }
          });
        }
      } catch (err) {
        console.error('Scanner error:', err);
        setError('Unable to access camera');
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (controls && controls.stop) {
        controls.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state]);

  const handleScan = async (qrPayload: string) => {
    if (!user) return;

    setState('checking');

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in today
      const checkInsRef = collection(db, 'checkIns');
      const existingQuery = query(
        checkInsRef,
        where('userId', '==', user.uid),
        where('eventDayId', '==', today)
      );
      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        setState('already');
        return;
      }

      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const currentGarden = ensureGarden(userData?.gardenState);
      const newVisitCount = currentGarden.plants.length + 1;

      // Check for milestone
      const reward = getNewlyEarnedReward(newVisitCount);
      setNewReward(reward);

      // Add plant
      const updatedGarden = addPlant(
        currentGarden,
        today,
        ['browsing'], // Default for self-scan
        reward?.gardenUnlock?.includes('golden') ? 'golden' : undefined
      );

      // Save the newest plant for animation
      const planted = updatedGarden.plants[updatedGarden.plants.length - 1];
      setNewPlant(planted);
      setVisitCount(newVisitCount);

      // Create check-in
      await addDoc(checkInsRef, {
        marketId: 'kinderhook',
        eventDayId: today,
        userId: user.uid,
        timestamp: Date.now(),
        categories: ['browsing'],
        operatorId: user.uid, // self check-in
        source: 'self',
      });

      // Update garden
      await updateDoc(doc(db, 'users', user.uid), {
        gardenState: updatedGarden,
      });

      setState('success');
    } catch (err) {
      console.error('Check-in error:', err);
      setError('Something went wrong');
      setState('error');
    }
  };

  // For demo: simulate scan
  const handleDemoScan = () => {
    handleScan('mp1:demo-token');
  };

  // Success screen - the fun part!
  if (state === 'success' && newPlant) {
    return (
      <div className="page" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {/* Big plant reveal */}
          <div
            style={{
              fontSize: '5rem',
              marginBottom: 'var(--space-lg)',
              animation: 'bounceIn 0.6s ease',
            }}
          >
            {getPlantDisplay(newPlant)}
          </div>

          <h1 className="page-title">Your garden grew!</h1>
          <p className="text-muted" style={{ marginTop: 'var(--space-sm)', fontSize: '1.125rem' }}>
            Visit #{visitCount} this season
          </p>

          {/* Badge earned! */}
          {newReward && (
            <div
              className="card"
              style={{
                marginTop: 'var(--space-xl)',
                background: 'linear-gradient(135deg, var(--color-sage) 0%, #6b9b7a 100%)',
                color: 'white',
                animation: 'slideUp 0.8s ease',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>
                {REWARD_ICONS[newReward.id] || '🏆'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                New Badge: {newReward.title}!
              </div>
              <div style={{ marginTop: 'var(--space-sm)', opacity: 0.9 }}>
                {newReward.description}
              </div>
              {newReward.physicalToken && (
                <div
                  style={{
                    marginTop: 'var(--space-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                  }}
                >
                  🎁 Pick up your <strong>{newReward.physicalToken}</strong> at the booth!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stack" style={{ marginTop: 'var(--space-xl)' }}>
          <Link to="/passport" className="btn btn-primary btn-large">
            View Your Garden
          </Link>
          <Link to="/" className="btn btn-secondary">
            Done
          </Link>
        </div>
      </div>
    );
  }

  // Already checked in
  if (state === 'already') {
    return (
      <div className="page" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>🌻</div>
        <h1 className="page-title">Already checked in!</h1>
        <p className="text-muted" style={{ marginTop: 'var(--space-sm)' }}>
          You've already visited today. See you next week!
        </p>
        <div className="stack" style={{ marginTop: 'var(--space-xl)' }}>
          <Link to="/passport" className="btn btn-primary btn-large">
            View Your Garden
          </Link>
        </div>
      </div>
    );
  }

  // Checking in
  if (state === 'checking') {
    return (
      <div className="page" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🌱</div>
        <h1 className="page-title">Planting...</h1>
      </div>
    );
  }

  // Error
  if (state === 'error') {
    return (
      <div className="page" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>😕</div>
        <h1 className="page-title">Something went wrong</h1>
        <p className="text-muted">{error || 'Please try again'}</p>
        <div className="stack" style={{ marginTop: 'var(--space-xl)' }}>
          <button className="btn btn-primary btn-large" onClick={() => setState('scanning')}>
            Try Again
          </button>
          <Link to="/" className="btn btn-secondary">Back</Link>
        </div>
      </div>
    );
  }

  // Scanning view
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
        {error ? (
          <div style={{ color: 'white', textAlign: 'center', padding: 'var(--space-lg)' }}>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Scan frame */}
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
              Scan the market QR code
            </div>
          </>
        )}
      </div>

      <div style={{ padding: 'var(--space-lg)', background: 'var(--color-cream)' }}>
        <div className="stack">
          <button className="btn btn-primary btn-large" onClick={handleDemoScan}>
            Demo: Simulate Scan
          </button>
          <Link to="/" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
