import { type GardenState, PLANT_EMOJI, getPlantDisplay } from '@market-passport/shared';

interface GardenViewProps {
  garden: GardenState;
}

export default function GardenView({ garden }: GardenViewProps) {
  const { plants, gridSize } = garden;

  // Create a lookup map for plants by position
  const plantMap = new Map(plants.map((p) => [`${p.position.x},${p.position.y}`, p]));

  // Generate grid cells
  const cells = [];
  for (let y = 0; y < Math.max(gridSize.height, 4); y++) {
    for (let x = 0; x < Math.max(gridSize.width, 4); x++) {
      const plant = plantMap.get(`${x},${y}`);
      cells.push({ x, y, plant });
    }
  }

  if (plants.length === 0) {
    return (
      <div
        style={{
          minHeight: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-warm-white)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div className="text-center text-muted">
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🌱</div>
          <div>Your garden is waiting!</div>
          <div style={{ fontSize: '0.875rem' }}>Visit the booth to plant your first seed</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(gridSize.width, 4)}, 1fr)`,
        gap: '4px',
        background: 'var(--color-warm-white)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-sm)',
      }}
    >
      {cells.map(({ x, y, plant }) => (
        <div
          key={`${x}-${y}`}
          style={{
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            background: plant ? 'rgba(74, 124, 89, 0.1)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            transition: 'transform 0.2s',
          }}
          title={plant ? `Planted on ${new Date(plant.plantedAt).toLocaleDateString()}` : undefined}
        >
          {plant ? getPlantDisplay(plant) : ''}
        </div>
      ))}
    </div>
  );
}
