from fastapi import APIRouter, Depends, HTTPException, status
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])



pwd_context = PasswordHash(hashers=[BcryptHasher()])



def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# 1. USER REGISTRATION
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if data.role not in ["DRIVER", "LOADER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid role"
        )

    clean_email = data.email.strip().lower()

    # Case-insensitive duplicate check
    existing_user = db.execute(
        text("SELECT id FROM users WHERE LOWER(email) = :email"),
        {"email": clean_email}
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )

    try:
        # Securely hash the incoming password
        hashed_pwd = hash_password(data.password)

        # Insert base user record
        result = db.execute(
            text("""
                INSERT INTO users (name, email, phone, password, role, status, city) 
                VALUES (:name, :email, :phone, :password, :role, 'PENDING', :city)
            """),
            {
                "name": data.name,
                "email": clean_email,
                "phone": data.phone,
                "password": hashed_pwd,
                "role": data.role,
                "city": data.city,
            },
        )
        user_id = result.lastrowid

        # Insert driver profile
        if data.role == "DRIVER":
            db.execute(
                text("""
                    INSERT INTO driver_profiles (user_id, experience, truck_number, truck_type, capacity, license_number) 
                    VALUES (:user_id, :experience, :truck_number, :truck_type, :capacity, :license_number)
                """),
                {
                    "user_id": user_id,
                    "experience": getattr(data, "experience", None),
                    "truck_number": getattr(data, "truck_number", getattr(data, "truckNumber", None)),
                    "truck_type": getattr(data, "truck_type", getattr(data, "truckType", None)),
                    "capacity": getattr(data, "capacity", None),
                    "license_number": getattr(data, "license_number", getattr(data, "licenseNumber", None)),
                },
            )

        # Insert loader profile
        elif data.role == "LOADER":
            db.execute(
                text("""
                    INSERT INTO loader_profiles (user_id, company_name, business_type, gst_number, operating_hours, address) 
                    VALUES (:user_id, :company_name, :business_type, :gst_number, :operating_hours, :address)
                """),
                {
                    "user_id": user_id,
                    "company_name": getattr(data, "company_name", getattr(data, "companyName", None)),
                    "business_type": getattr(data, "business_type", getattr(data, "businessType", None)),
                    "gst_number": getattr(data, "gst_number", getattr(data, "gstNumber", None)),
                    "operating_hours": getattr(data, "operating_hours", getattr(data, "operatingHours", None)),
                    "address": getattr(data, "address", None),
                },
            )

        db.commit()
        return {
            "message": "Registration successful",
            "user_id": user_id,
            "role": data.role,
            "status": "PENDING",
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=str(e)
        )


# 2. USER LOGIN
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    clean_email = data.email.strip().lower()

    user = db.execute(
        text("""
            SELECT u.id, u.name, u.email, u.password, u.role, u.status, u.city,
                   dp.id AS driver_profile_id, 
                   lp.id AS loader_profile_id
            FROM users u
            LEFT JOIN driver_profiles dp ON u.id = dp.user_id
            LEFT JOIN loader_profiles lp ON u.id = lp.user_id
            WHERE LOWER(u.email) = :email
        """),
        {"email": clean_email},
    ).mappings().first()

    # Password validation check using verify_password
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user["status"] == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is waiting for admin verification",
        )

    if user["status"] == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been rejected by admin",
        )

    # Determine the role-specific profile ID
    profile_id = None
    if user["role"] == "LOADER":
        profile_id = user["loader_profile_id"]
    elif user["role"] == "DRIVER":
        profile_id = user["driver_profile_id"]
    elif user["role"] == "ADMIN":
        profile_id = user["id"]

    # Construct the base response
    user_response = {
        "id": user["id"],
        "profileId": profile_id,  # General fallback
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "status": user["status"],
        "city": user["city"],
    }

    return {
        "message": "Login successful",
        "user": user_response,
    }
