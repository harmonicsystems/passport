/**
 * Core data model types for Market Passport
 */

// ============================================
// Core Entities
// ============================================

export interface Market {
  id: string;
  name: string;
  timezone: string;
  location?: string;
}

export interface Season {
  id: string;
  marketId: string;
  name: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;
}

export interface EventDay {
  id: string;
  marketId: string;
  seasonId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  boothCode?: string; // JWT for booth validation
}

export interface User {
  id: string;
  displayName?: string;
  email?: string;
  createdAt: number; // Unix timestamp
  gardenState?: GardenState;
}

export interface CheckIn {
  id: string;
  marketId: string;
  eventDayId: string;
  userId: string;
  timestamp: number; // Unix timestamp
  categories: PurchaseCategory[]; // what they bought (optional, can be empty)
  operatorId: string; // staff member who processed check-in
  source: 'booth' | 'self'; // booth for MVP, self for future
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  seasonId: string;
  achievedAt: number; // Unix timestamp
  redeemedAt?: number; // when physical token was picked up
}

// ============================================
// Staff & Admin
// ============================================

export interface Admin {
  email: string; // normalized: lowercase, trimmed
  addedAt: number;
}

export interface Staff {
  email: string;
  displayName?: string;
  addedAt: number;
  marketId: string; // which market they can operate
}

export type UserRole = 'visitor' | 'staff' | 'admin';

// ============================================
// Purchase Categories
// ============================================

export const PURCHASE_CATEGORIES = [
  'produce',
  'baked',
  'meat_dairy',
  'prepared',
  'crafts',
  'flowers',
  'browsing',
] as const;

export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<PurchaseCategory, string> = {
  produce: 'Produce',
  baked: 'Baked goods',
  meat_dairy: 'Meat & dairy',
  prepared: 'Prepared food',
  crafts: 'Crafts & goods',
  flowers: 'Flowers & plants',
  browsing: 'Just browsing',
};

// ============================================
// Garden State
// ============================================

export const PLANT_TYPES = [
  'seedling',
  'tomato',
  'sunflower',
  'corn',
  'pumpkin',
  'carrot',
  'pepper',
  'lettuce',
  'strawberry',
  'flower',
] as const;

export type PlantType = (typeof PLANT_TYPES)[number];

export interface GardenPlant {
  id: string;
  type: PlantType;
  plantedAt: number; // Unix timestamp
  eventDayId: string;
  position: { x: number; y: number }; // grid position
  variant?: 'golden' | 'animated'; // special variants for milestones
}

export interface GardenState {
  plants: GardenPlant[];
  unlockedBackgrounds: string[]; // seasonal themes
  gridSize: { width: number; height: number };
}

// Default empty garden
export const DEFAULT_GARDEN_STATE: GardenState = {
  plants: [],
  unlockedBackgrounds: ['default'],
  gridSize: { width: 4, height: 4 },
};

// Map categories to plant types (with some randomness)
export const CATEGORY_PLANT_MAP: Record<PurchaseCategory, PlantType[]> = {
  produce: ['tomato', 'carrot', 'lettuce', 'pepper'],
  baked: ['corn', 'sunflower'],
  meat_dairy: ['sunflower', 'corn'],
  prepared: ['tomato', 'pepper'],
  crafts: ['flower', 'sunflower'],
  flowers: ['flower', 'sunflower', 'strawberry'],
  browsing: ['seedling', 'flower'],
};
