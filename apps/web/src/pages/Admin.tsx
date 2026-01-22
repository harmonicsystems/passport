import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

interface Stats {
  todayCheckIns: number;
  totalCheckIns: number;
  uniqueVisitors: number;
  newVisitorsToday: number;
}

export default function Admin() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Get today's check-ins
        const todayQuery = query(
          collection(db, 'checkIns'),
          where('eventDayId', '==', today)
        );
        const todaySnapshot = await getDocs(todayQuery);

        // Get all check-ins (for total count)
        const allCheckIns = await getDocs(collection(db, 'checkIns'));

        // Get unique visitors (count of users with check-ins)
        const uniqueUserIds = new Set(allCheckIns.docs.map((doc) => doc.data().userId));

        // Get users created today
        const todayStart = new Date(today).getTime();
        const usersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', todayStart)
        );
        const newUsersSnapshot = await getDocs(usersQuery);

        setStats({
          todayCheckIns: todaySnapshot.size,
          totalCheckIns: allCheckIns.size,
          uniqueVisitors: uniqueUserIds.size,
          newVisitorsToday: newUsersSnapshot.size,
        });
      } catch (err) {
        console.error('Error loading stats:', err);
      }
      setLoading(false);
    }

    loadStats();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Market management</p>
      </div>

      {/* Today's stats */}
      <div className="card mb-lg">
        <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 500 }}>Today</h3>
        {loading ? (
          <div className="text-muted">Loading stats...</div>
        ) : stats ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-md)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-sage)' }}>
                {stats.todayCheckIns}
              </div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                Check-ins today
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-sage)' }}>
                {stats.newVisitorsToday}
              </div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                New visitors
              </div>
            </div>
          </div>
        ) : (
          <div className="text-muted">Unable to load stats</div>
        )}
      </div>

      {/* Season stats */}
      <div className="card mb-lg">
        <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 500 }}>Season Total</h3>
        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : stats ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-md)',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-brown)' }}>
                {stats.totalCheckIns}
              </div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                Total check-ins
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-brown)' }}>
                {stats.uniqueVisitors}
              </div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                Unique visitors
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Staff management note */}
      <div className="card mb-lg" style={{ background: 'var(--color-warm-white)' }}>
        <h3 style={{ marginBottom: 'var(--space-sm)', fontWeight: 500 }}>
          Staff Management
        </h3>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          To add booth operators, create documents in the <code>staff</code> collection
          in Firebase Console with their email address.
        </p>
      </div>

      {/* Actions */}
      <div className="stack">
        <Link to="/booth" className="btn btn-primary btn-large">
          Open Booth Mode
        </Link>
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
