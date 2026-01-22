import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import {
  getRewardProgress,
  getEarnedRewards,
  REWARD_TIERS,
  PLANT_EMOJI,
  ensureGarden,
  type GardenState,
  type User,
} from '@market-passport/shared';
import GardenView from '../components/GardenView';
import QRCode from '../components/QRCode';

export default function Passport() {
  const { user, role, signOut } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData({ id: doc.id, ...doc.data() } as User);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div>Loading your garden...</div>
      </div>
    );
  }

  const garden = ensureGarden(userData?.gardenState);
  const visitCount = garden.plants.length;
  const progress = getRewardProgress(visitCount);
  const earnedRewards = getEarnedRewards(visitCount);

  return (
    <div className="page">
      {/* Header with user info */}
      <div className="page-header">
        <h1 className="page-title">Your Garden</h1>
        <p className="page-subtitle">{user?.displayName || 'Market visitor'}</p>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-lg)',
          }}
          onClick={() => setShowQR(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '320px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 style={{ marginBottom: 'var(--space-md)' }}>Show this at the booth</h3>
              <QRCode value={user?.uid || ''} size={200} />
              <p className="text-muted" style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
                The volunteer will scan this to check you in
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 'var(--space-md)' }}
                onClick={() => setShowQR(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Garden visualization */}
      <div className="card mb-lg">
        <GardenView garden={garden} />
        <div className="text-center" style={{ marginTop: 'var(--space-md)' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-sage)' }}>
            {visitCount}
          </span>
          <span className="text-muted"> {visitCount === 1 ? 'visit' : 'visits'} this season</span>
        </div>
      </div>

      {/* Progress to next reward */}
      {progress.nextReward && (
        <div className="card mb-lg">
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontWeight: 500 }}>Next: {progress.nextReward.title}</span>
            <span className="text-muted" style={{ float: 'right' }}>
              {progress.current} / {progress.required}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
          </div>
          {progress.nextReward.physicalToken && (
            <p
              className="text-muted"
              style={{ marginTop: 'var(--space-sm)', fontSize: '0.875rem' }}
            >
              Earn: {progress.nextReward.physicalToken}
            </p>
          )}
        </div>
      )}

      {/* Earned rewards */}
      {earnedRewards.length > 0 && (
        <div className="card mb-lg">
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 500 }}>Your Rewards</h3>
          <div className="stack">
            {earnedRewards.map((reward) => (
              <div
                key={reward.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-sage)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {reward.threshold}
                </span>
                <div>
                  <div style={{ fontWeight: 500 }}>{reward.title}</div>
                  {reward.physicalToken && (
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                      {reward.physicalToken}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="stack">
        <button className="btn btn-primary btn-large" onClick={() => setShowQR(true)}>
          Show Check-in QR
        </button>

        {(role === 'staff' || role === 'admin') && (
          <Link to="/booth" className="btn btn-secondary">
            Booth Mode
          </Link>
        )}

        {role === 'admin' && (
          <Link to="/admin" className="btn btn-secondary">
            Admin
          </Link>
        )}

        <button className="btn btn-secondary" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
