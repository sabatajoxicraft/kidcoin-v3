# KidCoin Brand Assets Index

**Last Updated:** 2026-01-27  
**Status:** 100% Complete (Visual Assets)  
**Resolution:** 2K (2048px) for most, 4K for hero banner  
**Total Assets:** 24 files (1 mascot, 10 badges, 3 onboarding, 1 empty state, 2 celebrations, 7 marketing)

---

## 📁 Asset Organization

### 1. Mascot Character
**Location:** `assets/brand/mascot/`

- `kidcoin_mascot_coinbert.png` - 3D Pixar-style golden coin character with face, arms, and legs. Primary mascot for the app.

**Usage:** Empty states, loading screens, tutorial guides, error messages.

---

### 2. Achievement Badges (10 Total)
**Location:** `assets/brand/badges/`

**Core Badges:**
- `badge_first_task.png` - Golden star with teal border, "First Task" ribbon
- `badge_saver_streak.png` - Piggy bank with purple border and lightning bolts, "7 Day Streak"
- `badge_money_master.png` - Rocket ship with coin trail, teal/gold, "Money Master" trophy

**Extended Badges:**
- `badge_super_saver.png` - Treasure chest overflowing with coins, sparkle effects
- `badge_chore_champion.png` - Cleaning tools forming crown, purple accent
- `badge_goal_getter.png` - Target with bullseye arrow, victory ribbon
- `badge_fast_learner.png` - Book with lightbulb, education theme
- `badge_team_player.png` - Three hands joining, unity symbol
- `badge_early_bird.png` - Bird with sunrise, encouraging design
- `badge_mega_milestone.png` - Mountain peak with flag, epic achievement

**Usage:** Achievement unlocks, profile display, gamification rewards.

**Implementation Pattern:**
```typescript
import FirstTaskBadge from '@/assets/brand/badges/badge_first_task.png';

<Image source={FirstTaskBadge} style={{width: 120, height: 120}} />
```

---

### 3. Onboarding Illustrations
**Location:** `assets/brand/onboarding/`

- `onboarding_01_transform.png` - Piggy bank transforming to digital app (16:9)
- `onboarding_02_earn.png` - Kids doing chores earning coins (16:9)
- `onboarding_03_save.png` - Kid visualizing goals with progress bar (16:9)

**Usage:** App onboarding flow, tutorial screens.

**Sequence:**
1. Welcome → Transform (Digital Revolution)
2. Earn → Chores = Coins (Value Creation)
3. Save → Goals = Dreams (Financial Literacy)

---

### 4. Empty States
**Location:** `assets/brand/empty-states/`

- `empty_state_no_tasks.png` - Coinbert mascot with magnifying glass, curious pose

**Usage:** Zero state screens when no data exists (no tasks, no history, etc.).

**Future Assets Needed:**
- Empty state for "No Savings Goals"
- Empty state for "No Transaction History"
- Empty state for "No Family Members"

---

### 5. Celebration Screens
**Location:** `assets/brand/celebrations/`

- `celebration_task_complete.png` - Confetti + coin rain + trophy (Task approval)
- `celebration_goal_reached.png` - Fireworks + jumping child (Savings goal met)

**Usage:** Success modals, milestone achievements, positive reinforcement moments.

**Animation Suggestion:** Pair with haptic feedback and coin sound effect.

---

### 6. Marketing Materials
**Location:** `assets/brand/marketing/`

**App Store Assets (9:16):**
- `marketing_app_store_screenshot_01.png` - Dashboard with coin balance and tasks
- `marketing_app_store_screenshot_02.png` - Task detail screen with photo upload
- `marketing_app_store_screenshot_03.png` - Achievement badges grid display

**Social Media (1:1):**
- `marketing_social_instagram_post.png` - Family using app with Coinbert mascot
- `marketing_app_icon_showcase.png` - App icon with glow and floating badges

**Instagram Story (9:16):**
- `marketing_story_template.png` - Vertical template for achievement shares

**Website Hero (16:9, 4K):**
- `marketing_hero_banner.png` - "Financial Education Made Fun" banner with split screen

**Usage:**
- App store listings (iOS/Android)
- Social media campaigns (Instagram, Facebook, Twitter)
- Website homepage and landing pages
- Paid advertising materials

---

## 🎨 Brand Colors (Reference)

```typescript
BrandColors = {
  primary: '#10B981',    // Teal (Growth & Trust)
  secondary: '#F59E0B',  // Gold (Rewards & Value)
  accent: '#8B5CF6',     // Purple (Creativity & Fun)
  success: '#22C55E',
  warning: '#F97316',
  error: '#EF4444',
}
```

---

## 🔊 Sound Assets (TODO)

**Status:** Not yet generated (requires audio tool)

**Required Sounds:**
1. `coin_clink.mp3` - Metal coin drop into piggy bank (task approval)
2. `level_up.wav` - Zelda-style trumpet fanfare (streak milestone)
3. `button_click.mp3` - Satisfying UI interaction pop
4. `task_complete.mp3` - Success chime
5. `error_shake.mp3` - Gentle warning buzz

**Recommended Library:** [Zapsplat](https://www.zapsplat.com/) or [Freesound](https://freesound.org/)

**Implementation:**
```typescript
import { Audio } from 'expo-av';
const coinSound = require('@/assets/sounds/coin_clink.mp3');
await Audio.Sound.createAsync(coinSound).then(({sound}) => sound.playAsync());
```

---

## 📐 Usage Guidelines

### Sizing Standards
- **Badges:** 120x120px to 200x200px display size
- **Mascot:** 150x150px to 300x300px display size
- **Onboarding:** Full screen width, 16:9 aspect ratio
- **Celebrations:** 250x250px to 400x400px display size

### Performance Optimization
All assets are 2K resolution. For production:
- Consider generating @1x, @2x, @3x variants
- Use WebP format for web version
- Implement lazy loading for onboarding images

### Accessibility
- All illustrations should have alt text descriptions
- Ensure sufficient color contrast (WCAG AA minimum)
- Badges should have text labels, not icon-only

---

## 🚀 Completion Status

1. ✅ Generate core brand assets (COMPLETE)
2. ✅ Create additional badges - 10 total (COMPLETE)
3. ✅ Generate marketing assets (COMPLETE)
4. ✅ Create social media brand kit (COMPLETE)
5. ⏳ Source/generate sound effects library (Pending - requires audio MCP server)

---

*Generated by KidCoin Brand Team - 2026-01-27*
