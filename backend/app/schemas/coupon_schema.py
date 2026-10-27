"""Pydantic schemas for Offers and Coupons management and validation."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class DiscountType(str, Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED_AMOUNT = "FIXED_AMOUNT"


class OfferCouponCreateRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=30, description="Unique uppercase coupon code (e.g. WELCOME10)")
    name: str = Field(..., min_length=2, max_length=150, description="Offer display headline")
    description: Optional[str] = Field(default="", max_length=500, description="Terms, rules, and promotional summary")
    discount_type: DiscountType = Field(default=DiscountType.PERCENTAGE, description="PERCENTAGE or FIXED_AMOUNT")
    discount_value: float = Field(..., gt=0, description="Percentage (e.g. 15 for 15%) or Fixed amount in paise (e.g. 20000 for ₹200)")
    min_order_paise: int = Field(default=0, ge=0, description="Minimum eligible cart subtotal in paise")
    max_discount_paise: Optional[int] = Field(default=None, ge=0, description="Maximum discount ceiling in paise for percentage offers")
    applicable_categories: List[str] = Field(default_factory=list, description="Target category slugs/names (empty = all)")
    applicable_product_ids: List[str] = Field(default_factory=list, description="Target product IDs/slugs (empty = all)")
    total_usage_limit: Optional[int] = Field(default=None, ge=1, description="Global maximum redemption limit across platform")
    per_user_limit: int = Field(default=1, ge=1, description="Maximum times a single customer can redeem")
    start_date: Optional[datetime] = Field(default=None, description="Start date/time in UTC")
    end_date: Optional[datetime] = Field(default=None, description="Expiry date/time in UTC")
    active: bool = Field(default=True, description="Active status")

    @model_validator(mode="after")
    def validate_rules(self):
        # Percentage discount must be <= 100%
        if self.discount_type == DiscountType.PERCENTAGE and self.discount_value > 100:
            raise ValueError("Percentage discount cannot exceed 100%")

        # End date must be strictly after start date
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")

        return self


class OfferCouponUpdateRequest(BaseModel):
    code: Optional[str] = Field(None, min_length=3, max_length=30)
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[float] = Field(None, gt=0)
    min_order_paise: Optional[int] = Field(None, ge=0)
    max_discount_paise: Optional[int] = Field(None, ge=0)
    applicable_categories: Optional[List[str]] = None
    applicable_product_ids: Optional[List[str]] = None
    total_usage_limit: Optional[int] = Field(None, ge=1)
    per_user_limit: Optional[int] = Field(None, ge=1)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_rules(self):
        if self.discount_type == DiscountType.PERCENTAGE and self.discount_value and self.discount_value > 100:
            raise ValueError("Percentage discount cannot exceed 100%")
        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        return self


class CartItemValidateSchema(BaseModel):
    product_id: str
    name: Optional[str] = ""
    category: Optional[str] = "GENERAL"
    price_paise: int = Field(..., ge=0)
    qty: int = Field(default=1, ge=1)


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    items: List[CartItemValidateSchema] = Field(default_factory=list)
    subtotal_paise: Optional[int] = Field(default=0, ge=0)


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    name: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_paise: int = 0
    final_total_paise: int = 0
    message: str
    reason: Optional[str] = None
    reason_code: Optional[str] = None
    savings_text: Optional[str] = None
