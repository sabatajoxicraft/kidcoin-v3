# KidCoin Badge Achievement System

## Badge Collection (10 Achievements)

### 🌟 Starter Badges

**1. First Task** 🎯
- **Trigger:** Complete your very first task
- **Message:** "You're a star! First task complete!"
- **Points Required:** Complete 1 task

**2. Early Bird** 🐦
- **Trigger:** Complete a task before 9 AM
- **Message:** "The early bird catches the coins!"
- **Points Required:** 1 early morning task

**3. Team Player** 🤝
- **Trigger:** Help another family member with a task
- **Message:** "Together we're stronger!"
- **Points Required:** 1 collaborative task

---

### 💰 Earning Badges

**4. Chore Champion** 👑
- **Trigger:** Complete 25 tasks total
- **Message:** "You're the champion of chores!"
- **Points Required:** 25 completed tasks

**5. Money Master** 🚀
- **Trigger:** Earn 1,000 total coins
- **Message:** "You're mastering the money game!"
- **Points Required:** 1,000 coins earned lifetime

---

### 📈 Consistency Badges

**6. Saver Streak** ⚡
- **Trigger:** Complete at least one task for 7 days straight
- **Message:** "You're on fire! Keep the streak alive!"
- **Points Required:** 7-day consecutive streak

**7. Fast Learner** 💡
- **Trigger:** Complete 3 financial literacy lessons
- **Message:** "Knowledge is power - and profit!"
- **Points Required:** 3 lessons finished

---

### 🎯 Goal-Oriented Badges

**8. Goal Getter** 🎪
- **Trigger:** Complete your first savings goal
- **Message:** "Dreams do come true when you save!"
- **Points Required:** 1 savings goal reached

**9. Super Saver** 💎
- **Trigger:** Save 500 coins without spending
- **Message:** "You're a savings superstar!"
- **Points Required:** 500 coin balance

**10. Mega Milestone** 🏔️
- **Trigger:** Complete 100 tasks OR reach 5,000 coins
- **Message:** "You've conquered the mountain!"
- **Points Required:** 100 tasks OR 5,000 coins

---

## Badge Rarity Levels

- **Common** (Green): First Task, Early Bird, Team Player
- **Uncommon** (Blue): Chore Champion, Fast Learner, Saver Streak
- **Rare** (Purple): Goal Getter, Money Master, Super Saver
- **Epic** (Gold): Mega Milestone

---

## Implementation Example

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  unlockCondition: BadgeCondition;
}

interface BadgeCondition {
  type: 'task_count' | 'streak' | 'earnings' | 'savings' | 'goal';
  value: number;
  additionalCriteria?: any;
}

// Check badge unlock
function checkBadgeUnlock(userId: string, badgeId: string): boolean {
  const badge = badges[badgeId];
  const userStats = getUserStats(userId);
  
  switch (badge.unlockCondition.type) {
    case 'task_count':
      return userStats.tasksCompleted >= badge.unlockCondition.value;
    case 'streak':
      return userStats.currentStreak >= badge.unlockCondition.value;
    // ... additional logic
  }
}
```

---

## Badge Display Rules

1. **Locked Badges:** Show silhouette with "???" and unlock hint
2. **Unlocked Badges:** Full color with unlock date
3. **Progress:** Show progress bar for trackable badges
4. **Notifications:** Celebrate unlock with confetti animation + sound

---

*Updated: 2026-01-27*
