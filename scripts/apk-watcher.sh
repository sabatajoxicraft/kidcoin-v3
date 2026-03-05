#!/usr/bin/env bash
set -euo pipefail

# Watches app-release.apk and copies it to Termux downloads directory.
# Supports both watch mode and one-time copy via --once flag.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_APK="$ROOT/app-release.apk"

# Resolve target directory with fallback chain
TARGET_DIR="${TERMUX_DOWNLOAD_DIR:-}"
if [[ -z "$TARGET_DIR" ]]; then
  if [[ -n "${HOME:-}" && -d "$HOME/storage/downloads" ]]; then
    TARGET_DIR="$HOME/storage/downloads"
  elif [[ -n "${HOME:-}" && -d "$HOME/Downloads" ]]; then
    TARGET_DIR="$HOME/Downloads"
  elif [[ -n "${HOME:-}" ]]; then
    TARGET_DIR="$HOME/storage/downloads"
  fi
fi

OUTPUT_FILENAME="${APK_OUTPUT_FILENAME:-kidcoin-latest.apk}"
TARGET_APK="$TARGET_DIR/$OUTPUT_FILENAME"
WATCH_INTERVAL="${APK_WATCH_INTERVAL:-5}"
ONCE_MODE=false

if [[ -z "$TARGET_DIR" ]]; then
  echo "❌ Could not resolve target directory"
  exit 1
fi

if [[ "${1:-}" == "--once" ]]; then
  ONCE_MODE=true
fi

LAST_MTIME=""

copy_apk() {
  if [[ ! -f "$SOURCE_APK" ]]; then
    echo "⏳ Waiting for app-release.apk..."
    return
  fi

  local current_mtime
  current_mtime=$(stat -c %Y "$SOURCE_APK" 2>/dev/null || stat -f %m "$SOURCE_APK" 2>/dev/null)

  if [[ "$LAST_MTIME" == "$current_mtime" && "$ONCE_MODE" == false ]]; then
    return
  fi

  mkdir -p "$TARGET_DIR"
  cp "$SOURCE_APK" "$TARGET_APK"
  LAST_MTIME="$current_mtime"
  echo "✅ Copied $OUTPUT_FILENAME to $TARGET_DIR"
}

main() {
  local mode_text="watch"
  [[ "$ONCE_MODE" == true ]] && mode_text="once"
  
  echo "📦 APK Watcher started ($mode_text mode)"
  echo "   Source: $SOURCE_APK"
  echo "   Target: $TARGET_APK"

  copy_apk

  if [[ "$ONCE_MODE" == false ]]; then
    while true; do
      sleep "$WATCH_INTERVAL"
      copy_apk
    done
  else
    echo "🏁 One-time copy complete"
  fi
}

main
