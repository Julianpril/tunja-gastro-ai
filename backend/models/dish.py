from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.db.session import Base

class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    name = Column(String, index=True)
    description = Column(Text)
    price = Column(Float)
    image_url = Column(String)
    calories = Column(Integer)
    is_regional = Column(Boolean, default=False)
    ingredients = Column(Text) # Comma separated or JSON string
    cultural_desc = Column(Text)
    rating = Column(Float, default=0.0)
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="dishes")
    reviews = relationship("Review", back_populates="dish")
    favorites = relationship("Favorite", back_populates="dish")
