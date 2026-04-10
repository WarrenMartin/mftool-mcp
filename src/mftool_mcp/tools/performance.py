"""
Daily scheme performance MCP tools wrapping mftool APIs.
Returns 1Y/3Y/5Y returns for open-ended schemes.
"""

from mftool import Mftool
from mftool_mcp.mcp_instance import mcp
from mftool_mcp.cache import _cache

_mf = Mftool()


@mcp.tool()
def get_equity_scheme_performance() -> dict:
    """
    Get daily performance data for all open-ended EQUITY mutual fund schemes.
    Includes Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS, Sectoral, etc.
    Shows latest NAV (Regular & Direct plans) and 1Y/3Y/5Y returns.

    Returns:
        Dictionary categorized by equity fund type with performance metrics.
    """
    try:
        result = _cache.cached(
            "perf:equity",
            lambda: _mf.get_open_ended_equity_scheme_performance(as_json=False),
            ttl=3600,  # 1 hour
        )
        if not result:
            return {"error": "Could not fetch equity scheme performance data."}
        return result
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def get_debt_scheme_performance() -> dict:
    """
    Get daily performance data for all open-ended DEBT mutual fund schemes.
    Includes Liquid, Overnight, Short Duration, Corporate Bond, Gilt funds, etc.
    Shows latest NAV (Regular & Direct plans) and 1Y/3Y/5Y returns.

    Returns:
        Dictionary categorized by debt fund type with performance metrics.
    """
    try:
        result = _cache.cached(
            "perf:debt",
            lambda: _mf.get_open_ended_debt_scheme_performance(as_json=False),
            ttl=3600,
        )
        if not result:
            return {"error": "Could not fetch debt scheme performance data."}
        return result
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def get_hybrid_scheme_performance() -> dict:
    """
    Get daily performance data for all open-ended HYBRID mutual fund schemes.
    Includes Balanced Advantage, Aggressive Hybrid, Conservative Hybrid, Arbitrage, etc.
    Shows latest NAV (Regular & Direct plans) and 1Y/3Y/5Y returns.

    Returns:
        Dictionary categorized by hybrid fund type with performance metrics.
    """
    try:
        result = _cache.cached(
            "perf:hybrid",
            lambda: _mf.get_open_ended_hybrid_scheme_performance(as_json=False),
            ttl=3600,
        )
        if not result:
            return {"error": "Could not fetch hybrid scheme performance data."}
        return result
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def get_elss_scheme_performance() -> dict:
    """
    Get daily performance data for ELSS (Equity Linked Savings Scheme) mutual funds.
    ELSS funds offer tax benefits under Section 80C with a 3-year lock-in period.
    Shows latest NAV (Regular & Direct plans) and 1Y/3Y/5Y returns.

    Returns:
        Dictionary with ELSS fund performance metrics.
    """
    try:
        result = _cache.cached(
            "perf:equity",
            lambda: _mf.get_open_ended_equity_scheme_performance(as_json=False),
            ttl=3600,
        )
        if not result:
            return {"error": "Could not fetch ELSS scheme performance data."}

        elss_data = {
            category: funds
            for category, funds in result.items()
            if "elss" in category.lower() or "tax" in category.lower()
        }

        if not elss_data:
            return {
                "info": "ELSS data not found as separate category. Returning all equity data.",
                "data": result,
            }

        return elss_data
    except Exception as e:
        return {"error": str(e)}
