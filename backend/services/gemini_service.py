import openai
import os
import json

# Configure API Key
# Ideally this should be in an env var
API_KEY = "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"

def generate_dish_content(dish_name: str, ingredients: str):
    """
    Generates cultural history and reviews for a dish using OpenAI (formerly Gemini).
    """
    try:
        client = openai.OpenAI(api_key=API_KEY)
        
        prompt = f"""
        Actúa como un experto gastrónomo de Tunja, Boyacá.
        Necesito información enriquecida para el plato: "{dish_name}".
        Ingredientes base conocidos: {ingredients}.

        Genera un objeto JSON con la siguiente estructura exacta (sin markdown, solo JSON):
        {{
            "cultural_desc": "Un párrafo detallado (aprox 300 caracteres) sobre la historia cultural, origen de este plato en Boyacá y por qué es típico.",
            "main_ingredients": "Lista detallada de ingredientes principales y secretos de la abuela.",
            "reviews": [
                {{
                    "id": 101,
                    "user": "María (Local)",
                    "rating": 5,
                    "comment": "Un comentario corto y muy positivo, usando jerga local suave (sumercé, etc)."
                }},
                {{
                    "id": 102,
                    "user": "Carlos (Turista)",
                    "rating": 4,
                    "comment": "Un comentario constructivo sobre el sabor o la porción."
                }}
            ]
        }}
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un asistente experto en gastronomía boyacense que responde en JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        print(f"AI Content Generation Error: {e}")
        # Fallback content
        return {
            "cultural_desc": f"El {dish_name} es un plato tradicional de la región, preparado con ingredientes locales y mucho amor.",
            "main_ingredients": ingredients,
            "reviews": []
        }
