"""Pydantic schemas for Products and Categories management."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Category display name")
    slug: Optional[str] = Field(None, min_length=2, max_length=60, description="URL slug (auto-generated if omitted)")
    description: Optional[str] = Field(default="", max_length=500, description="Optional category description")
    order: int = Field(default=1, ge=1, description="Display order sequence")
    active: bool = Field(default=True, description="Active status")


class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    slug: Optional[str] = Field(None, min_length=2, max_length=60)
    description: Optional[str] = Field(None, max_length=500)
    order: Optional[int] = Field(None, ge=1)
    active: Optional[bool] = None


class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Product title")
    slug: Optional[str] = Field(None, min_length=2, max_length=160, description="URL slug (auto-generated if omitted)")
    description: Optional[str] = Field(default="", max_length=3000, description="Detailed product description")
    category: str = Field(..., min_length=2, max_length=50, description="Product category identifier (e.g. GEARS, APPAREL)")
    sport: Optional[str] = Field(default="general", max_length=50, description="Sport tag (e.g. cricket, football, fitness)")
    sku: Optional[str] = Field(None, max_length=50, description="Stock Keeping Unit identifier")
    price_paise: int = Field(..., ge=0, description="Regular retail price in paise (e.g. 450000 for ₹4,500.00)")
    member_price_paise: Optional[int] = Field(None, ge=0, description="Discounted price for Bigchamp digital card members in paise")
    stock: int = Field(default=0, ge=0, description="Available inventory count")
    images: List[str] = Field(default_factory=list, description="Array of image paths or URLs")
    is_cookey: bool = Field(default=False, description="Whether product is member-only Cookey")
    featured: bool = Field(default=False, description="Promote on homepage showcase")
    active: bool = Field(default=True, description="Active status in catalog")


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    slug: Optional[str] = Field(None, min_length=2, max_length=160)
    description: Optional[str] = Field(None, max_length=3000)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    sport: Optional[str] = Field(None, max_length=50)
    sku: Optional[str] = Field(None, max_length=50)
    price_paise: Optional[int] = Field(None, ge=0)
    member_price_paise: Optional[int] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None
    is_cookey: Optional[bool] = None
    featured: Optional[bool] = None
    active: Optional[bool] = None


class StockAdjustRequest(BaseModel):
    adjustment_qty: int = Field(..., description="Positive for addition, negative for reduction")
    reason: str = Field(..., min_length=3, max_length=200, description="Reason for adjustment, e.g. RESTOCK, DAMAGE, AUDIT")
    notes: Optional[str] = Field(default=None, max_length=500)


class InventoryLogResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    change_qty: int
    previous_stock: int
    new_stock: int
    reason: str
    actor: str
    related_order_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
