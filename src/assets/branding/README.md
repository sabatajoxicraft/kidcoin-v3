# KidCoin Brand Assets

This directory contains all brand identity assets for KidCoin.

## Directory Structure

```
brand/
├── mascot/          # Coinbert 3D character mascot
├── badges/          # Achievement badges and rewards
├── onboarding/      # Onboarding flow illustrations (16:9)
├── empty-states/    # Zero-state illustrations
├── celebrations/    # Success and milestone screens
├── ASSET_INDEX.md   # Complete asset documentation
└── README.md        # This file
```

## Quick Reference

- All images are 2K resolution (2048px)
- Brand colors: Teal #10B981, Gold #F59E0B, Purple #8B5CF6
- See ASSET_INDEX.md for detailed usage guidelines

## Integration Example

```typescript
import BadgeFirstTask from '@/assets/brand/badges/badge_first_task.png';

<Image 
  source={BadgeFirstTask} 
  style={{width: 150, height: 150}}
  accessibilityLabel="First Task Achievement Badge"
/>
```

For complete documentation, see **ASSET_INDEX.md**
