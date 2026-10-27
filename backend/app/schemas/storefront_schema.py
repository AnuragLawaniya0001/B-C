from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class StorefrontSectionItem(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    tag: Optional[str] = None
    image: Optional[str] = None
    video_url: Optional[str] = None
    link: Optional[str] = None
    link_text: Optional[str] = None
    badge: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class StorefrontSectionCreateRequest(BaseModel):
    section_key: str = Field(..., max_length=50)  # e.g. 'hero_main', 'shop_by_collection'
    section_type: str = Field(..., max_length=50)  # e.g. 'hero_campaign', 'collections_strip'
    title: Optional[str] = Field(None, max_length=150)
    subtitle: Optional[str] = Field(None, max_length=300)
    badge_text: Optional[str] = Field(None, max_length=100)
    media_type: str = Field("image", pattern="^(image|video)$")
    media_url: Optional[str] = None
    poster_url: Optional[str] = None
    cta_label: Optional[str] = Field(None, max_length=50)
    cta_link: Optional[str] = Field(None, max_length=200)
    secondary_cta_label: Optional[str] = Field(None, max_length=50)
    secondary_cta_link: Optional[str] = Field(None, max_length=200)
    items: Optional[List[StorefrontSectionItem]] = []
    product_ids: Optional[List[str]] = []
    order: int = Field(0)
    is_active: bool = Field(True)
    config: Optional[Dict[str, Any]] = {}


class StorefrontSectionUpdateRequest(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    badge_text: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    poster_url: Optional[str] = None
    cta_label: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    secondary_cta_label: Optional[str] = None
    secondary_cta_link: Optional[str] = None
    items: Optional[List[StorefrontSectionItem]] = None
    product_ids: Optional[List[str]] = None
    order: Optional[int] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class StorefrontReorderRequest(BaseModel):
    section_ids: List[str]
