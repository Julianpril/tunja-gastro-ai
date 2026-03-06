from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
import openai
from typing import List, Optional
import logging
from sqlalchemy.orm import Session

from backend.core.config import OPENAI_API_KEY
from backend.services.data_loader import get_context_summary
from backend.db.session import get_db
from backend.models.chat import ChatMessage

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str

class ChatHistoryItem(BaseModel):
    id: int
    message: str
    is_user: bool
    timestamp: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/history/{user_id}", response_model=List[ChatHistoryItem])
def get_chat_history(user_id: int, limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    msgs = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.timestamp.asc()).limit(limit).all()
    return [
        ChatHistoryItem(
            id=m.id, message=m.message, is_user=m.is_user,
            timestamp=m.timestamp.isoformat() if m.timestamp else None
        ) for m in msgs
    ]

@router.delete("/history/{user_id}")
def clear_chat_history(user_id: int, db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.commit()
    return {"message": "Chat history cleared"}

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        logger.info("Received chat request: %s", request.message[:120])
        context_summary = get_context_summary()
        
        # Construct messages for the LLM
        messages = [
            {"role": "system", "content": f"""
            Eres un experto asistente gastronómico y turístico para la ciudad de Tunja, Boyacá.
            Tu única fuente de verdad es la siguiente base de datos de restaurantes:
            
            {context_summary[:80000]} 
            
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
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        bot_reply = response.choices[0].message.content
        logger.info("Got response from OpenAI")

        # Persist messages to DB if user_id provided
        if request.user_id:
            try:
                user_msg = ChatMessage(user_id=request.user_id, message=request.message, is_user=True)
                bot_msg = ChatMessage(user_id=request.user_id, message=bot_reply, is_user=False)
                db.add(user_msg)
                db.add(bot_msg)
                db.commit()
            except Exception as pe:
                logger.warning("Failed to persist chat: %s", pe)

        return {"response": bot_reply}

    except Exception as e:
        logger.error("Error in chat endpoint: %s", e)
        raise HTTPException(status_code=500, detail="Error al procesar tu mensaje. Intenta de nuevo.")
