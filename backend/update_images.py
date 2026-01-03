import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.session import SessionLocal
from backend.models import Restaurant, Dish

def update_images():
    db = SessionLocal()
    
    print("Updating images to real URLs...")

    # Update Restaurants
    restaurants = db.query(Restaurant).all()
    for r in restaurants:
        if "Boyacense" in r.name:
            r.image_url = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop"
        elif "Casona" in r.name:
            r.image_url = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
        else:
            r.image_url = "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop"
    
    # Update Dishes
    dishes = db.query(Dish).all()
    for d in dishes:
        if "Cuchuco" in d.name:
            d.image_url = "https://i.pinimg.com/736x/8a/cc/b5/8accb5f4c540da11504990928701021d.jpg" # Keeping this one if valid, or replace
            # Let's use a generic soup image from unsplash as fallback if pinimg fails
            d.image_url = "https://images.unsplash.com/photo-1547592166-23acbe346499?q=80&w=2071&auto=format&fit=crop"
        elif "Fritanga" in d.name:
            d.image_url = "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop" # BBQ style
        elif "Cocido" in d.name:
            d.image_url = "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=2072&auto=format&fit=crop" # Stew
        else:
            d.image_url = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"

    db.commit()
    print("Images updated successfully.")
    db.close()

if __name__ == "__main__":
    update_images()
