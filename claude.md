# CLAUDE.md — Kinderhook Market Passport (PWA)
Author: David Nyman  
Created: 2026-01-22  
Updated: 2026-01-22  
Repo: passport

## 0) What this repo is
Build a **PWA** for farmers' market **loyalty + community engagement** with:
- **Exit booth workflow**: staff-assisted check-in with optional purchase categories
- **Digital garden**: visual reward system that grows with each visit
- **Physical tokens**: stickers, pins, totes designed by local artists
- **Simple admin tooling**: manage seasons, generate codes, view stats

**Non-goals (do NOT build yet):** vendor scheduling, payments, inventory, CRM, email marketing, push notifications, social feed, vendor-specific rewards.

North Star: **"A friendly booth, a growing garden, and real rewards you can hold."**

---

## 1) Product principles (guardrails)
1. **Human-first**: the booth volunteer is the experience; the app supports them
2. **Privacy-respectful**: purchase categories are broad + optional; no itemized tracking
3. **No shame mechanics**: gardens are private; no public leaderboards
4. **Physical > digital**: digital garden celebrates visits; real tokens are the reward
5. **Offline-resilient**: booth app works with spotty service; queue check-ins locally
6. **Local identity**: art, copy, and rewards reflect Kinderhook specifically

---

## 2) User flows

### Visitor flow (exit booth)
```
[Shop at market]
       ↓
[Approach exit booth]
       ↓
┌─────────────────────────────────┐
│ First time?                     │
│ → Volunteer helps sign up       │
│ → Google sign-in on their phone │
│ → Show QR code on passport page │
│                                 │
│ Returning?                      │
│ → Show QR from passport page    │
│ → Or volunteer looks up by name │
└─────────────────────────────────┘
       ↓
[Volunteer scans/selects visitor]
       ↓
[Volunteer taps purchase categories]
       ↓
[Check-in recorded]
       ↓
┌─────────────────────────────────┐
│ "Your garden grew!"             │
│ 🌱 → 🍅 (new tomato planted)    │
│                                 │
│ Milestone reached?              │
│ → "You earned the Regular pin!" │
│ → Volunteer hands physical token│
└─────────────────────────────────┘
```

### Visitor app screens
1. **Landing** — Sign in with Google
2. **Passport/Garden** — Your digital garden + visit history + QR code for booth
3. **Reward detail** — Tap a plant/reward to see when earned

### Booth operator app screens
1. **Lookup** — Search by name or scan visitor's QR
2. **Check-in** — Show visitor info, category picker, check-in button
3. **Reward alert** — Highlight when visitor earns a milestone
4. **Quick stats** — Today's check-ins, new visitors

### Admin screens
1. **Season management** — Create/edit seasons
2. **Event days** — Generate daily booth codes
3. **Analytics** — Visits, categories, reward distribution
4. **Artist uploads** — Manage garden assets (stretch)

---

## 3) Data model

### Core entities
```
Market { id, name, timezone, location }
Season { id, marketId, name, startDate, endDate }
EventDay { id, marketId, seasonId, date, boothCode }
User { id, displayName, email, createdAt, gardenState }
CheckIn { 
  id, marketId, eventDayId, userId, 
  timestamp, 
  categories[], // e.g., ["produce", "baked"]
  operatorId,   // who processed check-in
  source        // "booth" | "self" (future)
}
UserReward { id, userId, rewardId, achievedAt, redeemedAt? }
```

### Purchase categories (MVP)
Keep broad—these inform market trends, not individual tracking:
- Produce
- Baked goods
- Meat & dairy
- Prepared food
- Crafts & goods
- Flowers & plants
- Other / just browsing

### Garden state
Each visit adds a plant. Categories can influence plant type:
```typescript
type GardenPlant = {
  id: string;
  type: 'tomato' | 'sunflower' | 'corn' | 'pumpkin' | 'carrot' | ...;
  plantedAt: Date;
  eventDayId: string;
  position: { x: number; y: number }; // grid position
};

type GardenState = {
  plants: GardenPlant[];
  unlockedBackgrounds: string[]; // seasonal themes
};
```

---

## 4) Reward tiers

| Visits | Reward | Physical token | Garden unlock |
|--------|--------|----------------|---------------|
| 1 | "First Harvest" | Welcome sticker | First plant |
| 3 | "Getting Started" | — | New plant variety |
| 5 | "Regular" | Enamel pin | Garden expansion |
| 8 | "Community Builder" | Limited tote bag | Seasonal background |
| 12 | "Season Finisher" | Market mug | Golden plant variant |
| 12+ | "Perennial" | $5 gift certificate | Special animated plant |

Physical tokens redeemed at booth; `redeemedAt` timestamp prevents double-claiming.

---

## 5) Technical approach

### Frontend (two entry points, shared codebase)
- **Visitor app**: `/` → passport, garden view, QR display
- **Booth app**: `/booth` → lookup, check-in, category picker

Both are the same PWA; booth mode activated by URL + staff auth.

Stack:
- Vite + React + TypeScript
- QR scanning: `@zxing/browser`
- QR generation: `qrcode` package
- PWA: `vite-plugin-pwa`
- Offline queue: IndexedDB via `idb`

### Backend
- Firebase Auth (Google provider)
- Firestore (data)
- Cloud Functions (check-in logic, QR validation)

### Garden rendering
MVP: CSS grid of emoji or simple SVG icons
Future: Canvas-based with artist illustrations + animations

---

## 6) Anti-abuse

### Booth authentication
- Booth operators must be in `staff` or `admins` collection
- Booth mode requires auth; visitors see only their own data

### Check-in constraints
- One check-in per user per event day (enforced server-side)
- Booth code rotates daily (signed JWT, same as before)
- Categories optional; "just browsing" always valid

### Visitor QR
- Visitor's passport displays a simple user ID QR (not JWT)
- Booth scans this to look up user; no secrets exposed
- Alternative: name search for visitors without phones

---

## 7) Repo structure
```
/apps
  /web              # Unified PWA (visitor + booth views)
  /functions        # Firebase Cloud Functions
/packages
  /shared           # Types, schemas, reward config, garden logic
/docs
  /setup.md         # Dev setup
  /booth-guide.md   # Volunteer training doc
  /artist-specs.md  # Asset requirements for garden art
```

---

## 8) MVP scope (what to build first)

### Phase 1: Core loop
1. Visitor sign-in + passport page with QR
2. Booth lookup (scan or search)
3. Check-in with categories
4. Visit count + milestone alerts
5. Basic admin: create event days, view stats

### Phase 2: Garden
6. Garden grid view (emoji/SVG MVP)
7. Plant assignment based on categories
8. Garden persists across sessions

### Phase 3: Polish
9. Artist illustrations replace emoji
10. Animated milestone celebrations
11. Print layouts for booth signage
12. Offline resilience for booth app

---

## 9) Definition of Done (MVP)

- [ ] Visitor can sign in and see their passport with QR
- [ ] Booth operator can scan/search and check in a visitor
- [ ] Categories captured (optional)
- [ ] Visit count increments; milestones display
- [ ] Reward redemption tracked (redeemedAt)
- [ ] Works on iPhone + Android
- [ ] Booth app works offline (queues check-ins)
- [ ] Admin can create event days

---

## 10) Tone & copy guidelines

Warm, local, human. The booth volunteer does the talking; the app confirms.

| Instead of | Say |
|------------|-----|
| "Transaction complete" | "You're all set!" |
| "Points earned" | "Your garden grew" |
| "Redeem reward" | "Ready to pick up your pin?" |
| "User profile" | "Your passport" |
| "Purchase data" | "What'd you find today?" |

---

## 11) Open questions (decide later)
- Guest mode for visitors without Google accounts?
- Vendor-specific stamps (e.g., "visited the cheese stand")?
- Multi-market federation (regional passport)?
- Export garden as shareable image?
- Seasonal garden resets vs. cumulative forever-garden?

---

## 12) Claude collaboration rules

When proposing changes:
- State which user flow it supports
- Flag scope creep explicitly
- Smallest viable implementation first
- Justify new dependencies in one sentence

When editing code:
- Tight diffs
- Comment the "why" when non-obvious
- Clear names over cleverness

---
End.