import { useState } from 'react';
import { Link } from 'react-router-dom';
import { REWARD_TIERS } from '@market-passport/shared';
import QRCode from '../components/QRCode';

// Different demo scenarios you can scan
const DEMO_SCENARIOS = [
  {
    id: 'first-visit',
    visitCount: 1,
    title: 'First Visit',
    description: 'Welcome sticker moment',
    emoji: '🌱',
  },
  {
    id: 'third-visit',
    visitCount: 3,
    title: '3rd Visit',
    description: '"Getting Started" badge',
    emoji: '🧺',
  },
  {
    id: 'fifth-visit',
    visitCount: 5,
    title: '5th Visit',
    description: 'Enamel pin earned!',
    emoji: '📍',
  },
  {
    id: 'eighth-visit',
    visitCount: 8,
    title: '8th Visit',
    description: 'Limited tote bag!',
    emoji: '👜',
  },
  {
    id: 'twelfth-visit',
    visitCount: 12,
    title: '12th Visit',
    description: 'Season Finisher mug!',
    emoji: '☕',
  },
  {
    id: 'random',
    visitCount: 0, // Will be random
    title: 'Random Visit',
    description: 'Surprise plant!',
    emoji: '🎲',
  },
];

export default function DemoQR() {
  const [selected, setSelected] = useState(DEMO_SCENARIOS[0]);

  // Build the URL that the phone will open when scanning
  const getQRUrl = (scenario: typeof DEMO_SCENARIOS[0]) => {
    const base = window.location.origin + (import.meta.env.BASE_URL || '/');
    const visitCount = scenario.visitCount === 0
      ? Math.floor(Math.random() * 12) + 1
      : scenario.visitCount;
    return `${base}celebrate/${visitCount}`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Demo QR Codes</h1>
        <p className="page-subtitle">Scan these with your phone to see celebrations</p>
      </div>

      {/* Scenario selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        {DEMO_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => setSelected(scenario)}
            style={{
              padding: 'var(--space-md)',
              border: '2px solid',
              borderColor: selected.id === scenario.id ? 'var(--color-sage)' : 'var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: selected.id === scenario.id ? 'rgba(74, 124, 89, 0.1)' : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>{scenario.emoji}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '4px' }}>
              {scenario.title}
            </div>
          </button>
        ))}
      </div>

      {/* QR Code display */}
      <div className="card mb-lg" style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: 'var(--space-md)' }}>
          {selected.emoji} {selected.title}
        </h3>
        <QRCode value={getQRUrl(selected)} size={250} />
        <p className="text-muted" style={{ marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
          {selected.description}
        </p>
        <p className="text-muted" style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem' }}>
          Scan with your phone camera
        </p>
      </div>

      {/* Try on this device */}
      <div className="card mb-lg" style={{ background: 'var(--color-warm-white)' }}>
        <h3 style={{ marginBottom: 'var(--space-sm)', fontWeight: 500, fontSize: '0.875rem' }}>
          Or try on this device:
        </h3>
        <div className="stack">
          {DEMO_SCENARIOS.filter(s => s.visitCount > 0).map((scenario) => (
            <Link
              key={scenario.id}
              to={`/celebrate/${scenario.visitCount}`}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', gap: 'var(--space-md)' }}
            >
              <span style={{ fontSize: '1.25rem' }}>{scenario.emoji}</span>
              <span>{scenario.title} — {scenario.description}</span>
            </Link>
          ))}
        </div>
      </div>

      <Link to="/demo" className="btn btn-secondary">
        Back to Demo Garden
      </Link>
    </div>
  );
}
