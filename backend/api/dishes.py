from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.db.session import get_db
from backend.models import Dish
from backend.schemas import DishResponse
from backend.services.gemini_service import generate_dish_content

router = APIRouter()

@router.get("/", response_model=List[DishResponse])
def get_dishes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    dishes = db.query(Dish).offset(skip).limit(limit).all()
    return dishes

@router.get("/{dish_id}", response_model=DishResponse)
def get_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish

@router.get("/{dish_id}/enrich")
def get_enriched_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    
    # Call Gemini Service
    enriched_data = generate_dish_content(dish.name, dish.ingredients)
    
    return enriched_data
