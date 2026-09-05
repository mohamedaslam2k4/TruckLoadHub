from sqlalchemy import DECIMAL, TIMESTAMP, Column, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# --- CORE USER ACCOUNT ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(20))
    city = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum("DRIVER", "LOADER", "ADMIN"), nullable=False)
    status = Column(Enum("PENDING", "VERIFIED", "REJECTED"), default="PENDING")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # One-to-One profile mappings
    driver_profile = relationship("DriverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    loader_profile = relationship("LoaderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


# --- BUSINESS PROFILES ---

class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    experience = Column(Integer)
    truck_number = Column(String(50))
    truck_type = Column(String(50))
    capacity = Column(DECIMAL(10, 2))
    license_number = Column(String(100))

    user = relationship("User", back_populates="driver_profile")
    deals = relationship("Deal", back_populates="driver", cascade="all, delete-orphan")

class LoaderProfile(Base):
    __tablename__ = "loader_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(String(150))

    business_type = Column(String(100))
    gst_number = Column(String(15))
    operating_hours = Column(String(50))

    user = relationship("User", back_populates="loader_profile")
    loads = relationship("Load", back_populates="loader", cascade="all, delete-orphan")

class LoaderProfile(Base):
    __tablename__ = "loader_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(String(150))
    business_type = Column(String(100))
    gst_number = Column(String(15))
    operating_hours = Column(String(50))
    address = Column(String(250))

    user = relationship("User", back_populates="loader_profile")
    loads = relationship("Load", back_populates="loader", cascade="all, delete-orphan")


# --- MARKETPLACE TRANSACTIONS ---

class Load(Base):
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True)
    loader_id = Column(Integer, ForeignKey("loader_profiles.id", ondelete="CASCADE"), nullable=False)
    pickup = Column(String(150), nullable=False)
    destination = Column(String(150), nullable=False)
    load_type = Column(String(100))
    weight = Column(DECIMAL(10, 2))
    truck_type = Column(String(50))
    pickup_date = Column(Date)
    min_price = Column(DECIMAL(12, 2))
    max_price = Column(DECIMAL(12, 2))
    description = Column(Text)
    status = Column(Enum("AVAILABLE", "BOOKED", "COMPLETED", "CANCELLED"), default="AVAILABLE")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    loader = relationship("LoaderProfile", back_populates="loads")
    deals = relationship("Deal", back_populates="load", cascade="all, delete-orphan")


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True)
    load_id = Column(Integer, ForeignKey("loads.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id", ondelete="CASCADE"), nullable=False)
    deal_price = Column(DECIMAL(12, 2), nullable=False)
    status = Column(Enum("PENDING", "ACCEPTED", "IN TRANSIT", "REJECTED", "COMPLETED"), default="PENDING")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    load = relationship("Load", back_populates="deals")
    driver = relationship("DriverProfile", back_populates="deals")


# --- UTILITIES ---

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(20))
    message = Column(Text, nullable=False)
    status = Column(Enum("PENDING", "CLOSED"), nullable=False, default="PENDING")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())