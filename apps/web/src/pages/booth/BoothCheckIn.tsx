import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import {
  PURCHASE_CATEGORIES,
  CATEGORY_LABELS,
  type PurchaseCategory,
  type User,
  ensureGarden,
  addPlant,
  getNewlyEarnedReward,
  hasPhysicalReward,
} from '@market-passport/shared';

export default function BoothCheckIn() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: operator } = useAuth();

  const [visitor, setVisitor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<PurchaseCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    newReward?: { title: string; physicalToken?: string };
    visitCount?: number;
  } | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  // Load visitor data
  useEffect(() => {
    async function loadVisitor() {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setVisitor({ id: userDoc.id, ...userDoc.data() } as User);

          // Check if already checked in today
          const today = new Date().toISOString().split('T')[0];
          const checkInsRef = collection(db, 'checkIns');
          const q = query(
            checkInsRef,
            where('userId', '==', userId),
            where('eventDayId', '==', today) // Using date as eventDayId for MVP
          );
          const snapshot = await getDocs(q);
          setAlreadyCheckedIn(!snapshot.empty);
        }
      } catch (err) {
        console.error('Error loading visitor:', err);
      }
      setLoading(false);
    }

    loadVisitor();
  }, [userId]);

  const toggleCategory = (category: PurchaseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleCheckIn = async () => {
    if (!userId || !visitor || !operator) return;

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Double-check not already checked in
      const checkInsRef = collection(db, 'checkIns');
      const existingQuery = query(
        checkInsRef,
        where('userId', '==', userId),
        where('eventDayId', '==', today)
      );
      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        setResult({
          success: false,
          message: 'Already checked in today!',
        });
        setSubmitting(false);
        return;
      }

      // Get current garden and calculate new state
      const currentGarden = ensureGarden(visitor.gardenState);
      const categories = selectedCategories.length > 0 ? selectedCategories : ['browsing' as PurchaseCategory];

      // Check for milestone rewards
      const newVisitCount = currentGarden.plants.length + 1;
      const newReward = getNewlyEarnedReward(newVisitCount);
      const physicalReward = hasPhysicalReward(newVisitCount);

      // Add plant to garden
      const newGarden = addPlant(
        currentGarden,
        today,
        categories,
        newReward?.gardenUnlock?.includes('golden') ? 'golden' : undefined
      );

      // Create check-in record
      await addDoc(checkInsRef, {
        marketId: 'kinderhook', // Hardcoded for MVP
        eventDayId: today,
        userId,
        timestamp: Date.now(),
        categories,
        operatorId: operator.uid,
        source: 'booth',
      });

      // Update user's garden
      await updateDoc(doc(db, 'users', userId), {
        gardenState: newGarden,
      });

      setResult({
        success: true,
        message: "You're all set!",
        newReward: newReward ? {
          title: newReward.title,
          physicalToken: newReward.physicalToken,
        } : undefined,
        visitCount: newVisitCount,
      });
    } catch (err) {
      console.error('Check-in error:', err);
      setResult({
        success: false,
        message: 'Something went wrong. Please try again.',
      });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div>Loading visitor...</div>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Visitor Not Found</h1>
        </div>
        <Link to="/booth" className="btn btn-primary btn-large">
          Back to Lookup
        </Link>
      </div>
    );
  }

  // Show result
  if (result) {
    return (
      <div className="page">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="text-center">
            {result.success ? (
              <>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto var(--space-lg)',
                    borderRadius: '50%',
                    background: 'var(--color-sage)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h1 className="page-title">{result.message}</h1>
                <p className="text-muted" style={{ marginTop: 'var(--space-sm)' }}>
                  {visitor.displayName}'s garden grew!
                </p>
                <p style={{ marginTop: 'var(--space-sm)', fontSize: '1.25rem' }}>
                  Visit #{result.visitCount}
                </p>

                {result.newReward && (
                  <div
                    className="card"
                    style={{
                      marginTop: 'var(--space-lg)',
                      background: 'var(--color-sage)',
                      color: 'white',
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      Milestone: {result.newReward.title}!
                    </div>
                    {result.newReward.physicalToken && (
                      <div style={{ marginTop: 'var(--space-sm)' }}>
                        Ready to pick up: <strong>{result.newReward.physicalToken}</strong>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto var(--space-lg)',
                    borderRadius: '50%',
                    background: 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h1 className="page-title">{result.message}</h1>
              </>
            )}
          </div>
        </div>

        <div className="stack">
          <Link to="/booth" className="btn btn-primary btn-large">
            Next Visitor
          </Link>
        </div>
      </div>
    );
  }

  const currentVisitCount = ensureGarden(visitor.gardenState).plants.length;

  return (
    <div className="page">
      {/* Visitor info */}
      <div className="page-header">
        <h1 className="page-title">{visitor.displayName || 'Visitor'}</h1>
        <p className="page-subtitle">
          {currentVisitCount} {currentVisitCount === 1 ? 'visit' : 'visits'} this season
        </p>
      </div>

      {alreadyCheckedIn ? (
        <div className="card mb-lg" style={{ background: 'var(--color-warm-white)' }}>
          <div className="text-center">
            <div style={{ fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>
              Already checked in today
            </div>
            <p className="text-muted">See you next week!</p>
          </div>
        </div>
      ) : (
        <>
          {/* Category selection */}
          <div className="card mb-lg">
            <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 500 }}>
              What'd you find today?
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-sm)',
              }}
            >
              {PURCHASE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  style={{
                    padding: 'var(--space-md)',
                    border: '2px solid',
                    borderColor: selectedCategories.includes(category)
                      ? 'var(--color-sage)'
                      : 'var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: selectedCategories.includes(category)
                      ? 'rgba(74, 124, 89, 0.1)'
                      : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
            <p className="text-muted" style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
              Optional - helps us understand market trends
            </p>
          </div>

          {/* Check-in button */}
          <button
            className="btn btn-primary btn-large"
            onClick={handleCheckIn}
            disabled={submitting}
          >
            {submitting ? 'Checking in...' : 'Check In'}
          </button>
        </>
      )}

      <div className="stack" style={{ marginTop: 'var(--space-lg)' }}>
        <Link to="/booth" className="btn btn-secondary">
          Back to Lookup
        </Link>
      </div>
    </div>
  );
}
