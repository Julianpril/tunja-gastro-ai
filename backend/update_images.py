import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.session import SessionLocal
from backend.models import Restaurant, Dish

# ── Real image URLs by food category ──────────────────────────────────
PLACEHOLDER = "https://via.placeholder.com"

# Restaurant images (dining / interior)
RESTAURANT_IMAGES = [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop",
]

# Dish category → image mapping (keywords are matched case-insensitively)
DISH_IMAGE_RULES = [
    # Soups
    (["cuchuco", "sopa", "crema", "ajiaco", "changua", "caldo", "sancocho", "consomé", "mondongo"],
     "https://images.unsplash.com/photo-1547592166-23acbe346499?q=80&w=800&auto=format&fit=crop"),
    # Grilled / fried meats
    (["fritanga", "chicharrón", "asado", "churrasco", "costilla", "punta", "carne", "lomo", "parrilla", "bbq", "cerdo", "pollo", "gallina"],
     "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop"),
    # Stews & casseroles
    (["cocido", "guiso", "estofado", "sudado", "pepitoria", "puchero"],
     "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop"),
    # Tamales / empanadas / wraps
    (["tamal", "envuelto", "empanada", "almojábana", "garulla", "rollo"],
     "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?q=80&w=800&auto=format&fit=crop"),
    # Arepas / breads
    (["arepa", "pan", "mogolla", "mantecada", "pan de bono", "buñuelo"],
     "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop"),
    # Rice dishes
    (["arroz", "rice"],
     "https://images.unsplash.com/photo-1536304929831-ee1ca9d44726?q=80&w=800&auto=format&fit=crop"),
    # Fish / seafood
    (["trucha", "pescado", "mojarra", "bagre", "tilapia", "mariscos"],
     "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop"),
    # Desserts / sweets
    (["postre", "dulce", "bocadillo", "arequipe", "obleas", "brevas", "merengón", "torta", "pastel", "flan", "natilla", "cuajada"],
     "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800&auto=format&fit=crop"),
    # Drinks
    (["chicha", "mazamorra", "masato", "aguapanela", "chocolate", "jugo", "limonada", "avena", "kumis"],
     "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=800&auto=format&fit=crop"),
    # Salads / vegetarian
    (["ensalada", "vegetariano", "vegano", "vegetal"],
     "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop"),
    # Beans
    (["fríjol", "frijol", "lenteja", "garbanzo"],
     "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=800&auto=format&fit=crop"),
    # Potatoes / tubers
    (["papa", "cubio", "ibia", "chugua", "rellena", "patacón"],
     "https://images.unsplash.com/photo-1518977676601-b53f82ber3ff?q=80&w=800&auto=format&fit=crop"),
]

# Default food image (generic plated dish)
DEFAULT_DISH_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop"


def _pick_dish_image(dish_name: str, ingredients: str = "") -> str:
    """Return a relevant image URL based on the dish name and ingredients."""
    text = f"{dish_name} {ingredients}".lower()
    for keywords, url in DISH_IMAGE_RULES:
        if any(kw in text for kw in keywords):
            return url
    return DEFAULT_DISH_IMAGE


def _pick_restaurant_image(index: int) -> str:
    return RESTAURANT_IMAGES[index % len(RESTAURANT_IMAGES)]


def update_images(db: Session | None = None):
    """Update all placeholder images in the database with real URLs.
    Can be called with an existing session or will create its own."""
    own_session = db is None
    if own_session:
        db = SessionLocal()

    updated_restaurants = 0
    updated_dishes = 0

    try:
        # Update Restaurants
        restaurants = db.query(Restaurant).all()
        for i, r in enumerate(restaurants):
            if not r.image_url or PLACEHOLDER in r.image_url:
                r.image_url = _pick_restaurant_image(i)
                updated_restaurants += 1

        # Update Dishes
        dishes = db.query(Dish).all()
        for d in dishes:
            if not d.image_url or PLACEHOLDER in d.image_url:
                d.image_url = _pick_dish_image(d.name, d.ingredients or "")
                updated_dishes += 1

        db.commit()
        print(f"Images updated: {updated_restaurants} restaurants, {updated_dishes} dishes.")
    except Exception as e:
        db.rollback()
        print(f"Error updating images: {e}")
    finally:
        if own_session:
            db.close()


if __name__ == "__main__":
    update_images()
