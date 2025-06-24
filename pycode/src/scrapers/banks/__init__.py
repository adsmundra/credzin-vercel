"""
Bank-specific scrapers package.
"""

from .AxisBankScraper import AxisBankScraper
from .ICICIBankScraper import ICICIBankScraper
from .SBIBankScraper import SBIBankScraper

__all__ = ['AxisBankScraper', 'ICICIBankScraper', 'SBIBankScraper'] 