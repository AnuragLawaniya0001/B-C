from pathlib import Path
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BASE_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = "development"
    PORT: int = 3050
    MONGO_URI: str = Field(..., description="MongoDB connection string")
    MONGO_DB_NAME: str = "bigchamp"
    JWT_SECRET: str = Field(..., description="Secret key for signing JWT tokens")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    QR_SIGNING_SECRET: str = Field(..., description="Secret key for signing QR code payloads")
    RAZORPAY_KEY_ID: str = Field(default="rzp_test_Ts2QVBlOxhwFTu", description="Razorpay Test Key ID")
    RAZORPAY_KEY_SECRET: str = Field(default="gv4f7MHd9cG8tjKnb5gH8aeO", description="Razorpay Test Key Secret")
    RAZORPAY_WEBHOOK_SECRET: str = Field(default="BigchampTestWebhookSecret123456", description="Razorpay Webhook Secret")
    PAYMENT_MODE: str = Field(default="test", description="Payment mode: strictly 'test' in this phase")
    CLOUDINARY_CLOUD_NAME: str = Field(default="ibq3zgu8", description="Cloudinary Cloud Name")
    CLOUDINARY_API_KEY: str = Field(default="211541897473636", description="Cloudinary API Key")
    CLOUDINARY_API_SECRET: str = Field(default="qEkjCpQ0HM94jNByRxIJiyKSz_s", description="Cloudinary API Secret")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3050",
        "http://localhost:80",
        "http://localhost",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3050",
        "http://127.0.0.1:80",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
