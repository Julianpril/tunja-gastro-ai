from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db.session import Base

class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint('user_id', 'dish_id', name='uq_user_dish_favorite'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dish_id = Column(Integer, ForeignKey("dishes.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")
    dish = relationship("Dish", back_populates="favorites")
