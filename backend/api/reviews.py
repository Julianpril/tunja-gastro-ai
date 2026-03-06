from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from backend.db.session import get_db
from backend.models.review import Review
from backend.models.dish import Dish
from backend.models.user import User

router = APIRouter()

class ReviewCreate(BaseModel):
    user_id: int
    dish_id: Optional[int] = None
    restaurant_id: Optional[int] = None
    rating: float
    comment: str = ""

class ReviewOut(BaseModel):
    id: int
    user_id: int
    dish_id: Optional[int] = None
    restaurant_id: Optional[int] = None
    rating: float
    comment: str
    created_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/dish/{dish_id}", response_model=List[ReviewOut])
def get_dish_reviews(dish_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.dish_id == dish_id).order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        result.append(ReviewOut(
            id=r.id, user_id=r.user_id, dish_id=r.dish_id,
            restaurant_id=r.restaurant_id, rating=r.rating,
            comment=r.comment or "", created_at=r.created_at,
            user_name=user.name if user else "Anónimo"
        ))
    return result

@router.post("/", response_model=ReviewOut)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    new_review = Review(
        user_id=review.user_id,
        dish_id=review.dish_id,
        restaurant_id=review.restaurant_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    # Update dish average rating
    if review.dish_id:
        avg = db.query(sqlfunc.avg(Review.rating)).filter(Review.dish_id == review.dish_id).scalar()
        if avg:
            dish = db.query(Dish).filter(Dish.id == review.dish_id).first()
            if dish:
                dish.rating = round(float(avg), 1)
                db.commit()
    user = db.query(User).filter(User.id == review.user_id).first()
    return ReviewOut(
        id=new_review.id, user_id=new_review.user_id, dish_id=new_review.dish_id,
        restaurant_id=new_review.restaurant_id, rating=new_review.rating,
        comment=new_review.comment or "", created_at=new_review.created_at,
        user_name=user.name if user else "Anónimo"
    )
