from mftool import Mftool
from mftool_mcp.mcp_instance import mcp
import logging

# Configure logging
logger = logging.getLogger(__name__)

@mcp.tool()
def get_portfolio_valuation(investments: list[dict]) -> dict:
    """
    Calculate the current valuation of a mutual fund portfolio.
    
    Args:
        investments: List of dictionaries, each containing 'scheme_code' (str) and 'units' (float).
                     Example: [{"scheme_code": "125497", "units": 105.5}]
    
    Returns:
        A dictionary containing total valuation and individual fund details.
    """
    m = Mftool()
    total_value = 0.0
    details = []
    
    for inv in investments:
        code = str(inv.get('scheme_code'))
        units = float(inv.get('units', 0))
        
        try:
            quote = m.get_scheme_quote(code, as_json=False)
            nav_raw = quote.get('nav') or quote.get('last_nav') if quote else None
            if quote and nav_raw:
                nav = float(nav_raw)
                value = nav * units
                total_value += value
                details.append({
                    "scheme_code": code,
                    "scheme_name": quote.get('scheme_name'),
                    "nav": nav,
                    "units": units,
                    "current_value": round(value, 2),
                    "date": quote.get('date') or quote.get('last_updated')
                })
            else:
                logger.warning(f"Could not fetch NAV for scheme code: {code}")
        except Exception as e:
            logger.error(f"Error fetching data for scheme {code}: {str(e)}")
            continue

    return {
        "total_valuation": round(total_value, 2),
        "portfolio_details": details,
        "currency": "INR"
    }

@mcp.tool()
def discover_investments(credentials: dict) -> dict:
    """
    Placeholder tool to simulate investment discovery using user credentials.
    In a real-world scenario, this would interface with a CAS parsing service 
    or an account aggregator API.
    
    Args:
        credentials: Dictionary containing discovery details like 'pan', 'mobile', or 'email'.
    """
    # This is a mock implementation for demonstration
    # In reality, this would trigger an OTP flow or parse a document.
    pan = credentials.get('pan', 'Unknown')
    
    return {
        "status": "Success",
        "message": f"Investments discovered for PAN: {pan}",
        "suggested_portfolio": [
            {"scheme_code": "125497", "units": 50.0}, # SBI Magnum Midcap
            {"scheme_code": "101181", "units": 100.0} # HDFC Top 100
        ]
    }
