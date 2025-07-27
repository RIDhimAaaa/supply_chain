# models.py
from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from config import Base
import uuid

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

class Profile(Base):
    __tablename__ = "profiles"
    
    # --- Merged Fields ---
    id = Column(UUID(as_uuid=True), primary_key=True) # This should reference auth.users, but your boilerplate might handle this differently. Keeping it simple for now.
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)  # Made nullable for initial profile creation
    full_name = Column(String, nullable=True)  # Made nullable for initial creation
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- Relationships ---
    role = relationship("Role")

    def __repr__(self):
        return f"<Profile(id={self.id}, email={self.email})>"

class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String, nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    img_emoji = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    supplier = relationship("Profile")
    deals = relationship("Deal", back_populates="product")

class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    threshold = Column(Integer, nullable=False)
    discount = Column(Numeric(5, 4), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product", back_populates="deals")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    is_finalized = Column(Boolean, default=False)
    final_price = Column(Numeric(10, 2), nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    finalized_at = Column(DateTime(timezone=True), nullable=True)

    vendor = relationship("Profile", foreign_keys=[vendor_id])
    product = relationship("Product")

# In models.py

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    requested_role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    status = Column(String, default='pending', nullable=False)
    notes = Column(Text, nullable=True)
    document_url = Column(String, nullable=True) # <-- ADD THIS LINE

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("Profile")
    requested_role = relationship("Role")


class DeliveryRoute(Base):
    __tablename__ = "delivery_routes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    route_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default='assigned', nullable=False)  # assigned, in_progress, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    agent = relationship("Profile")
    stops = relationship("RouteStop", back_populates="route")


class RouteStop(Base):
    __tablename__ = "route_stops"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("delivery_routes.id"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    stop_type = Column(String, nullable=False)  # 'pickup' or 'delivery'
    sequence_order = Column(Integer, nullable=False)
    status = Column(String, default='pending', nullable=False)  # pending, completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    route = relationship("DeliveryRoute", back_populates="stops")
    profile = relationship("Profile")