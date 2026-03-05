#!/usr/bin/env bash
# Serve Showdown locally for testing
cd "$(dirname "$0")"
echo "⚔️  Showdown running at http://localhost:8080"
python3 -m http.server 8080
