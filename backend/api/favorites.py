from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from backend.db.session import get_db
from backend.models.favorite import Favorite
from backend.models.dish import Dish
from backend.schemas import DishResponse

router = APIRouter()

class FavoriteResponse(BaseModel):
    id: int
    dish_id: int
    created_at: datetime | None = None
    dish: DishResponse | None = None

    class Config:
        from_attributes = True

@router.get("/{user_id}", response_model=List[FavoriteResponse])
def get_favorites(user_id: int, db: Session = Depends(get_db)):
    favs = db.query(Favorite).filter(Favorite.user_id == user_id).all()
    return favs

@router.post("/{user_id}/{dish_id}")
def add_favorite(user_id: int, dish_id: int, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id, Favorite.dish_id == dish_id
    ).first()
    if existing:
        return {"message": "Already in favorites", "favorite_id": existing.id}
    fav = Favorite(user_id=user_id, dish_id=dish_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return {"message": "Added to favorites", "favorite_id": fav.id}

@router.delete("/{user_id}/{dish_id}")
def remove_favorite(user_id: int, dish_id: int, db: Session = Depends(get_db)):
    fav = db.query(Favorite).filter(
        Favorite.user_id == user_id, Favorite.dish_id == dish_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(fav)
    db.commit()
    return {"message": "Removed from favorites"}

@router.get("/{user_id}/check/{dish_id}")
def check_favorite(user_id: int, dish_id: int, db: Session = Depends(get_db)):
    fav = db.query(Favorite).filter(
        Favorite.user_id == user_id, Favorite.dish_id == dish_id
    ).first()
    return {"is_favorite": fav is not None}
