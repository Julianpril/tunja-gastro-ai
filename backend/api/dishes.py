from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.db.session import get_db
from backend.models import Dish, Restaurant
from backend.schemas import DishResponse
from backend.services.openai_service import generate_dish_content

router = APIRouter()

@router.get("/", response_model=List[DishResponse])
def get_dishes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    cuisine_type: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    is_regional: Optional[bool] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Dish).join(Restaurant)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Dish.name.ilike(search_term) |
            Dish.description.ilike(search_term) |
            Dish.ingredients.ilike(search_term) |
            Restaurant.name.ilike(search_term) |
            Restaurant.cuisine_type.ilike(search_term)
        )
    if cuisine_type:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine_type}%"))
    if price_min is not None:
        query = query.filter(Dish.price >= price_min)
    if price_max is not None:
        query = query.filter(Dish.price <= price_max)
    if is_regional is not None:
        query = query.filter(Dish.is_regional == is_regional)
    if min_rating is not None:
        query = query.filter(Dish.rating >= min_rating)
    dishes = query.offset(skip).limit(limit).all()
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
