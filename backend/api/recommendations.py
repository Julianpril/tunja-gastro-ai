from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import joblib
import os
import numpy as np
from backend.db.session import get_db
from backend.models import Dish, User, Restaurant
from backend.schemas import DishResponse

router = APIRouter()

# Load ML Model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "modelo_hibrido_v1.pkl")
model = None

def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print("Recommendation Model loaded successfully")
        else:
            print(f"Recommendation Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading Recommendation Model: {e}")

# Load on module import
load_model()

@router.get("/{user_id}", response_model=List[DishResponse])
def get_recommendations(user_id: int, category: Optional[str] = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Get all dishes with their restaurant info
    query = db.query(Dish).join(Restaurant)
    
    # Apply User's Personal Restrictions ALWAYS (regardless of category)
    user_restrictions = (user.restrictions or "").lower()
    if "vegetariano" in user_restrictions or "vegano" in user_restrictions:
        query = query.filter(
            ~Dish.ingredients.ilike("%carne%") & 
            ~Dish.ingredients.ilike("%pollo%") & 
            ~Dish.ingredients.ilike("%cerdo%") & 
            ~Dish.ingredients.ilike("%res%") &
            ~Dish.ingredients.ilike("%pescado%") &
            ~Dish.ingredients.ilike("%gallina%") &
            ~Dish.ingredients.ilike("%chicharr%") &
            ~Dish.ingredients.ilike("%longaniza%") &
            ~Dish.ingredients.ilike("%tocino%")
        )
    if "gluten" in user_restrictions or "celiaco" in user_restrictions:
        query = query.filter(
            ~Dish.ingredients.ilike("%trigo%") & 
            ~Dish.ingredients.ilike("%harina%") & 
            ~Dish.ingredients.ilike("%pan%") &
            ~Dish.ingredients.ilike("%pasta%")
        )
    
    # Apply Category Filters (UI selection)
    if category:
        if category == "Regionales":
            query = query.filter(Dish.is_regional == True)
        elif category == "Sin Carne": # Vegetariano
            # Filter out dishes with meat keywords in ingredients or description
            # This is a basic implementation. In production, use a tag system.
            query = query.filter(
                (Dish.name.ilike("%vegetariano%")) | 
                (Dish.description.ilike("%vegetariano%")) |
                (~Dish.ingredients.ilike("%carne%") & ~Dish.ingredients.ilike("%pollo%") & ~Dish.ingredients.ilike("%cerdo%") & ~Dish.ingredients.ilike("%pescado%"))
            )
        elif category == "Sin Gluten": # Sin Harina/Trigo
            query = query.filter(
                ~Dish.ingredients.ilike("%trigo%") & 
                ~Dish.ingredients.ilike("%harina%") & 
                ~Dish.ingredients.ilike("%pan%") &
                ~Dish.ingredients.ilike("%pasta%")
            )
        elif category == "Económico":
            query = query.filter(Dish.price <= 20000)
        # 'Recomendado' is default (no filter)
        elif category == "Pet Friendly":
             query = query.filter(Restaurant.is_pet_friendly == True)

    all_dishes = query.all()
    
    if not all_dishes:
        return []

    # 2. Prepare Data for ML Model
    # We need to create a DataFrame with the features expected by the model
    
    # Map User Preferences to Model Features
    regional_score_map = {"bajo": 1, "medio": 3, "alto": 5}
    user_regional_score = regional_score_map.get(user.regional_interest, 3)
    
    # Map Budget
    def map_budget(val):
        if not val: return "Medio"
        if val < 50000: return "Bajo"
        elif val < 150000: return "Medio"
        else: return "Alto"
    
    user_budget_range = map_budget(user.budget)

    # Use real user data
    user_gender = user.gender or "Femenino"
    user_country = user.country or "Colombia"
    user_age = user.age or 30
    user_tourist_type = user.tourist_type or "nacional"
    
    prediction_data = []
    
    for dish in all_dishes:
        # Calculate restaurant stats
        # In a real app, cache this or pre-calculate
        restaurant_dishes = dish.restaurant.dishes
        regional_count = sum(1 for d in restaurant_dishes if d.is_regional)
        
        row = {
            # User Features
            'genero': user_gender,
            'pais_origen': user_country,
            'tipo_turista': user_tourist_type,
            'rango_presupuesto': user_budget_range,
            'restricciones_alimenticias': user.restrictions or "Ninguna",
            'edad': user_age,
            'interes_platos_regionales_score': user_regional_score,
            'presupuesto_diario_cop': user.budget or 100000,
            
            # Restaurant/Dish Features
            'categoria_restaurante': dish.restaurant.cuisine_type or "Variada",
            'rango_precios': dish.restaurant.price_range or "$$",
            'es_regional': str(dish.is_regional),
            'precio_plato': dish.price or 20000,
            'origen_regional': str(dish.is_regional), # Approximation
            'platos_regionales_count': regional_count,
            
            # Context (Placeholders as we don't have real-time context yet)
            'zona': "Centro", 
            'tipo_negocio': "Restaurante",
            'motivo_visita': user.visit_motive or "Turismo",
            'acompanantes_visita': "Pareja", # Model doesn't use this but we keep for consistency
            'calificacion_promedio': dish.restaurant.rating or 4.0,
            'precio_promedio_plato': dish.price or 20000,
            'gasto_total': dish.price or 20000, # Proxy
            'tiempo_permanencia': 60.0,
            'satisfaccion_servicio': 5,
            'satisfaccion_comida': 5
        }
        prediction_data.append(row)
        
    # 3. Predict
    if model:
        try:
            df_predict = pd.DataFrame(prediction_data)
            
            # Ensure columns match model expectations (handle missing columns if any)
            # The model pipeline usually handles this, but we need to be careful
            
            predictions = model.predict(df_predict)
            
            # Post-processing: Apply regional interest penalty/bonus
            adjusted_predictions = []
            for i, (dish, pred) in enumerate(zip(all_dishes, predictions)):
                adjustment = 0
                if user.regional_interest == "bajo" and dish.is_regional:
                    adjustment = -2.0  # Penalize regional dishes for users with low interest
                elif user.regional_interest == "alto" and dish.is_regional:
                    adjustment = +1.5  # Bonus for regional dishes for users who love them
                elif user.regional_interest == "bajo" and not dish.is_regional:
                    adjustment = +1.0  # Bonus for non-regional for users with low interest
                adjusted_predictions.append(pred + adjustment)
            
            # Attach adjusted predictions to dishes
            scored_dishes = list(zip(all_dishes, adjusted_predictions))
            
            # Sort by predicted score (descending)
            scored_dishes.sort(key=lambda x: x[1], reverse=True)
            
            # Return top 10
            recommended_dishes = [item[0] for item in scored_dishes[:10]]
            print(f"User {user_id} ({user.regional_interest}): Top recommendations = {[d.name for d in recommended_dishes[:3]]}")
            return recommended_dishes
            
        except Exception as e:
            print(f"ML Prediction failed: {e}. Falling back to rule-based.")
            import traceback
            traceback.print_exc()
            # Fallback logic below
    
    # Fallback: Rule-Based Recommendation System (if model fails or is missing)
    scored_dishes = []
    for dish in all_dishes:
        score = 0
        if user.regional_interest == "alto" and dish.is_regional:
            score += 10
        elif user.regional_interest == "medio" and dish.is_regional:
            score += 5
        elif user.regional_interest == "bajo" and not dish.is_regional:
            score += 8  # Prefer international food
        elif user.regional_interest == "bajo" and dish.is_regional:
            score -= 5  # Penalize regional food
        if user.budget and dish.price <= user.budget:
            score += 5
        score += dish.rating * 2
        scored_dishes.append((dish, score))
    
    scored_dishes.sort(key=lambda x: x[1], reverse=True)
    return [item[0] for item in scored_dishes[:10]]

