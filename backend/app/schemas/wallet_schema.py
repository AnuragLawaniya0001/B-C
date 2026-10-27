"""Pydantic schemas for Wallet & Transaction Ledger module."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class WalletStatus(str, Enum):
    ACTIVE = "ACTIVE"
    LOCKED = "LOCKED"
    SUSPENDED = "SUSPENDED"


class TransactionType(str, Enum):
    ADJUSTMENT = "ADJUSTMENT"
    ORDER_PAYMENT = "ORDER_PAYMENT"
    REFUND = "REFUND"
    CASHBACK = "CASHBACK"
    MEMBERSHIP_BENEFIT = "MEMBERSHIP_BENEFIT"


class TransactionDirection(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class TransactionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PENDING = "PENDING"
    FAILED = "FAILED"
    REVERSED = "REVERSED"


class WalletResponse(BaseModel):
    id: str
    user_id: str
    balance_paise: int = 0
    currency: str = "INR"
    status: WalletStatus = WalletStatus.ACTIVE
    created_at: datetime
    updated_at: datetime


class WalletTransactionResponse(BaseModel):
    id: str
    transaction_id: str
    wallet_id: str
    user_id: str
    transaction_type: TransactionType
    direction: TransactionDirection
    amount_paise: int
    balance_before_paise: int
    balance_after_paise: int
    status: TransactionStatus
    reason: str
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    actor: str = "SYSTEM"
    actor_id: Optional[str] = None
    created_at: datetime


class WalletTransactionListResponse(BaseModel):
    items: List[WalletTransactionResponse]
    total: int
    skip: int
    limit: int


class AdminWalletAdjustmentRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Customer user ID")
    direction: TransactionDirection = Field(..., description="CREDIT or DEBIT")
    amount_rupees: Optional[float] = Field(default=None, description="Amount in INR (must be > 0)")
    amount_paise: Optional[int] = Field(default=None, description="Amount in integer paise (must be > 0)")
    reason: str = Field(..., min_length=3, max_length=200, description="Mandatory administrative justification")
    notes: Optional[str] = Field(default=None, max_length=500, description="Optional operational context")
    reference_type: Optional[str] = Field(default=None, max_length=100)
    reference_id: Optional[str] = Field(default=None, max_length=100)
    idempotency_key: Optional[str] = Field(default=None, max_length=100, description="Idempotency key to prevent double adjustments")

    @field_validator("amount_rupees")
    @classmethod
    def validate_positive_rupees(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Adjustment amount must be strictly greater than 0")
        return v

    @field_validator("amount_paise")
    @classmethod
    def validate_positive_paise(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Adjustment amount must be strictly greater than 0")
        return v



class CustomerWalletSummaryResponse(BaseModel):
    wallet: WalletResponse
    total_credited_paise: int = 0
    total_debited_paise: int = 0
    total_transactions: int = 0
    recent_transactions: List[WalletTransactionResponse] = []


class AdminWalletListItemResponse(BaseModel):
    wallet: WalletResponse
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_mobile: Optional[str] = None
    is_member: bool = False
    transaction_count: int = 0


class AdminWalletListResponse(BaseModel):
    items: List[AdminWalletListItemResponse]
    total: int
    skip: int
    limit: int


class OperationState(str, Enum):
    INITIATED = "INITIATED"
    BALANCE_APPLIED = "BALANCE_APPLIED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    UNCERTAIN = "UNCERTAIN"


class WalletReconciliationResponse(BaseModel):
    user_id: str
    wallet_balance_paise: int
    ledger_credits_paise: int
    ledger_debits_paise: int
    ledger_calculated_balance_paise: int
    is_reconciled: bool
    discrepancy_paise: int
    total_transactions: int
    pending_operations_count: int = 0
    unreconciled_operations: List[Dict[str, Any]] = []


class WalletRecoveryRequest(BaseModel):
    user_id: Optional[str] = Field(default=None, description="Target customer ID, or null for all customers")
    notes: Optional[str] = Field(default=None, description="Administrative audit notes")


class WalletRecoveryResultItem(BaseModel):
    operation_id: str
    user_id: str
    transaction_id: Optional[str] = None
    direction: Optional[str] = None
    amount_paise: int
    previous_state: str
    new_state: str
    action_taken: str
    details: Optional[str] = None


class WalletRecoveryResponse(BaseModel):
    recovered_count: int
    failed_count: int
    ambiguous_count: int
    items: List[WalletRecoveryResultItem]
    executed_at: datetime
    admin_email: str

