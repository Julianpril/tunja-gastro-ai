from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from backend.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Preferences
    regional_interest = Column(String) # bajo, medio, alto
    restrictions = Column(String) # comma separated
    budget = Column(Float)
    tourist_type = Column(String) # local, nacional, extranjero
    
    # New Profile Fields for ML
    age = Column(Integer)
    gender = Column(String)
    country = Column(String)
    group_size = Column(Integer)
    visit_motive = Column(String)

    # Relationships
    reviews = relationship("Review", back_populates="user")
    itineraries = relationship("Itinerary", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")
