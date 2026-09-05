from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


# Base Model for automatic camelCase <-> snake_case conversion
class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# --- AUTHENTICATION & USER REGISTRATION ---

class RegisterRequest(CamelModel):
    # Core User Fields
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=10)
    city: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=6)
    role: str

    # Driver Profile Fields (accepts float/int or None)
    experience: Optional[float] = None
    truck_number: Optional[str] = None
    truck_type: Optional[str] = None
    capacity: Optional[float] = None
    license_number: Optional[str] = None

    # Loader Profile Fields
    company_name: Optional[str] = None
    business_type: Optional[str] = None
    gst_number: Optional[str] = None
    operating_hours: Optional[str] = None
    address: Optional[str] = None


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserResponse(CamelModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    city: str
    role: str
    status: str
    created_at: datetime


# --- MARKETPLACE TRANSACTIONS ---

class LoadCreate(CamelModel):
    loader_id: int
    pickup: str
    destination: str
    load_type: Optional[str] = None
    weight: Optional[float] = None
    truck_type: Optional[str] = None
    pickup_date: Optional[date] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    description: Optional[str] = None


class LoadResponse(LoadCreate):
    id: int
    status: str
    created_at: datetime


class DealCreate(CamelModel):
    load_id: int
    driver_id: int
    deal_price: float


class DealResponse(DealCreate):
    id: int
    status: str
    created_at: datetime


# --- UTILITIES ---

class ContactRequest(CamelModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str


class ContactResponse(ContactRequest):
    id: int
    status: str
    created_at: datetime