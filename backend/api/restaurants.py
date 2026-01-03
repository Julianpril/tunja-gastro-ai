from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.session import get_db
from backend.models import Restaurant
from backend.schemas import RestaurantResponse

router = APIRouter()

@router.get("/", response_model=List[RestaurantResponse])
def get_restaurants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    restaurants = db.query(Restaurant).offset(skip).limit(limit).all()
    return restaurants

@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant
