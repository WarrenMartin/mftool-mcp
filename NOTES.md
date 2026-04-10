# mftool-mcp — Project Notes

## What this is

An MCP server that exposes **Indian Mutual Fund data** (via AMFI / `mftool` library) to any LLM client (Claude, Cursor, etc.). It lets you ask natural-language questions about NAVs, scheme details, historical data, and fund performance.

## What still needs to be done

- [ ] Add caching — mftool calls hit the network every time; cache NAV/performance responses with a short TTL
- [ ] Error handling — some tools return raw exceptions; wrap them with user-friendly messages
- [ ] Pagination — `get_scheme_codes` returns thousands of entries; add limit/offset params
- [ ] Add SIP / XIRR calculation tool (commonly requested)
- [ ] Write tests for each tool module
- [ ] Publish updated version to PyPI after above fixes

## How to run and test interactively

### 0. First-time setup (one time only)

macOS won't let you install packages system-wide, so use a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 1. Start the server locally

Every new terminal session, activate the venv first:

```bash
source .venv/bin/activate
python run.py
```

### 2. Test with MCP Inspector (real-time tool calls in browser)

```bash
source .venv/bin/activate
npx @modelcontextprotocol/inspector python run.py
```

Opens a UI at `http://localhost:5173` — pick any tool, pass params, see live responses.

### 3. Wire it into Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mftool-mcp": {
      "command": "/Users/work/Desktop/mftool-mcp/.venv/bin/python",
      "args": ["/Users/work/Desktop/mftool-mcp/run.py"]
    }
  }
}
```

Using the full venv path means Claude Desktop doesn't need the venv activated — it uses the right Python automatically. Restart Claude Desktop after saving.

### 4. Quick smoke test from terminal

```bash
source .venv/bin/activate
python -c "
from mftool import Mftool
m = Mftool()
print(m.get_scheme_quote('125497'))
"
```
