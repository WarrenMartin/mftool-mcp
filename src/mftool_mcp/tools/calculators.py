"""
Financial calculator MCP tools: SIP, lumpsum, XIRR, and fund comparison.
No network calls required for calculators.
"""

from datetime import datetime
from mftool import Mftool
from mftool_mcp.mcp_instance import mcp
from mftool_mcp.cache import _cache

_mf = Mftool()


@mcp.tool()
def calculate_sip(
    monthly_investment: float,
    annual_return_rate: float,
    years: int,
) -> dict:
    """
    Calculate SIP (Systematic Investment Plan) maturity value and returns.

    Args:
        monthly_investment: Amount invested every month in INR (e.g., 5000).
        annual_return_rate: Expected annual return rate in % (e.g., 12 for 12%).
        years: Investment duration in years (e.g., 10).

    Returns:
        Dictionary with total_invested, estimated_returns, total_value,
        wealth_gained_pct, and input parameters.
    """
    if monthly_investment <= 0:
        return {"error": "monthly_investment must be greater than 0."}
    if annual_return_rate < 0:
        return {"error": "annual_return_rate cannot be negative."}
    if years <= 0:
        return {"error": "years must be greater than 0."}

    r = annual_return_rate / 12 / 100
    n = years * 12

    if r == 0:
        fv = monthly_investment * n
    else:
        fv = monthly_investment * ((1 + r) ** n - 1) / r * (1 + r)

    total_invested = monthly_investment * n
    returns = fv - total_invested

    return {
        "monthly_investment": monthly_investment,
        "annual_return_rate_pct": annual_return_rate,
        "years": years,
        "total_invested": round(total_invested, 2),
        "estimated_returns": round(returns, 2),
        "total_value": round(fv, 2),
        "wealth_gained_pct": round((returns / total_invested) * 100, 2),
    }


@mcp.tool()
def calculate_lumpsum(
    investment: float,
    annual_return_rate: float,
    years: int,
) -> dict:
    """
    Calculate lumpsum investment maturity value and returns.

    Args:
        investment: One-time investment amount in INR (e.g., 100000).
        annual_return_rate: Expected annual return rate in % (e.g., 12 for 12%).
        years: Investment duration in years (e.g., 10).

    Returns:
        Dictionary with estimated_returns, total_value, wealth_gained_pct,
        and input parameters.
    """
    if investment <= 0:
        return {"error": "investment must be greater than 0."}
    if annual_return_rate < 0:
        return {"error": "annual_return_rate cannot be negative."}
    if years <= 0:
        return {"error": "years must be greater than 0."}

    fv = investment * (1 + annual_return_rate / 100) ** years
    returns = fv - investment

    return {
        "investment": investment,
        "annual_return_rate_pct": annual_return_rate,
        "years": years,
        "estimated_returns": round(returns, 2),
        "total_value": round(fv, 2),
        "wealth_gained_pct": round((returns / investment) * 100, 2),
    }


def _xirr(cash_flows: list[float], dates: list[datetime], guess: float = 0.1) -> float:
    """Newton-Raphson XIRR calculation."""
    t0 = dates[0]

    def npv(rate: float) -> float:
        return sum(
            cf / (1 + rate) ** ((dt - t0).days / 365.0)
            for cf, dt in zip(cash_flows, dates)
        )

    def dnpv(rate: float) -> float:
        return sum(
            -((dt - t0).days / 365.0) * cf / (1 + rate) ** ((dt - t0).days / 365.0 + 1)
            for cf, dt in zip(cash_flows, dates)
        )

    rate = guess
    for _ in range(200):
        f = npv(rate)
        df = dnpv(rate)
        if abs(df) < 1e-12:
            break
        new_rate = rate - f / df
        if abs(new_rate - rate) < 1e-8:
            rate = new_rate
            break
        rate = max(new_rate, -0.999)
    return rate


@mcp.tool()
def calculate_xirr(
    amounts: list[float],
    dates: list[str],
) -> dict:
    """
    Calculate XIRR (Extended Internal Rate of Return) for irregular cash flows.
    Use this to find annualized returns on real SIP investments with actual NAV data.

    Args:
        amounts: List of cash flows in INR. Investments are NEGATIVE, redemption is POSITIVE.
                 Example: [-5000, -5000, -5000, 17000] for 3 monthly SIPs and final redemption.
        dates:   List of dates in 'DD-MM-YYYY' format, one per cash flow.
                 Example: ['01-01-2023', '01-02-2023', '01-03-2023', '01-04-2023'].

    Returns:
        Dictionary with xirr_pct (annualized return in %), and input summary.
    """
    if len(amounts) != len(dates):
        return {"error": "amounts and dates must have the same length."}
    if len(amounts) < 2:
        return {"error": "At least 2 cash flows are required."}
    if not any(a < 0 for a in amounts):
        return {"error": "At least one cash flow must be negative (an investment)."}
    if not any(a > 0 for a in amounts):
        return {"error": "At least one cash flow must be positive (a redemption/current value)."}

    try:
        parsed_dates = [datetime.strptime(d, "%d-%m-%Y") for d in dates]
    except ValueError as e:
        return {"error": f"Invalid date format: {e}. Use DD-MM-YYYY."}

    try:
        rate = _xirr(amounts, parsed_dates)
    except Exception as e:
        return {"error": f"XIRR calculation failed: {e}"}

    return {
        "xirr_pct": round(rate * 100, 4),
        "num_cash_flows": len(amounts),
        "from_date": dates[0],
        "to_date": dates[-1],
        "total_invested": round(sum(-a for a in amounts if a < 0), 2),
        "total_redeemed": round(sum(a for a in amounts if a > 0), 2),
    }


@mcp.tool()
def compare_schemes(scheme_codes: list[str]) -> dict:
    """
    Compare multiple mutual fund schemes side-by-side.
    Fetches current NAV, fund house, category, and type for each scheme.

    Args:
        scheme_codes: List of AMFI scheme codes to compare (max 10).
                      Example: ['119597', '120503', '125497'].

    Returns:
        Dictionary mapping each scheme_code to its NAV and metadata.
    """
    if not scheme_codes:
        return {"error": "Provide at least one scheme code."}
    if len(scheme_codes) > 10:
        return {"error": "Maximum 10 schemes can be compared at once."}

    results = {}
    for code in scheme_codes:
        try:
            quote = _cache.cached(
                f"quote:{code}",
                lambda c=code: _mf.get_scheme_quote(c, as_json=False),
                ttl=900,
            )
            details = _cache.cached(
                f"details:{code}",
                lambda c=code: _mf.get_scheme_details(c, as_json=False),
                ttl=21600,
            )
            if not quote and not details:
                results[code] = {"error": "No data found. Check the scheme code."}
                continue
            results[code] = {
                "name": (quote or {}).get("scheme_name", "N/A"),
                "nav": (quote or {}).get("nav", "N/A"),
                "last_updated": (quote or {}).get("last_updated", "N/A"),
                "fund_house": (details or {}).get("fund_house", "N/A"),
                "category": (details or {}).get("scheme_category", "N/A"),
                "type": (details or {}).get("scheme_type", "N/A"),
            }
        except Exception as e:
            results[code] = {"error": str(e)}

    return results
