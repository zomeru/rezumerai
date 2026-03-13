#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/obra/superpowers.git"
SUPERPOWERS_REPO="${HOME}/.codex/superpowers"
SRC_DIR="${SUPERPOWERS_REPO}/skills"
TARGET_NAME="superpowers"

find_repo_root() {
  local dir="$PWD"

  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/package.json" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done

  echo "Error: Could not find repo root (no package.json found in current path or parent directories)." >&2
  exit 1
}

update_or_clone_superpowers() {
  mkdir -p "${HOME}/.codex"

  if [[ -d "$SUPERPOWERS_REPO/.git" ]]; then
    echo "Superpowers repo already exists. Pulling latest changes..."
    (
      cd "$SUPERPOWERS_REPO"
      git pull --ff-only
    )
  elif [[ -e "$SUPERPOWERS_REPO" ]]; then
    echo "Error: $SUPERPOWERS_REPO exists but is not a git repository." >&2
    echo "Please remove or rename it, then run the script again." >&2
    exit 1
  else
    echo "Cloning superpowers repo..."
    git clone "$REPO_URL" "$SUPERPOWERS_REPO"
  fi
}

update_or_clone_superpowers

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Error: Source skills directory does not exist: $SRC_DIR" >&2
  exit 1
fi

REPO_ROOT="$(find_repo_root)"
AGENTS_DIR="${REPO_ROOT}/.agents/skills"
CLAUDE_DIR="${REPO_ROOT}/.claude/skills"
DEST_DIR="${AGENTS_DIR}/${TARGET_NAME}"
SYMLINK_PATH="${CLAUDE_DIR}/${TARGET_NAME}"

echo "Repo root: $REPO_ROOT"

mkdir -p "$AGENTS_DIR"
mkdir -p "$CLAUDE_DIR"

if [[ -e "$DEST_DIR" || -L "$DEST_DIR" ]]; then
  echo "Removing existing destination: $DEST_DIR"
  rm -rf "$DEST_DIR"
fi

echo "Copying skills..."
cp -R "$SRC_DIR" "$DEST_DIR"

if [[ -e "$SYMLINK_PATH" || -L "$SYMLINK_PATH" ]]; then
  echo "Removing existing Claude path: $SYMLINK_PATH"
  rm -rf "$SYMLINK_PATH"
fi

echo "Creating symlink..."
ln -s "$DEST_DIR" "$SYMLINK_PATH"

echo
echo "Done."
echo "Copied:"
echo "  $SRC_DIR"
echo "  -> $DEST_DIR"
echo
echo "Symlinked:"
echo "  $SYMLINK_PATH -> $DEST_DIR"