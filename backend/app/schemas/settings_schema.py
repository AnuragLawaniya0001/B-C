"""Pydantic schemas for platform settings management."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class BusinessRulesSchema(BaseModel):
    card_fee_paise: int = Field(default=10000, ge=100, description="Membership fee in paise (e.g. 10000 for ₹100)")
    card_validity_days: int = Field(default=334, ge=1, le=730, description="Card validity period in days")
    joining_cashback_percent: float = Field(default=10.0, ge=0.0, le=100.0, description="Joining wallet cashback percentage")
    cookey_price_paise: int = Field(default=10000, ge=100, description="Cookey price in paise")
    cookey_cooldown_days: int = Field(default=7, ge=0, le=365, description="Cooldown interval between Cookey purchases")
    cookey_max_per_week: int = Field(default=1, ge=1, le=10, description="Max Cookey purchase quantity per week")
    army_extra_discount_percent: float = Field(default=10.0, ge=0.0, le=100.0, description="Privilege discount percentage for defense personnel")
    lucky_draw_prize_paise: int = Field(default=50000, ge=0, description="Weekly lucky draw prize amount in paise")
    lucky_draw_frequency: str = Field(default="weekly", description="Draw cycle: weekly | monthly")
    autopay_enabled: bool = Field(default=False, description="Configuration flag only: whether AutoPay recurring mandate is offered")
    winner_selection_mode: str = Field(default="simulated_random", description="Winner selection mode: simulated_random | manual_draw")
    partner_visibility: bool = Field(default=True, description="Whether partner dormitories and physio clinics are visible")
    default_dormitory_discount_percent: float = Field(default=15.0, ge=0.0, le=100.0)
    default_physio_discount_percent: float = Field(default=20.0, ge=0.0, le=100.0)
    standard_delivery_charge_paise: int = Field(default=0, ge=0, description="Standard delivery charge in paise. Default 0 (Free).")
    free_delivery_threshold_paise: int = Field(default=50000, ge=0, description="Subtotal threshold in paise for free delivery (e.g. 50000 = ₹500)")
    default_member_discount_percent: float = Field(default=10.0, ge=0.0, le=100.0, description="Platform member discount percentage when product has no custom member_price")
    min_order_value_paise: int = Field(default=0, ge=0, description="Minimum order subtotal in paise required to checkout")
    max_items_per_order: int = Field(default=50, ge=1, le=500, description="Maximum total item quantity per order")
    partner_default_commission_percent: float = Field(default=15.0, ge=0.0, le=100.0, description="Default partner commission percentage")
    tax_percent: float = Field(default=0.0, ge=0.0, le=100.0, description="Default order tax/GST percentage")
    referral_reward_paise: int = Field(default=5000, ge=0, description="Wallet reward in paise for referrer upon first order")
    return_window_days: int = Field(default=7, ge=1, le=90, description="Max days after delivery to request return")
    low_stock_threshold: int = Field(default=5, ge=0, le=1000, description="Product stock quantity threshold for low-stock alerts")
    payment_routing: Dict[str, Any] = Field(
        default_factory=lambda: {"gateway": "DEMO_SIMULATION", "test_mode": True, "notes": "Config only, live routing deferred"}
    )

    @field_validator("payment_routing")
    @classmethod
    def sanitize_payment_routing(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """Strictly prohibit saving actual secret keys or live payment credentials."""
        forbidden_keys = {"secret", "api_key", "secret_key", "private_key", "password", "token"}
        for k in list(v.keys()):
            if any(forbidden in k.lower() for forbidden in forbidden_keys):
                raise ValueError(f"Secret field '{k}' is forbidden in public/admin configuration")
        return v


class UpdateSettingRequest(BaseModel):
    value: Dict[str, Any] = Field(..., description="Settings payload dictionary")


class SettingResponse(BaseModel):
    key: str
    value: Any
    updated_at: Optional[datetime] = None
