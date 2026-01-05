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

    prompt = f"""
    Actúa como un experto guía turístico y gastronómico de Tunja.
    Genera un itinerario detallado de {request.days} día(s) para este turista.
    
    {user_profile}

    Usa EXCLUSIVAMENTE la siguiente base de datos de restaurantes para las recomendaciones de comida:
    {context_summary[:50000]} 

    Formato de Respuesta (JSON estricto):
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
              "image": "https://placeholder.com/image.jpg"
            }
          ]
        }
      ]
    }
    
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
        
        if isinstance(itinerary_json, dict) and 'itinerary' in itinerary_json:
             return itinerary_json['itinerary']
        
        # Fallback if structure is different but valid json
        return itinerary_json

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating itinerary: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
