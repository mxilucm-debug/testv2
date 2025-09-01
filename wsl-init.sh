#!/usr/bin/env bash
set -euo pipefail
# wsl-init.sh
# Usage: bash wsl-init.sh [PROJECT_DIR]
# Installs nvm/node (if missing) and runs npm install in the project.

PROJECT_DIR="${1:-/mnt/c/Users/maheshpattar/Desktop/testv2/testv2}"

echo "WSL init: project dir = $PROJECT_DIR"

# Install nvm if missing
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing nvm..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
  # shellcheck source=/dev/null
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
else
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi

# Install LTS Node if missing
if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node LTS via nvm..."
  nvm install --lts
  nvm use --lts
fi

echo "Node version: $(node -v)"

echo "Installing project dependencies (npm install) in $PROJECT_DIR"
cd "$PROJECT_DIR"
# Make sure package.json exists
if [ ! -f package.json ]; then
  echo "ERROR: package.json not found in $PROJECT_DIR"
  exit 1
fi

npm ci || npm install

echo "Dependencies installed. You can start the dev server with: bash wsl-run-dev.sh $PROJECT_DIR"
