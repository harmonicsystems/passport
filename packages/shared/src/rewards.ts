/**
 * Reward tiers - canonical source of truth
 *
 * Both frontend and backend import from here.
 * Thresholds are per-season visit counts.
 */

export interface RewardTier {
  id: string;
  threshold: number; // visits required
  title: string;
  description: string;
  physicalToken?: string; // what they get in real life
  gardenUnlock?: string; // what unlocks in the garden
}

export const REWARD_TIERS: readonly RewardTier[] = [
  {
    id: 'first-harvest',
    threshold: 1,
    title: 'First Harvest',
    description: 'Welcome to the market family!',
    physicalToken: 'Welcome sticker',
    gardenUnlock: 'First plant',
  },
  {
    id: 'getting-started',
    threshold: 3,
    title: 'Getting Started',
    description: 'You know where to find the good stuff.',
    gardenUnlock: 'New plant variety',
  },
  {
    id: 'regular',
    threshold: 5,
    title: 'Regular',
    description: 'A familiar face at the market.',
    physicalToken: 'Enamel pin',
    gardenUnlock: 'Garden expansion',
  },
  {
    id: 'community-builder',
    threshold: 8,
    title: 'Community Builder',
    description: 'You help make this market special.',
    physicalToken: 'Limited tote bag',
    gardenUnlock: 'Seasonal background',
  },
  {
    id: 'season-finisher',
    threshold: 12,
    title: 'Season Finisher',
    description: 'You made it the whole season!',
    physicalToken: 'Market mug',
    gardenUnlock: 'Golden plant variant',
  },
  {
    id: 'perennial',
    threshold: 13, // 12+ means any visit after 12
    title: 'Perennial',
    description: 'A true friend of the market.',
    physicalToken: '$5 gift certificate',
    gardenUnlock: 'Special animated plant',
  },
] as const;

/**
 * Get the next reward tier for a given visit count
 * Returns null if all rewards achieved
 */
export function getNextReward(visitCount: number): RewardTier | null {
  for (const tier of REWARD_TIERS) {
    if (visitCount < tier.threshold) {
      return tier;
    }
  }
  return null;
}

/**
 * Get all rewards earned for a given visit count
 */
export function getEarnedRewards(visitCount: number): RewardTier[] {
  return REWARD_TIERS.filter((tier) => visitCount >= tier.threshold);
}

/**
 * Get the reward just earned (if any) for this visit
 * Returns null if no new reward at this visit count
 */
export function getNewlyEarnedReward(visitCount: number): RewardTier | null {
  return REWARD_TIERS.find((tier) => tier.threshold === visitCount) || null;
}

/**
 * Check if a visit count earns a physical token
 */
export function hasPhysicalReward(visitCount: number): RewardTier | null {
  const reward = getNewlyEarnedReward(visitCount);
  return reward?.physicalToken ? reward : null;
}

/**
 * Get progress toward next reward
 * Returns { current, required, percentage }
 */
export function getRewardProgress(visitCount: number): {
  current: number;
  required: number;
  percentage: number;
  nextReward: RewardTier | null;
} {
  const nextReward = getNextReward(visitCount);

  if (!nextReward) {
    return {
      current: visitCount,
      required: visitCount,
      percentage: 100,
      nextReward: null,
    };
  }

  // Find previous threshold (or 0 if first tier)
  const tierIndex = REWARD_TIERS.indexOf(nextReward);
  const previousThreshold = tierIndex > 0 ? REWARD_TIERS[tierIndex - 1].threshold : 0;

  const progressInTier = visitCount - previousThreshold;
  const tierSize = nextReward.threshold - previousThreshold;

  return {
    current: visitCount,
    required: nextReward.threshold,
    percentage: Math.round((progressInTier / tierSize) * 100),
    nextReward,
  };
}
