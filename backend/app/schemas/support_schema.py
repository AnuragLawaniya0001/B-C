"""Schemas for customer support tickets and communication threads."""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class SupportTicketCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    subject: str = Field(..., min_length=3, max_length=200, description="Ticket subject")
    category: str = Field(default="GENERAL", description="ORDER, REFUND, MEMBERSHIP, WALLET, or GENERAL")
    message: str = Field(..., min_length=5, max_length=2000, description="Detailed problem description")
    order_number: Optional[str] = Field(default=None, description="Optional related order number")


class SupportTicketReplyRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(..., min_length=1, max_length=2000, description="Message text")


class AdminTicketStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: str = Field(..., description="OPEN | IN_PROGRESS | RESOLVED | CLOSED")
    note: Optional[str] = Field(default=None, description="Internal note or status explanation")
