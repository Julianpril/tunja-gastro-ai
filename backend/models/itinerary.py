from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db.session import Base

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="itineraries")
    items = relationship("ItineraryItem", back_populates="itinerary", cascade="all, delete-orphan")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    # Could also link to activities or other places
    day_number = Column(Integer) # Day 1, Day 2, etc.
    time = Column(String) # "12:00 PM"
    notes = Column(Text)
    
    # Relationships
    itinerary = relationship("Itinerary", back_populates="items")
    restaurant = relationship("Restaurant")
