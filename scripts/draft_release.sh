#!/usr/bin/env bash
#
# draft_release.sh — plug a Markdown release note straight into a GitHub release.
#
# Creates a DRAFT GitHub release on Angora-Beta whose body is the Markdown file in
# release-notes/, with the locally-built DMG attached. You then review the draft and
# hit Publish — which triggers update-appcast.yml.
#
# Releases are published as FULL releases marked "Latest" (NOT pre-releases): the
# whole repo is already the Beta channel, so a per-release pre-release flag is noise.
#
# Usage:
#   scripts/draft_release.sh <tag> [options]
#
#   <tag>              Release tag, e.g. v1.1.2-beta.1
#
# Options:
#   --notes <path>     Markdown notes file. Default: release-notes/<version>.md
#                      (<version> is derived from the tag: v1.1.2-beta.1 -> 1.1.2)
#   --dmg <path>       DMG to attach. Default: <main-repo>/Angora-Beta-<build>.dmg
#   --title <text>     Release title. Default: "Angora <version>" (e.g. Angora 1.1.2)
#   --main-repo <dir>  Path to the Angora source repo (for xcconfig + DMG).
#                      Default: ../Angora relative to this repo.
#   --repo <owner/name> GitHub repo. Default: j-nivekk/Angora-Beta
#   --update           Edit an EXISTING release's notes/title instead of creating
#                      one (does not re-upload the DMG).
#   --publish          Publish immediately instead of leaving a draft. Use with
#                      care: publishing triggers the appcast workflow.
#   -h, --help         Show this help.
#
# Examples:
#   scripts/draft_release.sh v1.1.2-beta.1
#   scripts/draft_release.sh v1.1.2-beta.1 --dmg ~/Documents/Angora/Angora-Beta-1112.dmg
#   scripts/draft_release.sh v1.1.2-beta.1 --update          # refresh notes only
#
set -euo pipefail

# --- locate repos ---------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BETA_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

REPO="j-nivekk/Angora-Beta"
MAIN_REPO="$(cd "$BETA_REPO/../Angora" 2>/dev/null && pwd || true)"

TAG=""
NOTES=""
DMG=""
TITLE=""
ACTION="create"
PUBLISH=false

die() { printf 'error: %s\n' "$1" >&2; exit 1; }

# --- parse args -----------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --notes)     NOTES="${2:?--notes needs a path}"; shift 2;;
    --dmg)       DMG="${2:?--dmg needs a path}"; shift 2;;
    --title)     TITLE="${2:?--title needs text}"; shift 2;;
    --main-repo) MAIN_REPO="${2:?--main-repo needs a path}"; shift 2;;
    --repo)      REPO="${2:?--repo needs owner/name}"; shift 2;;
    --update)    ACTION="update"; shift;;
    --publish)   PUBLISH=true; shift;;
    -h|--help)   awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "${BASH_SOURCE[0]}"; exit 0;;
    -*)          die "unknown option: $1";;
    *)           if [ -z "$TAG" ]; then TAG="$1"; shift; else die "unexpected argument: $1"; fi;;
  esac
done

[ -n "$TAG" ] || die "a release tag is required (e.g. v1.1.2-beta.1). See --help."
command -v gh >/dev/null 2>&1 || die "the GitHub CLI (gh) is not installed."
gh auth status >/dev/null 2>&1 || die "gh is not authenticated. Run: gh auth login"

# --- derive version + codename -------------------------------------------
# v1.1.2-beta.1 -> 1.1.2 (strip leading v, take the part before the first '-')
VERSION="${TAG#v}"; VERSION="${VERSION%%-*}"

CODENAME=""
BUILD=""
XCCONFIG="${MAIN_REPO:-}/Configs/App-Beta.xcconfig"
if [ -n "${MAIN_REPO:-}" ] && [ -f "$XCCONFIG" ]; then
  MARKETING_LINE="$(grep -E '^[[:space:]]*MARKETING_VERSION' "$XCCONFIG" | head -1 || true)"
  BUILD="$(grep -E '^[[:space:]]*CURRENT_PROJECT_VERSION' "$XCCONFIG" | head -1 | sed -E 's/.*=[[:space:]]*//; s/[[:space:]]*$//' || true)"
  # extract codename inside parentheses, e.g. "1.1.2-beta (Smoke Pearl)" -> "Smoke Pearl"
  if printf '%s' "$MARKETING_LINE" | grep -q '('; then
    CODENAME="$(printf '%s' "$MARKETING_LINE" | sed -E 's/.*\(([^)]*)\).*/\1/')"
  fi
fi

# --- resolve defaults -----------------------------------------------------
[ -n "$NOTES" ] || NOTES="$BETA_REPO/release-notes/${VERSION}.md"
[ -f "$NOTES" ] || die "notes file not found: $NOTES"

# Release title convention: "Angora <clean-version>", e.g. "Angora 1.1.2".
# (The note body's own opener carries the full "Angora <version>-beta.<n>" heading.)
[ -n "$TITLE" ] || TITLE="Angora $VERSION"

# --- act ------------------------------------------------------------------
if [ "$ACTION" = "update" ]; then
  gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1 || die "no release with tag '$TAG' to update."
  # Ensure it's a full release (not pre-release). "Latest" can't be set on a draft;
  # it applies automatically when the release is published.
  gh release edit "$TAG" --repo "$REPO" --title "$TITLE" --notes-file "$NOTES" \
    --prerelease=false
  echo "✓ Updated notes/title for $TAG"
  gh release view "$TAG" --repo "$REPO" --json url --jq .url
  exit 0
fi

# create path needs a DMG
if [ -z "$DMG" ]; then
  [ -n "${MAIN_REPO:-}" ] && [ -n "$BUILD" ] || die "could not auto-resolve the DMG; pass --dmg <path>."
  DMG="$MAIN_REPO/Angora-Beta-${BUILD}.dmg"
fi
[ -f "$DMG" ] || die "DMG not found: $DMG (build it with create_beta_dmg.sh, or pass --dmg)."

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  die "a release tagged '$TAG' already exists. Use --update to refresh notes, or pick a new tag."
fi

# Drafts are created as full (non-pre-release) releases. GitHub forbids setting
# "Latest" on a draft, so --latest is only passed when publishing directly; a draft
# auto-becomes Latest on publish (it is the newest non-pre-release).
DRAFT_FLAG="--draft"
LATEST_FLAG=""
if $PUBLISH; then DRAFT_FLAG=""; LATEST_FLAG="--latest"; fi

if $PUBLISH; then echo "Creating published release (latest):"; else echo "Creating draft release (full; Latest on publish):"; fi
echo "  repo:   $REPO"
echo "  tag:    $TAG"
echo "  title:  $TITLE"
echo "  notes:  $NOTES"
echo "  dmg:    $DMG"

# shellcheck disable=SC2086
gh release create "$TAG" "$DMG" \
  --repo "$REPO" \
  --target main \
  $LATEST_FLAG \
  $DRAFT_FLAG \
  --title "$TITLE" \
  --notes-file "$NOTES"

URL="$(gh release view "$TAG" --repo "$REPO" --json url --jq .url)"
echo
if $PUBLISH; then
  echo "✓ Published $TAG — the appcast workflow will now run."
else
  echo "✓ Draft created: $URL"
  echo "  Review the notes + DMG, then click Publish (that triggers update-appcast.yml)."
fi
