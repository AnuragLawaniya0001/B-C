from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PromotionalPopupCreateRequest(BaseModel):
    name: str = Field(..., max_length=100)
    headline: str = Field(..., max_length=150)
    subheadline: Optional[str] = Field(None, max_length=250)
    discount_code: Optional[str] = Field(None, max_length=30)
    discount_badge: Optional[str] = Field(None, max_length=50)  # e.g. "FLAT 15% OFF"
    cta_text: str = Field("Claim Offer Now", max_length=50)
    cta_link: str = Field("/store", max_length=200)
    media_url: Optional[str] = None
    poster_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = Field(True)
    priority: int = Field(1, ge=1, le=10)
    frequency_delay_seconds: int = Field(3, ge=1, le=60)
    suppression_days: int = Field(1, ge=0, le=30)
    target_routes: List[str] = Field(default_factory=lambda: ["/", "/store", "/offers"])
    layout_variant: str = Field("standard", pattern="^(standard|split_image|minimal)$")


class PromotionalPopupUpdateRequest(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    discount_code: Optional[str] = None
    discount_badge: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    media_url: Optional[str] = None
    poster_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    frequency_delay_seconds: Optional[int] = None
    suppression_days: Optional[int] = None
    target_routes: Optional[List[str]] = None
    layout_variant: Optional[str] = None
