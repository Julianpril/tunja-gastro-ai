from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import os

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "modelo_hibrido_v1.pkl")
model = None

def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print("Model loaded successfully")
        else:
            print(f"Model not found at {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")

class PredictionInput(BaseModel):
    genero: str
    pais_origen: str
    rango_presupuesto: str
    categoria_restaurante: str
    rango_precios: str
    es_regional: str
    zona: str
    tipo_negocio: str
    motivo_visita: str
    acompanantes_visita: str
    edad: int
    interes_platos_regionales_score: int
    calificacion_promedio: float
    precio_promedio_plato: int
    gasto_total: float
    tiempo_permanencia: float
    satisfaccion_servicio: int
    satisfaccion_comida: int

@router.on_event("startup")
async def startup_event():
    load_model()

@router.post("/predict")
def predict(input_data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    data_dict = input_data.dict()
    # Convert boolean string to boolean if necessary, though pydantic handles types.
    # The model expects specific types.
    
    df = pd.DataFrame([data_dict])
    
    try:
        prediction = model.predict(df)
        return {"predicted_rating": float(prediction[0])}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
