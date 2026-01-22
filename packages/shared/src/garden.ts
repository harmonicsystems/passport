/**
 * Garden logic - plant selection and placement
 */

import type { GardenPlant, GardenState, PlantType, PurchaseCategory } from './types';
import { CATEGORY_PLANT_MAP, DEFAULT_GARDEN_STATE } from './types';

/**
 * Pick a plant type based on purchase categories
 * If multiple categories, picks from the first one
 * If no categories (browsing), gives a seedling or flower
 */
export function selectPlantType(categories: PurchaseCategory[]): PlantType {
  const category = categories.length > 0 ? categories[0] : 'browsing';
  const options = CATEGORY_PLANT_MAP[category];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Find the next available position in the garden grid
 */
export function findNextPosition(garden: GardenState): { x: number; y: number } {
  const occupied = new Set(garden.plants.map((p) => `${p.position.x},${p.position.y}`));

  for (let y = 0; y < garden.gridSize.height; y++) {
    for (let x = 0; x < garden.gridSize.width; x++) {
      if (!occupied.has(`${x},${y}`)) {
        return { x, y };
      }
    }
  }

  // Grid full - expand it
  return { x: 0, y: garden.gridSize.height };
}

/**
 * Add a plant to the garden
 */
export function addPlant(
  garden: GardenState,
  eventDayId: string,
  categories: PurchaseCategory[],
  variant?: 'golden' | 'animated'
): GardenState {
  const plantType = selectPlantType(categories);
  const position = findNextPosition(garden);

  const newPlant: GardenPlant = {
    id: `plant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: plantType,
    plantedAt: Date.now(),
    eventDayId,
    position,
    variant,
  };

  // Expand grid if needed
  const newGridSize = {
    width: Math.max(garden.gridSize.width, position.x + 1),
    height: Math.max(garden.gridSize.height, position.y + 1),
  };

  return {
    ...garden,
    plants: [...garden.plants, newPlant],
    gridSize: newGridSize,
  };
}

/**
 * Initialize a new garden or return existing
 */
export function ensureGarden(garden?: GardenState): GardenState {
  return garden || { ...DEFAULT_GARDEN_STATE };
}

/**
 * Get plant emoji for display (MVP - will be replaced with art)
 */
export const PLANT_EMOJI: Record<PlantType, string> = {
  seedling: '🌱',
  tomato: '🍅',
  sunflower: '🌻',
  corn: '🌽',
  pumpkin: '🎃',
  carrot: '🥕',
  pepper: '🌶️',
  lettuce: '🥬',
  strawberry: '🍓',
  flower: '🌸',
};

/**
 * Get display emoji for a plant (with variant handling)
 */
export function getPlantDisplay(plant: GardenPlant): string {
  const base = PLANT_EMOJI[plant.type];
  if (plant.variant === 'golden') {
    return `✨${base}✨`;
  }
  return base;
}
