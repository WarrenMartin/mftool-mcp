"""
Scheme discovery and search MCP tools wrapping mftool APIs.
"""

from mftool import Mftool
from mftool_mcp.mcp_instance import mcp
from mftool_mcp.cache import _cache

_mf = Mftool()


@mcp.tool()
def get_scheme_codes(limit: int = 100, offset: int = 0) -> dict:
    """
    Get mutual fund scheme codes and names from AMFI with pagination.
    Use search_scheme_by_name for targeted searches instead of fetching all.

    Args:
        limit:  Number of results to return (default 100, max 500).
        offset: Number of results to skip for pagination (default 0).

    Returns:
        Dictionary with 'results' (scheme_code -> name), 'total', 'limit', 'offset'.
    """
    try:
        limit = min(max(1, limit), 500)
        offset = max(0, offset)

        all_schemes = _cache.cached(
            "all_scheme_codes",
            lambda: _mf.get_scheme_codes(as_json=False),
            ttl=7200,  # 2 hours
        )
        if not all_schemes:
            return {"error": "Could not fetch scheme codes."}

        items = list(all_schemes.items())
        page = items[offset: offset + limit]

        return {
            "results": dict(page),
            "total": len(items),
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < len(items),
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def get_available_schemes(amc_name: str) -> dict:
    """
    Get all mutual fund schemes available under a specific AMC (Asset Management Company).

    Args:
        amc_name: Partial or full name of the AMC (case-insensitive).
                  Examples: 'hdfc', 'sbi', 'axis', 'icici', 'mirae', 'parag', 'dsp'.

    Returns:
        Dictionary mapping scheme codes (str) to scheme names (str) for the given AMC.
    """
    try:
        result = _cache.cached(
            f"amc:{amc_name.lower()}",
            lambda: _mf.get_available_schemes(amc_name),
            ttl=7200,  # 2 hours
        )
        if not result:
            return {"error": f"No schemes found for AMC: '{amc_name}'. Try a shorter keyword like 'hdfc', 'sbi', 'axis'."}
        return result
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def is_valid_scheme_code(scheme_code: str) -> dict:
    """
    Check whether a given scheme code is a valid AMFI scheme code.

    Args:
        scheme_code: Numeric scheme code to validate (e.g., '119597').

    Returns:
        Dictionary with 'valid' (bool) and 'scheme_code' fields.
    """
    try:
        result = _mf.is_valid_code(scheme_code)
        return {"scheme_code": scheme_code, "valid": bool(result)}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def search_scheme_by_name(query: str, amc_name: str = "") -> dict:
    """
    Search for mutual fund schemes by name keyword. Optionally filter by AMC.
    Use this when you know a fund name but not its scheme code.

    Args:
        query: Keyword to search in scheme names (e.g., 'midcap', 'bluechip', 'flexi').
        amc_name: Optional AMC filter (e.g., 'hdfc', 'sbi'). Leave empty to search all.

    Returns:
        Dictionary mapping scheme codes to matching scheme names.
    """
    try:
        if amc_name:
            all_schemes = _cache.cached(
                f"amc:{amc_name.lower()}",
                lambda: _mf.get_available_schemes(amc_name),
                ttl=7200,
            )
        else:
            all_schemes = _cache.cached(
                "all_scheme_codes",
                lambda: _mf.get_scheme_codes(as_json=False),
                ttl=7200,
            )

        if not all_schemes:
            return {"error": "Could not fetch schemes for search."}

        query_lower = query.lower()
        matches = {
            code: name
            for code, name in all_schemes.items()
            if query_lower in name.lower()
        }

        if not matches:
            return {
                "error": f"No schemes found matching '{query}'"
                + (f" under AMC '{amc_name}'" if amc_name else ""),
                "suggestion": "Try broader keywords like 'midcap', 'large', 'debt', 'liquid'.",
            }

        return {"query": query, "amc_filter": amc_name or "all", "results": matches}
    except Exception as e:
        return {"error": str(e)}
