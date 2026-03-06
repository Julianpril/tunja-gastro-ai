import sys
import os
import pandas as pd
import json
import ast
import numpy as np
from sqlalchemy.orm import Session

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.db.session import SessionLocal
from backend.models import Restaurant, Dish
from backend.update_images import _pick_dish_image, _pick_restaurant_image

def clean_price(price_val):
    if pd.isna(price_val) or price_val is None:
        return 20000.0 # Default
    try:
        return float(price_val)
    except:
        return 20000.0

def clean_rating(rating_val):
    if pd.isna(rating_val) or rating_val is None:
        return 4.0
    try:
        return float(rating_val)
    except:
        return 4.0

def import_data():
    db = SessionLocal()
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "ml", "data", "restaurantes_web_enriquecido_v2.csv")
    
    print(f"Reading CSV from: {csv_path}")
    df = pd.read_csv(csv_path)
    
    print(f"Found {len(df)} restaurants to process.")

    for index, row in df.iterrows():
        # 1. Create/Update Restaurant
        restaurant_name = row['nombre']
        
        # Check if exists
        restaurant = db.query(Restaurant).filter(Restaurant.name == restaurant_name).first()
        
        if not restaurant:
            print(f"Creating Restaurant: {restaurant_name}")
            restaurant = Restaurant(
                name=restaurant_name,
                description=f"Restaurante especializado en {row.get('especialidad', 'comida variada')}.",
                address=f"{row.get('zona', 'Tunja')}", # Address not always in CSV, using Zona
                latitude=row.get('lat', 0.0),
                longitude=row.get('lon', 0.0),
                rating=clean_rating(row.get('calificacion_promedio')),
                image_url=_pick_restaurant_image(index),
                price_range=row.get('rango_precio', '$$'),
                cuisine_type=row.get('especialidad', 'Variada'),
                is_pet_friendly=str(row.get('PetFriendly', 'no')).lower() in ['si', 'true', 'yes']
            )
            db.add(restaurant)
            db.commit()
            db.refresh(restaurant)
        else:
            print(f"Updating Restaurant: {restaurant_name}")
            # Update fields if needed
            restaurant.rating = clean_rating(row.get('calificacion_promedio'))
            restaurant.is_pet_friendly = str(row.get('PetFriendly', 'no')).lower() in ['si', 'true', 'yes']
            db.commit()

        # 2. Process Dishes from 'menu_detallado'
        menu_json_str = row.get('menu_detallado')
        
        if pd.isna(menu_json_str):
            continue
            
        try:
            # The CSV might have single quotes or be a string representation of a dict
            # ast.literal_eval is safer than eval
            if isinstance(menu_json_str, str):
                menu_data = json.loads(menu_json_str.replace("'", '"').replace('None', 'null').replace('False', 'false').replace('True', 'true'))
            else:
                continue
                
            for dish_name, dish_info in menu_data.items():
                # Check if dish exists
                dish = db.query(Dish).filter(Dish.restaurant_id == restaurant.id, Dish.name == dish_name).first()
                
                ingredients_list = dish_info.get('ingredientes', [])
                ingredients_str = ", ".join(ingredients_list) if isinstance(ingredients_list, list) else str(ingredients_list)
                
                if not dish:
                    # print(f"  - Adding Dish: {dish_name}")
                    new_dish = Dish(
                        restaurant_id=restaurant.id,
                        name=dish_name,
                        description=dish_info.get('descripcion', f"Delicioso plato de {dish_name}"),
                        price=clean_price(dish_info.get('precio')),
                        image_url=_pick_dish_image(dish_name, ingredients_str),
                        calories=int(dish_info.get('calorias', 0) or 0),
                        is_regional=bool(dish_info.get('origen_regional', False)),
                        ingredients=ingredients_str,
                        cultural_desc=dish_info.get('descripcion', ""), # Using desc as cultural desc for now
                        rating=restaurant.rating # Inherit restaurant rating as baseline
                    )
                    db.add(new_dish)
                else:
                    # Update existing dish
                    dish.ingredients = ingredients_str
                    dish.is_regional = bool(dish_info.get('origen_regional', False))
                    dish.price = clean_price(dish_info.get('precio'))
        
            db.commit()
            
        except Exception as e:
            print(f"Error processing menu for {restaurant_name}: {e}")
            # print(f"Problematic JSON: {menu_json_str[:100]}...")

    print("Import completed successfully!")
    db.close()

if __name__ == "__main__":
    import_data()
