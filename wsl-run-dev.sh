#!/usr/bin/env bash
set -euo pipefail
# wsl-run-dev.sh
# Usage: bash wsl-run-dev.sh [PROJECT_DIR] [PORT]
# Starts the project's dev server in background and writes logs to dev-server.log

PROJECT_DIR="${1:-/mnt/c/Users/maheshpattar/Desktop/testv2/testv2}"
PORT="${2:-3000}"

cd "$PROJECT_DIR"
export PORT

LOGFILE="$PROJECT_DIR/dev-server.log"
PIDFILE="$PROJECT_DIR/dev-server.pid"

echo "Starting dev server in $PROJECT_DIR on port $PORT"
# Run npm run dev in background with nohup so it survives terminal close
nohup npm run dev > "$LOGFILE" 2>&1 &
DEV_PID=$!

echo "$DEV_PID" > "$PIDFILE"
sleep 1

echo "Dev server started (pid=$DEV_PID). Logs: $LOGFILE"
echo "To follow logs: tail -f $LOGFILE"
