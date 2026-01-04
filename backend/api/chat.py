from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import pandas as pd
import os
from typing import List, Optional

import logging

# Configure logging
logging.basicConfig(filename='chat_debug.log', level=logging.DEBUG)

router = APIRouter()

# Configure OpenAI API Key
API_KEY = "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"

# Load Data
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "data", "restaurantes_web_enriquecido_v2.csv")
restaurants_df = None
context_summary = ""

def load_data():
    global restaurants_df, context_summary
    try:
        if os.path.exists(DATA_PATH):
            restaurants_df = pd.read_csv(DATA_PATH)
            
            # Create a summary for the context
            # We select relevant columns to keep the context size manageable
            # Fill NaNs to avoid issues
            summary_df = restaurants_df[['nombre', 'tipo_negocio', 'especialidad', 'calificacion_promedio', 'rango_precio', 'menu_destacado', 'direccion_web', 'lat', 'lon']].fillna('')
            
            # Convert to string format for the LLM
            context_summary = summary_df.to_string(index=False)
            logging.info(f"Chat data loaded successfully. Length: {len(context_summary)}")
        else:
            logging.error(f"Data not found at {DATA_PATH}")
            context_summary = "No restaurant data available."
    except Exception as e:
        logging.error(f"Error loading chat data: {e}")
        context_summary = "Error loading restaurant data."

# Load data on module import
load_data()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        logging.info(f"Received chat request: {request.message}")
        
        # Construct messages for the LLM
        messages = [
            {"role": "system", "content": f"""
            Eres un experto asistente gastronómico y turístico para la ciudad de Tunja, Boyacá.
            Tu única fuente de verdad es la siguiente base de datos de restaurantes:
            
            {context_summary[:150000]} 
            
            REGLAS ESTRICTAS:
            1. NO inventes información. Si un restaurante o plato no está en la lista, di que no tienes información sobre ello.
            2. Si el usuario pregunta por un restaurante con un nombre similar (ej. error ortográfico), asume que se refiere al restaurante de la lista.
            3. NO recomiendes lugares que no estén en la lista proporcionada.
            4. Usa SOLO la información de las columnas: nombre, tipo_negocio, especialidad, calificacion_promedio, rango_precio, menu_destacado, direccion_web, lat, lon.
            5. Si te preguntan por un plato, busca coincidencias exactas o parciales en 'menu_destacado' o 'especialidad'.
            6. Si el usuario pregunta "¿dónde es?", "¿dónde queda?" o pide la ubicación, DEBES responder con un enlace a Google Maps usando las columnas 'lat' y 'lon' en este formato: [Ver en Google Maps](https://www.google.com/maps/search/?api=1&query={{lat}},{{lon}}).
            7. Sé amable y resalta la cultura boyacense, pero mantente fiel a los datos.
            8. Si te preguntan "quién eres", responde que eres el Asistente Gastro de Tunja.
            """}
        ]
        
        # Add conversation history if provided
        if request.history:
            for msg in request.history[-6:]:
                role = "user" if msg.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})

        # Call OpenAI API
        client = openai.OpenAI(api_key=API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        bot_reply = response.choices[0].message.content
        logging.info("Got response from OpenAI")
        return {"response": bot_reply}

    except Exception as e:
        logging.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
