from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import pandas as pd
import numpy as np
from backend.db.session import get_db
from backend.models import Dish, User, Restaurant
from backend.schemas import DishResponse
from backend.services.ml_model import get_model

router = APIRouter()

# Complete list of non-vegetarian ingredient/name keywords
MEAT_KEYWORDS = [
    "carne", "pollo", "cerdo", "pescado", "gallina", "chicharr",
    "longaniza", "tocino", "salchicha", "chorizo", "jamón", "jamon",
    "alitas", "camarón", "camaron", "camarones", "marisco", "mariscos",
    "pulpo", "costilla", "lomo", "pechuga", "bondiola", "espinazo",
    "sobrebarriga", "desmechada", "chuleta", "cordero", "pavo",
    "atún", "atun", "salmón", "salmon", "langostino", "cangrejo",
    "mojarra", "trucha", "róbalo", "robalo", "morcilla", "hamburguesa",
    "nugget", "perro caliente", "hot dog", "steak",
    "filete", "solomillo", "ridículo",
]

# Additional patterns that need word-boundary matching (e.g. "res" as standalone)
MEAT_BOUNDARY_PATTERNS = [
    "% res,%", "% res %", "%de res%", "%res,%", "res,%",
    "%(res)%", "%(res %",
]

def _apply_no_meat_filter(query):
    """Filter out dishes containing meat/fish/seafood in ingredients, name, or description."""
    conditions = []
    for kw in MEAT_KEYWORDS:
        conditions.append(~Dish.ingredients.ilike(f"%{kw}%"))
        conditions.append(~Dish.name.ilike(f"%{kw}%"))
        conditions.append(~Dish.description.ilike(f"%{kw}%"))
    # Word-boundary patterns for short words like "res"
    for pattern in MEAT_BOUNDARY_PATTERNS:
        conditions.append(~Dish.ingredients.ilike(pattern))
    return query.filter(and_(*conditions))


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
        query = _apply_no_meat_filter(query)
    if "gluten" in user_restrictions or "celiaco" in user_restrictions:
        query = query.filter(
            ~Dish.ingredients.ilike("%trigo%") & 
            ~Dish.ingredients.ilike("%harina%") & 
            ~Dish.ingredients.ilike("%pan,%") &
            ~Dish.ingredients.ilike("%pasta%")
        )
    
    # Apply Category Filters (UI selection)
    if category:
        if category == "Regionales":
            query = query.filter(Dish.is_regional == True)
        elif category == "Sin Carne":
            query = _apply_no_meat_filter(query)
        elif category == "Sin Gluten":
            query = query.filter(
                ~Dish.ingredients.ilike("%trigo%") & 
                ~Dish.ingredients.ilike("%harina%") & 
                ~Dish.ingredients.ilike("%pan,%") &
                ~Dish.ingredients.ilike("%pasta%")
            )
        elif category == "Económico":
            query = query.filter(Dish.price <= 20000)
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
        # Calcular agregados del restaurante para cada plato
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
            
            # Variables del plato/restaurante
            'categoria_restaurante': dish.restaurant.cuisine_type or "Variada",
            'rango_precios': dish.restaurant.price_range or "$$",
            'es_regional': str(dish.is_regional),
            'precio_plato': dish.price or 20000,
            'origen_regional': str(dish.is_regional), # Approximation
            'platos_regionales_count': regional_count,
            
            # Contexto de sesión (valores estáticos por ausencia de señal en tiempo real)
            'zona': "Centro", 
            'tipo_negocio': "Restaurante",
            'motivo_visita': user.visit_motive or "Turismo",
            'acompanantes_visita': "Pareja", # Model doesn't use this but we keep for consistency
            'calificacion_promedio': dish.restaurant.rating or 4.0,
            'precio_promedio_plato': dish.price or 20000,
            'gasto_total': dish.price or 20000, # Proxy
            'tiempo_permanencia': 60.0,
            'satisfaccion_servicio': 5,
            'satisfaccion_comida': 5,
            # Features de interacción alineadas con el pipeline de entrenamiento
            'interes_regional_match': user_regional_score * (1.0 if dish.is_regional else 0.0),
            'price_budget_ratio': (dish.price or 20000) / max(user.budget or 100000, 1),
        }
        prediction_data.append(row)
        
    # 3. Predict
    model = get_model()
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
            
            # Deduplicar por nombre de plato; conservar la opción con mejor score
            seen_dish_names = set()
            unique_dishes = []
            for dish, score in scored_dishes:
                # Normalize dish name for comparison (lowercase, strip whitespace)
                dish_name_normalized = dish.name.lower().strip()
                if dish_name_normalized not in seen_dish_names:
                    seen_dish_names.add(dish_name_normalized)
                    unique_dishes.append(dish)
                    if len(unique_dishes) >= 10:
                        break
            
            print(f"User {user_id} ({user.regional_interest}): Top recommendations = {[d.name for d in unique_dishes[:3]]}")
            return unique_dishes
            
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
    
    # Deduplicar por nombre para evitar variantes repetidas
    seen_dish_names = set()
    unique_dishes = []
    for dish, score in scored_dishes:
        dish_name_normalized = dish.name.lower().strip()
        if dish_name_normalized not in seen_dish_names:
            seen_dish_names.add(dish_name_normalized)
            unique_dishes.append(dish)
            if len(unique_dishes) >= 10:
                break
    
    return unique_dishes

