import sys
import os
import uvicorn

# ─── Fix: CA bundle path for stale/relocated .venv installations ─────────────
# When certifi was compiled against a different machine path (/Users/work/...),
# certifi.where() returns an invalid path. We derive the correct one from the
# actual running Python executable, then patch requests internals before mftool
# (or any requests Session) is instantiated.
def _patch_ca_bundle():
    python_exe = os.path.abspath(sys.executable)
    venv_dir   = os.path.dirname(os.path.dirname(python_exe))
    py_ver     = f"python{sys.version_info.major}.{sys.version_info.minor}"
    ca_path    = os.path.join(venv_dir, "lib", py_ver,
                              "site-packages", "certifi", "cacert.pem")
    if not os.path.isfile(ca_path):
        return  # file not found — fall back to certifi default
    os.environ["REQUESTS_CA_BUNDLE"] = ca_path
    os.environ["SSL_CERT_FILE"]      = ca_path
    # Preload requests and overwrite the module-level constant used in Session.send()
    try:
        import requests.utils, requests.adapters
        requests.utils.DEFAULT_CA_BUNDLE_PATH    = ca_path
        requests.adapters.DEFAULT_CA_BUNDLE_PATH = ca_path
        print(f"[CA fix] patched CA bundle → {ca_path}", flush=True)
    except ImportError:
        pass

_patch_ca_bundle()
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware

# Ensure the src directory is in the path so we can import our modules
sys.path.append(os.path.join(os.getcwd(), "src"))

app = FastAPI(title="mftool-mcp Proxy API")

# Enable CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy imports to ensure environment is set up
def get_tools():
    from mftool_mcp.tools.nav import get_scheme_quote, get_scheme_historical_nav
    from mftool_mcp.tools.portfolio import get_portfolio_valuation, discover_investments
    from mftool_mcp.tools.schemes import search_scheme_by_name
    return get_scheme_quote, get_portfolio_valuation, discover_investments, search_scheme_by_name, get_scheme_historical_nav

def get_perf_tools():
    from mftool_mcp.tools.performance import get_equity_scheme_performance, get_debt_scheme_performance, get_hybrid_scheme_performance
    return get_equity_scheme_performance, get_debt_scheme_performance, get_hybrid_scheme_performance

@app.get("/health")
async def health():
    return {"status": "ok", "service": "mftool-mcp-proxy"}

@app.get("/api/quote/{scheme_code}")
async def fetch_quote(scheme_code: str):
    quote_fn, _, _, _, _ = get_tools()
    return quote_fn(scheme_code)

@app.get("/api/historical/{scheme_code}")
async def fetch_historical(scheme_code: str):
    _, _, _, _, historical_fn = get_tools()
    return historical_fn(scheme_code)

@app.get("/api/search")
async def search_schemes(q: str):
    _, _, _, search_fn, _ = get_tools()
    return search_fn(q)

@app.post("/api/portfolio/valuation")
async def calculate_valuation(investments: list = Body(...)):
    _, valuation_fn, _, _, _ = get_tools()
    return valuation_fn(investments)

@app.post("/api/portfolio/discover")
async def discover(credentials: dict = Body(...)):
    _, _, discover_fn, _, _ = get_tools()
    return discover_fn(credentials)

@app.get("/api/performance/equity")
async def perf_equity():
    equity_fn, _, _ = get_perf_tools()
    return equity_fn()

@app.get("/api/performance/debt")
async def perf_debt():
    _, debt_fn, _ = get_perf_tools()
    return debt_fn()

@app.get("/api/performance/hybrid")
async def perf_hybrid():
    _, _, hybrid_fn = get_perf_tools()
    return hybrid_fn()

if __name__ == "__main__":
    print("Starting mftool-mcp Proxy API on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
