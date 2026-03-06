"""
Centralized ML model loader — avoids loading the same .pkl twice.
"""
import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "modelo_hibrido_v1.pkl")

_model = None
_loaded = False


def get_model():
    """Return the cached ML model (or None if not found)."""
    global _model, _loaded
    if not _loaded:
        _loaded = True
        try:
            if os.path.exists(MODEL_PATH):
                _model = joblib.load(MODEL_PATH)
                print(f"ML model loaded from {MODEL_PATH}")
            else:
                print(f"ML model not found at {MODEL_PATH}")
        except Exception as e:
            print(f"Error loading ML model: {e}")
    return _model
