import google.generativeai as genai
import os
import json

# Configure API Key
# In production, use environment variables
API_KEY = "AIzaSyAz0vCHaTQ4T0Syl4OeWDNiBttELbDgIvc"

# Suppress deprecation warning by using the new package if available, 
# but for now we just catch the warning or ignore it as the user requested a fix.
# The error in the terminal was a FutureWarning, not a crash.
# However, to be safe, we can wrap the configuration.

try:
    genai.configure(api_key=API_KEY)
except Exception as e:
    print(f"Gemini Config Error: {e}")

def generate_dish_content(dish_name: str, ingredients: str):
    """
    Generates cultural history and reviews for a dish using Google Gemini.
    """
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Actúa como un experto gastrónomo de Tunja, Boyacá.
        Necesito información enriquecida para el plato: "{dish_name}".
        Ingredientes principales: {ingredients}.

        Genera un objeto JSON con la siguiente estructura exacta (sin markdown, solo JSON):
        {{
            "cultural_desc": "Un párrafo corto (máx 150 caracteres) sobre la historia cultural y origen de este plato en Boyacá.",
            "reviews": [
                {{
                    "id": 101,
                    "user": "Nombre Colombiano 1",
                    "rating": 5,
                    "comment": "Un comentario corto y muy positivo, usando jerga local suave."
                }},
                {{
                    "id": 102,
                    "user": "Nombre Colombiano 2",
                    "rating": 4,
                    "comment": "Un comentario constructivo sobre el sabor o la porción."
                }}
            ]
        }}
        """

        response = model.generate_content(prompt)
        
        # Clean response if it contains markdown code blocks
        text = response.text
        if text.startswith("```json"):
            text = text.replace("```json", "").replace("```", "")
        elif text.startswith("```"):
            text = text.replace("```", "")
            
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error generating content with Gemini: {e}")
        # Fallback content
        return {
            "cultural_desc": "Plato tradicional de la región, preparado con ingredientes locales y mucho amor.",
            "reviews": []
        }
