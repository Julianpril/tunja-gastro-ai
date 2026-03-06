"""
Centralized CSV data loader — avoids loading the same DataFrame twice
in chat.py and itinerary.py.
"""
import os
import logging
import pandas as pd

logger = logging.getLogger(__name__)

DATA_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml", "data", "restaurantes_web_enriquecido_v2.csv"
)

_restaurants_df: pd.DataFrame | None = None
_context_summary: str = ""
_loaded: bool = False


def _load():
    global _restaurants_df, _context_summary, _loaded
    if _loaded:
        return
    _loaded = True
    try:
        if os.path.exists(DATA_PATH):
            _restaurants_df = pd.read_csv(DATA_PATH)
            cols = [
                "nombre", "tipo_negocio", "especialidad",
                "calificacion_promedio", "rango_precio",
                "menu_destacado", "direccion_web", "lat", "lon",
            ]
            existing_cols = [c for c in cols if c in _restaurants_df.columns]
            summary_df = _restaurants_df[existing_cols].fillna("")
            _context_summary = summary_df.to_string(index=False)
            logger.info("Restaurant CSV loaded (%d rows)", len(_restaurants_df))
        else:
            logger.error("CSV not found at %s", DATA_PATH)
            _context_summary = "No restaurant data available."
    except Exception as e:
        logger.error("Error loading restaurant CSV: %s", e)
        _context_summary = "Error loading restaurant data."


def get_restaurants_df() -> pd.DataFrame | None:
    _load()
    return _restaurants_df


def get_context_summary() -> str:
    _load()
    return _context_summary
