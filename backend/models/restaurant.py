from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from backend.db.session import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    rating = Column(Float, default=0.0)
    image_url = Column(String)
    price_range = Column(String) # $, $$, $$$
    cuisine_type = Column(String)
    
    # Relationships
    dishes = relationship("Dish", back_populates="restaurant")
    reviews = relationship("Review", back_populates="restaurant")
