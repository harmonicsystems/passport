import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getRewardProgress,
  getEarnedRewards,
  REWARD_TIERS,
  type GardenState,
  type GardenPlant,
} from '@market-passport/shared';
import GardenView from '../components/GardenView';

// Demo garden with lots of plants
const DEMO_PLANTS: GardenPlant[] = [
  { id: '1', type: 'tomato', plantedAt: Date.now() - 86400000 * 30, eventDayId: 'd1', position: { x: 0, y: 0 } },
  { id: '2', type: 'sunflower', plantedAt: Date.now() - 86400000 * 23, eventDayId: 'd2', position: { x: 1, y: 0 } },
  { id: '3', type: 'carrot', plantedAt: Date.now() - 86400000 * 16, eventDayId: 'd3', position: { x: 2, y: 0 } },
  { id: '4', type: 'flower', plantedAt: Date.now() - 86400000 * 14, eventDayId: 'd4', position: { x: 3, y: 0 } },
  { id: '5', type: 'corn', plantedAt: Date.now() - 86400000 * 12, eventDayId: 'd5', position: { x: 0, y: 1 }, variant: 'golden' },
  { id: '6', type: 'pepper', plantedAt: Date.now() - 86400000 * 10, eventDayId: 'd6', position: { x: 1, y: 1 } },
  { id: '7', type: 'strawberry', plantedAt: Date.now() - 86400000 * 8, eventDayId: 'd7', position: { x: 2, y: 1 } },
  { id: '8', type: 'lettuce', plantedAt: Date.now() - 86400000 * 6, eventDayId: 'd8', position: { x: 3, y: 1 }, variant: 'golden' },
  { id: '9', type: 'pumpkin', plantedAt: Date.now() - 86400000 * 4, eventDayId: 'd9', position: { x: 0, y: 2 } },
  { id: '10', type: 'sunflower', plantedAt: Date.now() - 86400000 * 2, eventDayId: 'd10', position: { x: 1, y: 2 } },
];

// Badge icons for rewards
const REWARD_ICONS: Record<string, string> = {
  'first-harvest': '🌱',
  'getting-started': '🧺',
  'regular': '📍',
  'community-builder': '👜',
  'season-finisher': '☕',
  'perennial': '⭐',
};

export default function Demo() {
  const [visitCount, setVisitCount] = useState(10);

  const demoGarden: GardenState = {
    plants: DEMO_PLANTS.slice(0, visitCount),
    unlockedBackgrounds: ['default', 'summer'],
    gridSize: { width: 4, height: 3 },
  };

  const progress = getRewardProgress(visitCount);
  const earnedRewards = getEarnedRewards(visitCount);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Demo Garden</h1>
        <p className="page-subtitle">See what a collector's passport looks like</p>
      </div>

      {/* Visit slider */}
      <div className="card mb-lg">
        <label style={{ display: 'block' }}>
          <span style={{ fontWeight: 500 }}>Visits: {visitCount}</span>
          <input
            type="range"
            min="0"
            max="12"
            value={visitCount}
            onChange={(e) => setVisitCount(Number(e.target.value))}
            style={{
              width: '100%',
              marginTop: 'var(--space-sm)',
              accentColor: 'var(--color-sage)',
            }}
          />
        </label>
      </div>

      {/* Garden */}
      <div className="card mb-lg">
        <GardenView garden={demoGarden} />
        <div className="text-center" style={{ marginTop: 'var(--space-md)' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-sage)' }}>
            {visitCount}
          </span>
          <span className="text-muted"> {visitCount === 1 ? 'visit' : 'visits'} this season</span>
        </div>
      </div>

      {/* Progress to next reward */}
      {progress.nextReward && (
        <div className="card mb-lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontSize: '1.5rem' }}>{REWARD_ICONS[progress.nextReward.id] || '🎯'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{progress.nextReward.title}</div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                {progress.required - progress.current} more to go
              </div>
            </div>
            <span className="text-muted">
              {progress.current}/{progress.required}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
          </div>
          {progress.nextReward.physicalToken && (
            <p style={{ marginTop: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-sage)' }}>
              🎁 Earn: {progress.nextReward.physicalToken}
            </p>
          )}
        </div>
      )}

      {/* Earned badges */}
      <div className="card mb-lg">
        <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 500 }}>Your Badges</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-md)',
          }}
        >
          {REWARD_TIERS.map((reward) => {
            const earned = earnedRewards.some((r) => r.id === reward.id);
            return (
              <div
                key={reward.id}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-md)',
                  background: earned ? 'rgba(74, 124, 89, 0.1)' : 'var(--color-warm-white)',
                  borderRadius: 'var(--radius-md)',
                  opacity: earned ? 1 : 0.4,
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>
                  {REWARD_ICONS[reward.id] || '🏆'}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {reward.title}
                </div>
                {earned && reward.physicalToken && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-sage)', marginTop: '2px' }}>
                    {reward.physicalToken}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All rewards list */}
      {earnedRewards.length > 0 && (
        <div className="card mb-lg" style={{ background: 'var(--color-sage)', color: 'white' }}>
          <h3 style={{ marginBottom: 'var(--space-sm)', fontWeight: 500 }}>
            🎉 Ready to pick up!
          </h3>
          <div style={{ fontSize: '0.875rem' }}>
            {earnedRewards
              .filter((r) => r.physicalToken)
              .map((r) => r.physicalToken)
              .join(' • ')}
          </div>
        </div>
      )}

      <div className="stack">
        <Link to="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
