#!/bin/bash
# ─────────────────────────────────────────────
#  mftool-mcp — one-command dev start
#  Usage: ./start.sh
# ─────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT_DIR/.venv"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── Colours ───────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

# ── Guard: virtual env ────────────────────────
if [[ ! -f "$VENV/bin/python" ]]; then
  echo -e "${RED}✗ .venv not found.${NC} Run the one-time setup first:\n"
  echo -e "  ${CYAN}python3 -m venv .venv${NC}"
  echo -e "  ${CYAN}source .venv/bin/activate${NC}"
  echo -e "  ${CYAN}pip install -e .${NC}\n"
  exit 1
fi

# ── Install / sync Python deps ─────────────────
echo -e "${YELLOW}⚙  Syncing Python dependencies...${NC}"
"$VENV/bin/pip" install -q -r "$ROOT_DIR/requirements.txt"
"$VENV/bin/pip" install -q --force-reinstall certifi   # fix stale CA bundle paths

# ── Fix TLS CA bundle path for requests/mftool ─
CERTIFI_PATH="$("$VENV/bin/python" -c "import certifi; print(certifi.where())")"
export REQUESTS_CA_BUNDLE="$CERTIFI_PATH"
export SSL_CERT_FILE="$CERTIFI_PATH"

# ── Guard: node_modules ───────────────────────
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo -e "${YELLOW}⚙  Installing frontend dependencies...${NC}"
  (cd "$FRONTEND_DIR" && npm install)
fi

# ── Cleanup on Ctrl+C ─────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo -e "\n${YELLOW}⏹  Shutting down...${NC}"
  [[ -n "$BACKEND_PID" ]]  && kill "$BACKEND_PID"  2>/dev/null
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}✓ All services stopped.${NC}"
  exit 0
}
trap cleanup INT TERM

# ── Start backend ─────────────────────────────
echo -e "${CYAN}▶ Starting backend  →  http://localhost:8000${NC}"
"$VENV/bin/python" "$ROOT_DIR/api_proxy.py" &
BACKEND_PID=$!

# ── Start frontend ────────────────────────────
echo -e "${CYAN}▶ Starting frontend →  http://localhost:5173${NC}"
(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

echo -e "${GREEN}✓ Both services running. Press Ctrl+C to stop.${NC}\n"

# ── Keep script alive until Ctrl+C ───────────
wait $BACKEND_PID $FRONTEND_PID
