"""Pydantic schemas for CMS Pages, Banners, and FAQs management."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PageSectionSchema(BaseModel):
    id: str = Field(..., description="Unique section identifier (e.g. hero, benefits)")
    type: str = Field(..., description="Section layout type (e.g. hero, benefits, banner, grid)")
    enabled: bool = Field(default=True, description="Whether section is rendered on frontend")
    order: int = Field(default=1, description="Display order sequence")
    content: Dict[str, Any] = Field(default_factory=dict, description="Dynamic section content payload")


class PageUpdateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Page title")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="SEO and OpenGraph metadata")
    sections: List[PageSectionSchema] = Field(default_factory=list, description="Ordered dynamic page sections")
    active: bool = Field(default=True, description="Whether page is published")


class BannerCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Promotional banner headline")
    position: str = Field(default="homepage_top", description="Slot placement: homepage_top | homepage_middle | store_top")
    link: str = Field(default="/", description="Target URL or app route")
    image_url: Optional[str] = Field(default=None, description="Banner image asset path or URL")
    order: int = Field(default=1, ge=1, description="Sort order display priority")
    active: bool = Field(default=True, description="Active status")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class BannerUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    position: Optional[str] = None
    link: Optional[str] = None
    image_url: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)
    active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class FaqCreateRequest(BaseModel):
    category: str = Field(default="general", min_length=2, max_length=50, description="FAQ category slug")
    question: str = Field(..., min_length=5, max_length=300, description="FAQ question")
    answer: str = Field(..., min_length=5, max_length=2000, description="FAQ answer")
    order: int = Field(default=1, ge=1, description="Display order within category")
    active: bool = Field(default=True, description="Active status")


class FaqUpdateRequest(BaseModel):
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    question: Optional[str] = Field(None, min_length=5, max_length=300)
    answer: Optional[str] = Field(None, min_length=5, max_length=2000)
    order: Optional[int] = Field(None, ge=1)
    active: Optional[bool] = None
