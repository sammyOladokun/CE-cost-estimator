from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional


def calculate_actual_area(base_area_sqft: float, pitch: float) -> float:
    """
    Compute roof area using provided pitch adjustment.

    ActualArea = Ground Area * sqrt((Pitch/12)^2 + 1)
    """
    slope_factor = math.sqrt(1 + (pitch / 12) ** 2)
    return round(base_area_sqft * slope_factor, 2)


@dataclass
class ScraperResult:
    zip_code: str
    median_price_per_sqft: float
    source: str


def fetch_median_shingle_price(zip_code: str) -> Optional[ScraperResult]:
    """
    Placeholder scraper hook. In production, wire this up to Playwright + BeautifulSoup
    to gather vendor prices for asphalt shingles near the zip code.

    Returns the median price_per_sqft or None if no data is available.
    """
    sanitized_zip = zip_code.strip()
    if len(sanitized_zip) < 5:
        return None

    # TODO: Replace with real scraping flow. A conservative default keeps flows moving.
    estimated_price = 1.85
    return ScraperResult(
        zip_code=sanitized_zip,
        median_price_per_sqft=estimated_price,
        source="stubbed-scraper",
    )
