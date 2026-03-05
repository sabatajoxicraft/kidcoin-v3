#!/usr/bin/env bash
set -euo pipefail

# Syncs APK from GitHub releases to app-release.apk.
# Polls release tag and downloads only when asset changes.
# Triggers apk-watcher.sh after successful download.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT/.copilot"
STATE_FILE="$STATE_DIR/.apk-sync-state"
TARGET_APK="$ROOT/app-release.apk"

RELEASE_TAG="${GITHUB_RELEASE_TAG:-latest-dev-apk}"
POLL_INTERVAL="${APK_POLL_INTERVAL:-60}"
ONCE_MODE=false

if [[ "${1:-}" == "--once" ]]; then
  ONCE_MODE=true
fi

RELEASE_ID=""
ASSET_ID=""

normalize_repo() {
  local repo="$1"
  repo="${repo%.git}"
  repo="${repo#https://github.com/}"
  repo="${repo#http://github.com/}"
  repo="${repo#git@github.com:}"
  repo="${repo%/}"
  repo="${repo%.git}"
  echo "$repo"
}

resolve_repo() {
  if [[ -n "${APK_SYNC_REPO:-}" ]]; then
    echo "$(normalize_repo "$APK_SYNC_REPO")"
    return
  fi
  if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
    echo "$(normalize_repo "$GITHUB_REPOSITORY")"
    return
  fi
  local remote repo_from_remote
  if remote=$(git remote get-url origin 2>/dev/null); then
    if [[ "$remote" =~ github\.com[:/](.+)$ ]]; then
      repo_from_remote="$(normalize_repo "${BASH_REMATCH[1]}")"
      if [[ "$repo_from_remote" =~ ^[^/]+/[^/]+$ ]]; then
        echo "$repo_from_remote"
        return
      fi
    fi
  fi
  echo "❌ Could not resolve repository. Set APK_SYNC_REPO or GITHUB_REPOSITORY." >&2
  exit 1
}

REPO=$(resolve_repo)

load_state() {
  if [[ -f "$STATE_FILE" ]]; then
    local state_content
    state_content=$(cat "$STATE_FILE")
    RELEASE_ID=$(echo "$state_content" | grep -o '"releaseId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "")
    ASSET_ID=$(echo "$state_content" | grep -o '"assetId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "")
  fi
}

save_state() {
  mkdir -p "$STATE_DIR"
  cat > "$STATE_FILE" <<EOF
{
  "releaseId": "$RELEASE_ID",
  "assetId": "$ASSET_ID"
}
EOF
}

check_with_gh() {
  if ! command -v gh &>/dev/null; then
    return 1
  fi
  local result
  if result=$(gh api "repos/$REPO/releases/tags/$RELEASE_TAG" 2>/dev/null); then
    echo "$result"
    return 0
  fi
  return 1
}

check_with_curl() {
  local url="https://api.github.com/repos/$REPO/releases/tags/$RELEASE_TAG"
  local result
  if result=$(curl -sL -H "User-Agent: apk-sync" "$url" 2>/dev/null); then
    echo "$result"
    return 0
  fi
  return 1
}

download_with_gh() {
  local asset_name="$1"
  if ! command -v gh &>/dev/null; then
    return 1
  fi
  if gh release download "$RELEASE_TAG" --repo "$REPO" --pattern "$asset_name" --output "$TARGET_APK" --clobber &>/dev/null; then
    return 0
  fi
  return 1
}

download_with_curl() {
  local url="$1"
  if curl -sL -o "$TARGET_APK" "$url" 2>/dev/null; then
    return 0
  fi
  return 1
}

check_release() {
  local release
  if release=$(check_with_gh); then
    :
  else
    echo "⚠️ gh CLI unavailable or failed, using curl fallback"
    if ! release=$(check_with_curl); then
      echo "❌ Could not fetch release data"
      return 1
    fi
  fi

  local parsed_release
  if parsed_release=$(python3 -c '
import json
import sys

try:
    release = json.load(sys.stdin)
except Exception:
    sys.exit(1)

if not isinstance(release, dict):
    sys.exit(1)

message = str(release.get("message") or "").strip().lower()
if message == "not found":
    sys.exit(3)

if "assets" not in release:
    sys.exit(1)

assets = release.get("assets")
if not isinstance(assets, list):
    sys.exit(1)

release_id = release.get("id")
if release_id in (None, ""):
    release_id = release.get("tag_name", "")
if release_id in (None, ""):
    sys.exit(1)

apk_asset = None
for asset in assets:
    name = asset.get("name") or ""
    if isinstance(name, str) and name.endswith(".apk"):
        apk_asset = asset
        break

if not apk_asset:
    sys.exit(2)

print(str(release_id))
print(str(apk_asset.get("id", "")))
print(str(apk_asset.get("name", "")))
print(str(apk_asset.get("browser_download_url", "")))
 ' <<< "$release"); then
    :
  else
    local parse_status=$?
    case "$parse_status" in
      2)
        echo "⚠️ Release '$RELEASE_TAG' has no APK asset"
        ;;
      3)
        echo "⚠️ Release tag '$RELEASE_TAG' was not found"
        ;;
      *)
        echo "❌ Could not parse release data"
        ;;
    esac
    return 1
  fi

  local parsed_lines=()
  mapfile -t parsed_lines <<< "$parsed_release"

  local asset_id asset_name download_url
  local release_id="${parsed_lines[0]:-}"
  asset_id="${parsed_lines[1]:-}"
  asset_name="${parsed_lines[2]:-}"
  download_url="${parsed_lines[3]:-}"

  if [[ "$RELEASE_ID" == "$release_id" && "$ASSET_ID" == "$asset_id" ]]; then
    echo "✓ APK is up to date"
    return 1
  fi

  echo "📥 Downloading new APK: $asset_name"

  local success=false
  if download_with_gh "$asset_name"; then
    success=true
  else
    echo "⚠️ gh download failed, using curl fallback"
    if download_with_curl "$download_url"; then
      success=true
    fi
  fi

  if [[ "$success" == false ]]; then
    echo "❌ Download failed with both gh and curl"
    return 1
  fi

  echo "✅ Downloaded to $TARGET_APK"

  RELEASE_ID="$release_id"
  ASSET_ID="$asset_id"
  save_state

  # Trigger watcher
  local watcher_path="$ROOT/scripts/apk-watcher.sh"
  if [[ -x "$watcher_path" ]]; then
    "$watcher_path" --once || echo "⚠️ Watcher script failed"
  fi

  return 0
}

main() {
  local mode_text="watch"
  [[ "$ONCE_MODE" == true ]] && mode_text="once"
  
  echo "🔄 APK Sync started ($mode_text mode)"
  echo "   Repo: $REPO"
  echo "   Tag: $RELEASE_TAG"

  load_state
  check_release || true

  if [[ "$ONCE_MODE" == false ]]; then
    while true; do
      sleep "$POLL_INTERVAL"
      check_release || true
    done
  else
    echo "🏁 One-time sync complete"
  fi
}

main
