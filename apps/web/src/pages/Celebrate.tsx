import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getNewlyEarnedReward,
  getEarnedRewards,
  getRewardProgress,
  selectPlantType,
  PLANT_EMOJI,
  REWARD_TIERS,
  type PlantType,
  type RewardTier,
} from '@market-passport/shared';

const REWARD_ICONS: Record<string, string> = {
  'first-harvest': '🌱',
  'getting-started': '🧺',
  'regular': '📍',
  'community-builder': '👜',
  'season-finisher': '☕',
  'perennial': '⭐',
};

// Fun celebration messages by milestone
const CELEBRATION_MESSAGES: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Welcome!', subtitle: 'Your first seed is planted' },
  2: { title: 'You came back!', subtitle: 'Another plant for your garden' },
  3: { title: 'Getting Started!', subtitle: "You're becoming a regular" },
  4: { title: 'Growing strong!', subtitle: 'Your garden is filling in' },
  5: { title: 'Regular!', subtitle: "You've earned your place here" },
  6: { title: 'Keep going!', subtitle: 'Your garden is thriving' },
  7: { title: 'Almost there!', subtitle: 'One more for Community Builder' },
  8: { title: 'Community Builder!', subtitle: 'You help make this market special' },
  9: { title: 'Incredible!', subtitle: "You're a true market friend" },
  10: { title: 'Double digits!', subtitle: '10 visits this season' },
  11: { title: 'So close!', subtitle: 'One more for Season Finisher' },
  12: { title: 'Season Finisher!', subtitle: 'You made it the whole season!' },
};

// Particle/confetti colors
const CONFETTI_COLORS = ['#4a7c59', '#6b9b7a', '#e8c170', '#c44536', '#f0a', '#58d'];

export default function Celebrate() {
  const { visitCount: visitParam } = useParams<{ visitCount: string }>();
  const visitCount = parseInt(visitParam || '1', 10);

  const [phase, setPhase] = useState<'plant' | 'badge' | 'garden'>('plant');
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

  const newReward = getNewlyEarnedReward(visitCount);
  const earnedRewards = getEarnedRewards(visitCount);
  const progress = getRewardProgress(visitCount);
  const plantType = selectPlantType(['produce']);
  const plantEmoji = PLANT_EMOJI[plantType];

  const message = CELEBRATION_MESSAGES[visitCount] || {
    title: `Visit #${visitCount}!`,
    subtitle: 'Your garden keeps growing',
  };

  // Generate confetti particles
  useEffect(() => {
    if (newReward) {
      const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5,
      }));
      setConfetti(particles);
    }
  }, []);

  // Progress through phases
  useEffect(() => {
    if (newReward) {
      const timer = setTimeout(() => setPhase('badge'), 2000);
      return () => clearTimeout(timer);
    }
  }, [newReward]);

  return (
    <div className="page" style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Confetti for milestones */}
      {newReward && confetti.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
          {confetti.map((particle) => (
            <div
              key={particle.id}
              style={{
                position: 'absolute',
                left: `${particle.x}%`,
                top: '-20px',
                width: '10px',
                height: '10px',
                borderRadius: particle.id % 2 === 0 ? '50%' : '2px',
                background: particle.color,
                animation: `confettiFall 3s ease-in ${particle.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
        {/* Phase 1: Plant reveal */}
        <div style={{ animation: 'bounceIn 0.6s ease' }}>
          <div style={{ fontSize: '6rem', marginBottom: 'var(--space-md)' }}>
            {plantEmoji}
          </div>
          <h1 className="page-title" style={{ fontSize: '2rem' }}>
            {message.title}
          </h1>
          <p className="text-muted" style={{ fontSize: '1.125rem', marginTop: 'var(--space-sm)' }}>
            {message.subtitle}
          </p>
          <p style={{ marginTop: 'var(--space-sm)', color: 'var(--color-sage)', fontWeight: 500 }}>
            Visit #{visitCount} this season
          </p>
        </div>

        {/* Phase 2: Badge earned */}
        {newReward && phase === 'badge' && (
          <div
            style={{
              marginTop: 'var(--space-xl)',
              animation: 'slideUp 0.6s ease',
            }}
          >
            <div
              className="card"
              style={{
                background: 'linear-gradient(135deg, var(--color-sage) 0%, #3d6b4a 100%)',
                color: 'white',
                padding: 'var(--space-xl)',
              }}
            >
              <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-md)' }}>
                {REWARD_ICONS[newReward.id] || '🏆'}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                New Badge Earned
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: 'var(--space-sm)' }}>
                {newReward.title}
              </div>
              <div style={{ marginTop: 'var(--space-sm)', opacity: 0.9 }}>
                {newReward.description}
              </div>

              {newReward.physicalToken && (
                <div
                  style={{
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md)',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 'var(--radius-md)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>🎁</div>
                  <div style={{ fontWeight: 500 }}>
                    Pick up your {newReward.physicalToken}!
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.8, marginTop: '2px' }}>
                    Ask at the booth
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar (if no new reward) */}
        {!newReward && progress.nextReward && (
          <div className="card" style={{ marginTop: 'var(--space-xl)', animation: 'fadeIn 1s ease 0.5s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: '1.5rem' }}>{REWARD_ICONS[progress.nextReward.id] || '🎯'}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 500 }}>Next: {progress.nextReward.title}</div>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                  {progress.required - progress.current} more to go
                </div>
              </div>
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

        {/* Mini badge shelf */}
        <div style={{ marginTop: 'var(--space-xl)', animation: 'fadeIn 1s ease 1s both' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-md)',
              flexWrap: 'wrap',
            }}
          >
            {REWARD_TIERS.map((tier) => {
              const earned = earnedRewards.some((r) => r.id === tier.id);
              return (
                <div
                  key={tier.id}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    background: earned ? 'rgba(74, 124, 89, 0.15)' : 'var(--color-warm-white)',
                    border: earned ? '2px solid var(--color-sage)' : '2px solid var(--color-border)',
                    opacity: earned ? 1 : 0.3,
                    transition: 'all 0.3s',
                  }}
                  title={tier.title}
                >
                  {REWARD_ICONS[tier.id] || '🏆'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="stack" style={{ marginTop: 'var(--space-xl)' }}>
        <Link to="/demo" className="btn btn-primary btn-large">
          View Full Garden
        </Link>
        <Link to="/demo-qr" className="btn btn-secondary">
          Try Another
        </Link>
      </div>

      {/* Confetti animation keyframes */}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
