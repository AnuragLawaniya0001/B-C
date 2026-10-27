from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MediaAssetUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=150)
    alt_text: Optional[str] = Field(None, max_length=250)
    caption: Optional[str] = Field(None, max_length=300)
    tags: Optional[List[str]] = None
    category: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, pattern="^(published|archived|draft)$")
    poster_url: Optional[str] = None


class MediaUsageItem(BaseModel):
    source_type: str  # 'product', 'storefront_section', 'banner', 'popup'
    source_id: str
    source_name: str
    field_name: str


class MediaUsageCheckResponse(BaseModel):
    media_id: str
    is_in_use: bool
    usage_count: int
    references: List[MediaUsageItem]


class MediaAssetResponse(BaseModel):
    id: str
    media_id: str
    original_filename: str
    display_name: str
    media_type: str  # 'image' or 'video'
    mime_type: str
    file_size: int
    url: str
    thumbnail_url: Optional[str] = None
    poster_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None
    alt_text: Optional[str] = ""
    caption: Optional[str] = ""
    tags: List[str] = []
    category: str = "general"
    status: str = "published"
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = "admin"
