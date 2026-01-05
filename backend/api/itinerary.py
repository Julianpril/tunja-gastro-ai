from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import openai
import pandas as pd
import os
import json
from backend.db.session import get_db
from backend.models import User

router = APIRouter()

# Reuse the API Key from chat.py or config
# Ideally this should be in an env var, but for now we use the one provided in context
API_KEY = "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"

# Load Data (Same as chat.py)
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "data", "restaurantes_web_enriquecido_v2.csv")
context_summary = ""

def load_data():
    global context_summary
    try:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH)
            # Select relevant columns
            summary_df = df[['nombre', 'tipo_negocio', 'especialidad', 'calificacion_promedio', 'rango_precio', 'menu_destacado', 'lat', 'lon']].fillna('')
            context_summary = summary_df.to_string(index=False)
    except Exception as e:
        print(f"Error loading data for itinerary: {e}")

load_data()

class ItineraryRequest(BaseModel):
    days: int = 1

@router.post("/generate/{user_id}")
async def generate_itinerary(user_id: int, request: ItineraryRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Construct User Profile Text
    user_profile = f"""
    Perfil del Turista:
    - Presupuesto: {user.budget or 'Medio'}
    - Interés Regional: {user.regional_interest or 'Medio'}
    - Restricciones: {user.restrictions or 'Ninguna'}
    - Motivo de Visita: {user.visit_motive or 'Turismo'}
    - Acompañantes: {user.group_size or 1} personas
    """

    # Build prompt without f-string for JSON example to avoid escaping issues
    json_example = '''
    {
      "itinerary": [
        {
          "day": 1,
          "activities": [
            {
              "time": "09:00 AM",
              "type": "Desayuno",
              "title": "Nombre del Lugar o Plato",
              "description": "Breve descripción de por qué es buena opción",
              "image_search": "colombian breakfast arepa coffee"
            }
          ]
        }
      ]
    }
    '''
    
    prompt = f"""
    Actúa como un experto guía turístico y gastronómico de Tunja.
    Genera un itinerario detallado de {request.days} día(s) para este turista.
    
    {user_profile}

    Usa EXCLUSIVAMENTE la siguiente base de datos de restaurantes para las recomendaciones de comida:
    {context_summary[:50000]} 

    INSTRUCCIONES PARA IMÁGENES:
    - NO uses "image", usa "image_search" con términos de búsqueda en inglés para Unsplash
    - Los términos deben describir el plato o lugar específico (ej: "colombian soup wheat pork" para cuchuco)
    - Usa 3-5 palabras clave relevantes en inglés
    
    Formato de Respuesta (JSON estricto):
    {json_example}
    
    Asegúrate de que el JSON sea válido. No incluyas texto fuera del JSON.
    """

    try:
        print(f"Generating itinerary for user {user_id}")
        print(f"User profile: Budget={user.budget}, Interest={user.regional_interest}")
        
        if not context_summary:
            print("WARNING: context_summary is empty! Attempting to reload...")
            load_data()
            if not context_summary:
                print("ERROR: Failed to load context_summary.")
                raise HTTPException(status_code=500, detail="Server configuration error: Data not loaded")

        client = openai.OpenAI(api_key=API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un asistente que genera itinerarios turísticos en formato JSON. La respuesta debe ser un objeto JSON con la clave 'itinerary'."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        print(f"OpenAI Response: {content[:100]}...") # Log first 100 chars

        # Clean markdown if present
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "")
        elif content.startswith("```"):
            content = content.replace("```", "")
            
        itinerary_json = json.loads(content)
        
        # Post-process: Convert image_search terms to Unsplash URLs
        def search_to_unsplash_url(search_terms, activity_type="", title=""):
            """Convert search terms to Unsplash Source URL (free, no API key needed)"""
            import urllib.parse
            
            # Use provided search terms, or generate from activity/title
            if search_terms and isinstance(search_terms, str) and len(search_terms) > 2:
                query = search_terms
            else:
                # Fallback: generate terms from activity type and title
                activity_type = (activity_type or "").lower()
                title_lower = (title or "").lower()
                
                if "desayuno" in activity_type:
                    query = "colombian breakfast arepa coffee"
                elif "almuerzo" in activity_type:
                    if "cuchuco" in title_lower:
                        query = "colombian wheat soup traditional"
                    elif "cocido" in title_lower or "sancocho" in title_lower:
                        query = "colombian stew meat vegetables"
                    else:
                        query = "colombian lunch traditional food"
                elif "cena" in activity_type:
                    query = "dinner restaurant elegant food"
                elif "café" in activity_type or "onces" in activity_type or "snack" in activity_type:
                    query = "colombian coffee pastry bakery"
                elif "cultural" in activity_type or "visita" in activity_type or "tour" in activity_type:
                    query = "colombia colonial architecture church"
                else:
                    query = "colombian restaurant food traditional"
            
            # Clean and encode the query
            query = query.strip().replace("  ", " ")
            encoded_query = urllib.parse.quote(query)
            
            # Use Unsplash Source (redirects to a random matching image)
            # Format: https://source.unsplash.com/800x600/?query
            return f"https://source.unsplash.com/800x600/?{encoded_query}"
        
        def fix_itinerary_images(itinerary_data):
            """Convert image_search to real Unsplash URLs"""
            if isinstance(itinerary_data, list):
                for day in itinerary_data:
                    if isinstance(day, dict) and 'activities' in day:
                        for activity in day['activities']:
                            if isinstance(activity, dict):
                                # Get search terms from AI response
                                search_terms = activity.pop('image_search', None)
                                
                                # Also check if there's an existing invalid image
                                existing_img = activity.get('image', '')
                                
                                if not existing_img or 'placeholder' in existing_img.lower() or not existing_img.startswith('http'):
                                    activity['image'] = search_to_unsplash_url(
                                        search_terms,
                                        activity.get('type', ''), 
                                        activity.get('title', '')
                                    )
            return itinerary_data
        
        if isinstance(itinerary_json, dict) and 'itinerary' in itinerary_json:
            fixed_itinerary = fix_itinerary_images(itinerary_json['itinerary'])
            return fixed_itinerary
        
        # Fallback if structure is different but valid json
        return fix_itinerary_images(itinerary_json) if isinstance(itinerary_json, list) else itinerary_json

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating itinerary: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
