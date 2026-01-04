from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    name: str
    password: str
    regional_interest: str
    restrictions: Optional[str] = None
    budget: Optional[float] = None
    tourist_type: str

class UserUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    group_size: Optional[int] = None
    visit_motive: Optional[str] = None
    regional_interest: Optional[str] = None
    restrictions: Optional[str] = None
    budget: Optional[float] = None
    tourist_type: Optional[str] = None

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    name: str
    regional_interest: str
    tourist_type: str
    restrictions: Optional[str] = None
    budget: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    group_size: Optional[int] = None
    visit_motive: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    is_profile_complete: bool = False

class RestaurantBase(BaseModel):
    name: str
    description: str
    address: str
    latitude: float
    longitude: float
    rating: float
    image_url: str
    price_range: str
    cuisine_type: str

class DishBase(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    calories: int
    is_regional: bool
    ingredients: str
    cultural_desc: str
    rating: float

class ReviewBase(BaseModel):
    rating: float
    comment: str

class ReviewResponse(ReviewBase):
    id: int
    restaurant_id: Optional[int] = None
    dish_id: Optional[int] = None
    created_at: Optional[datetime] = None
    
    # We can add these if we want the names directly
    restaurant: Optional[RestaurantBase] = None
    dish: Optional[DishBase] = None

    class Config:
        from_attributes = True

class UserProfile(UserResponse):
    reviews: List[ReviewResponse] = []

class DishResponse(DishBase):
    id: int
    restaurant_id: int
    restaurant: Optional[RestaurantBase] = None

    class Config:
        from_attributes = True

class RestaurantResponse(RestaurantBase):
    id: int
    dishes: List[DishResponse] = []

    class Config:
        from_attributes = True
