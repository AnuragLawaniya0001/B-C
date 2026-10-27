"""Pydantic schemas for Lucky Draw Lifecycle, Auditable Selection & Prize Allocation."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LuckyDrawStatusEnum(str, Enum):
    CREATED = "CREATED"
    SNAPSHOT_TAKEN = "SNAPSHOT_TAKEN"
    EXECUTED = "EXECUTED"
    CANCELLED = "CANCELLED"
    BLOCKED = "BLOCKED — APPROVAL REQUIRED"


class LuckyDrawCycleCreateRequest(BaseModel):
    cycle_name: str = Field(..., min_length=3, max_length=100, description="e.g. Weekly Cookey Draw - Cycle #12")
    start_date: datetime = Field(..., description="Cycle start timestamp UTC")
    end_date: datetime = Field(..., description="Cycle end timestamp UTC")
    prize_paise: Optional[int] = Field(None, ge=100, description="Prize amount in paise (overrides DB settings if set)")


class LuckyDrawExecuteRequest(BaseModel):
    dry_run: bool = Field(default=True, description="When true, simulates draw without wallet credit or state finalization")
    seed_for_testing: Optional[int] = Field(None, description="Optional deterministic seed used exclusively for unit tests")
