---
name: apk-trigger-sync
description: Use apk:watch + apk:sync together so each new release APK is auto-copied into Termux downloads, even when asset names change.
---

# APK Trigger Sync

Use this when GitHub release APK filenames change but you still want the latest build copied into Termux downloads automatically.

## Runbook

1. Start watcher in terminal A:
   ```bash
   yarn apk:watch
   ```
2. Start release sync in terminal B:
   ```bash
   yarn apk:sync
   ```
  (Use `yarn apk:sync:once` for one-shot checks.)
3. `apk:sync` fetches the newest release APK, stores it as `app-release.apk`, and triggers the watcher.
4. `apk:watch` copies and renames the APK into `/sdcard/Download` (Termux), preserving previous files.
