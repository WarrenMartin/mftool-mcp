import sys
import os
import uvicorn
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
    from mftool_mcp.tools.nav import get_scheme_quote
    from mftool_mcp.tools.portfolio import get_portfolio_valuation, discover_investments
    from mftool_mcp.tools.schemes import search_scheme_by_name
    return get_scheme_quote, get_portfolio_valuation, discover_investments, search_scheme_by_name

@app.get("/health")
async def health():
    return {"status": "ok", "service": "mftool-mcp-proxy"}

@app.get("/api/quote/{scheme_code}")
async def fetch_quote(scheme_code: str):
    quote_fn, _, _, _ = get_tools()
    return quote_fn(scheme_code)

@app.get("/api/search")
async def search_schemes(q: str):
    _, _, _, search_fn = get_tools()
    return search_fn(q)

@app.post("/api/portfolio/valuation")
async def calculate_valuation(investments: list = Body(...)):
    _, valuation_fn, _, _ = get_tools()
    return valuation_fn(investments)

@app.post("/api/portfolio/discover")
async def discover(credentials: dict = Body(...)):
    _, _, discover_fn, _ = get_tools()
    return discover_fn(credentials)

if __name__ == "__main__":
    print("Starting mftool-mcp Proxy API on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
