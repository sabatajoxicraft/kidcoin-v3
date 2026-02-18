# KidCoin Sound Effects Generation Guide

**Status:** Ready to generate (requires ElevenLabs MCP server restart)  
**API Key:** Configured in `~/.copilot/mcp-config.json`  
**Credits:** Available in ElevenLabs account

---

## Required Sound Effects (5 Total)

### 1. Coin Clink 🪙
**Purpose:** Task approval confirmation  
**Duration:** 0.5-1 second  
**Description:** Metallic coin dropping into piggy bank, satisfying clink sound  
**Trigger:** When parent approves a child's completed task  
**File:** `coin_clink.mp3`

**Generation Prompt:**
```
"A short metallic coin dropping sound, like a coin falling into a ceramic piggy bank, 
crisp and satisfying, approximately 0.7 seconds long"
```

---

### 2. Level Up Fanfare 🎺
**Purpose:** Streak milestone achievement  
**Duration:** 2-3 seconds  
**Description:** Triumphant trumpet fanfare, Zelda-style victory sound  
**Trigger:** 7-day streak achieved, major milestone reached  
**File:** `level_up.mp3`

**Generation Prompt:**
```
"An epic victory fanfare with trumpets, similar to The Legend of Zelda level up sound, 
celebratory and triumphant, approximately 2 seconds long"
```

---

### 3. Button Click 🎯
**Purpose:** UI interaction feedback  
**Duration:** 0.1-0.2 seconds  
**Description:** Satisfying pop/click sound for buttons  
**Trigger:** Any button press in the app  
**File:** `button_click.mp3`

**Generation Prompt:**
```
"A short, satisfying button click sound, like a gentle pop or snap, 
crisp and responsive, approximately 0.15 seconds long"
```

---

### 4. Success Chime ✨
**Purpose:** Task completion notification  
**Duration:** 1-1.5 seconds  
**Description:** Pleasant chime, positive reinforcement  
**Trigger:** Task submitted, goal reached  
**File:** `success_chime.mp3`

**Generation Prompt:**
```
"A pleasant and uplifting chime sound, like wind chimes or bells, 
positive and encouraging, approximately 1 second long"
```

---

### 5. Error Buzz ⚠️
**Purpose:** Warning/error feedback  
**Duration:** 0.5 seconds  
**Description:** Gentle warning buzz, not harsh  
**Trigger:** Invalid action, insufficient funds  
**File:** `error_buzz.mp3`

**Generation Prompt:**
```
"A gentle error buzz sound, like a soft buzzer or notification beep, 
not harsh or alarming, friendly warning tone, approximately 0.5 seconds long"
```

---

## Generation Commands (After Restart)

Once you restart Copilot CLI with ElevenLabs loaded, use these commands:

```bash
# Generate all 5 sounds
elevenlabs-generate-sound "coin_clink" "A short metallic coin dropping into ceramic piggy bank, 0.7 seconds"
elevenlabs-generate-sound "level_up" "Epic victory fanfare with trumpets, Zelda-style, 2 seconds"
elevenlabs-generate-sound "button_click" "Satisfying button click pop sound, 0.15 seconds"
elevenlabs-generate-sound "success_chime" "Pleasant uplifting chime, positive reinforcement, 1 second"
elevenlabs-generate-sound "error_buzz" "Gentle error buzz, friendly warning tone, 0.5 seconds"
```

---

## File Organization

Once generated, organize sounds:

```bash
mkdir -p /home/sabata/development/kidcoin/assets/sounds/
mv *.mp3 /home/sabata/development/kidcoin/assets/sounds/
```

Expected structure:
```
assets/
└── sounds/
    ├── coin_clink.mp3
    ├── level_up.mp3
    ├── button_click.mp3
    ├── success_chime.mp3
    └── error_buzz.mp3
```

---

## Implementation Example

```typescript
import { Audio } from 'expo-av';

class SoundManager {
  private sounds: { [key: string]: Audio.Sound } = {};

  async loadSounds() {
    this.sounds.coinClink = (await Audio.Sound.createAsync(
      require('@/assets/sounds/coin_clink.mp3')
    )).sound;
    
    this.sounds.levelUp = (await Audio.Sound.createAsync(
      require('@/assets/sounds/level_up.mp3')
    )).sound;
    
    this.sounds.buttonClick = (await Audio.Sound.createAsync(
      require('@/assets/sounds/button_click.mp3')
    )).sound;
    
    this.sounds.successChime = (await Audio.Sound.createAsync(
      require('@/assets/sounds/success_chime.mp3')
    )).sound;
    
    this.sounds.errorBuzz = (await Audio.Sound.createAsync(
      require('@/assets/sounds/error_buzz.mp3')
    )).sound;
  }

  async play(soundName: string) {
    const sound = this.sounds[soundName];
    if (sound) {
      await sound.replayAsync();
    }
  }
}

// Usage
const soundManager = new SoundManager();
await soundManager.loadSounds();

// Play sound on task approval
await soundManager.play('coinClink');
```

---

## Testing Checklist

After generation:
- [ ] All 5 sound files created
- [ ] Files are in MP3 format
- [ ] Duration matches specifications
- [ ] Volume levels are balanced
- [ ] Sounds are not distorted
- [ ] Test on actual device speakers
- [ ] Copy to phone for preview

---

## Alternative: Free Sound Libraries

If ElevenLabs generation doesn't work, use these free alternatives:

**Freesound.org** - Search for:
- "coin drop"
- "success fanfare"
- "button click"
- "chime positive"
- "error beep"

**Zapsplat.com** - UI Sound Effects section

**Format:** Download as MP3, normalize to -14 LUFS for consistency

---

## Next Steps

1. **Restart Copilot CLI** - Type `exit` then restart
2. **Generate sounds** - Use commands above
3. **Test sounds** - Preview on device
4. **Integrate** - Add to app with Audio API
5. **Volume control** - Add user preference for sound effects

---

*Created: 2026-01-27T11:48:00Z*
