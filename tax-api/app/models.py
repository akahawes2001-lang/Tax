from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base


class DogTaxRate(Base):
    __tablename__ = "dog_tax_rates"
    id = Column(Integer, primary_key=True, index=True)
    breed_type = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    rate_per_quarter = Column(Float, nullable=False)


class DogBreed(Base):
    __tablename__ = "dog_breeds"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    is_dangerous = Column(Boolean, default=False)
    regulation_status = Column(String, default="current")


class TransportTaxRate(Base):
    __tablename__ = "transport_tax_rates"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_type = Column(String, nullable=False)
    min_mass = Column(Float, nullable=False)
    max_mass = Column(Float, nullable=False)
    rate_2025 = Column(Float, nullable=False)
    rate_2026 = Column(Float, nullable=False)
    is_luxury = Column(Boolean, default=False)
    luxury_coefficient = Column(Float, default=10.0)


class DepositTaxRule(Base):
    __tablename__ = "deposit_tax_rules"
    id = Column(Integer, primary_key=True, index=True)
    currency_type = Column(String, nullable=False)
    min_term_months_for_exemption = Column(Integer, nullable=False)
    tax_rate = Column(Float, nullable=False)


class RentalTaxRate(Base):
    __tablename__ = "rental_tax_rates"
    id = Column(Integer, primary_key=True, index=True)
    city_group = Column(String, nullable=False)
    property_type = Column(String, nullable=False)
    monthly_tax = Column(Float, nullable=False)


class SystemParameter(Base):
    __tablename__ = "system_parameters"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, nullable=False, default="user")
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True, unique=True)
    password_reset_token = Column(String, nullable=True, unique=True)
    password_reset_expires = Column(DateTime, nullable=True)
    totp_secret = Column(String, nullable=True)
    is_2fa_enabled = Column(Boolean, default=False)


class CarReference(Base):
    __tablename__ = "car_references"
    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    mass = Column(Float, nullable=True)
    is_luxury = Column(Boolean, default=False)


class Settlement(Base):
    __tablename__ = "settlements"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    region = Column(String, nullable=True)
    district = Column(String, nullable=True)
    type = Column(String, nullable=True)
    population = Column(Integer, nullable=True)


class History(Base):
    __tablename__ = "calculation_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    tax = Column(Float, nullable=False)
    details_json = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(String, nullable=False)
    rating = Column(Integer, default=5)
    author_name = Column(String, nullable=False, default="")
    approved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class PropertyTaxRate(Base):
    __tablename__ = "property_tax_rates"
    id = Column(Integer, primary_key=True, index=True)
    property_type = Column(String, nullable=False)
    region = Column(String, nullable=True)
    rate_percent = Column(Float, nullable=False)
    year = Column(Integer, nullable=False, default=2026)
