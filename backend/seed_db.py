import sys
import os
from sqlalchemy.orm import Session

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.session import SessionLocal
from backend.models import Restaurant, Dish, User

def seed_data():
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(Restaurant).first():
        print("Data already exists. Skipping seed.")
        db.close()
        return

    print("Seeding data...")

    # Create Restaurants
    r1 = Restaurant(
        name="Restaurante El Boyacense",
        description="Auténtica comida tradicional en el corazón de Tunja.",
        address="Calle 19 # 10-20, Centro",
        latitude=5.53528,
        longitude=-73.36778,
        rating=4.8,
        image_url="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
        price_range="$$",
        cuisine_type="Tradicional"
    )
    
    r2 = Restaurant(
        name="La Casona de Tunja",
        description="Ambiente colonial y los mejores platos de la región.",
        address="Carrera 9 # 20-15",
        latitude=5.53200,
        longitude=-73.36000,
        rating=4.5,
        image_url="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
        price_range="$$$",
        cuisine_type="Fusión"
    )

    r3 = Restaurant(
        name="Sabor de la Montaña",
        description="Platos típicos con ingredientes orgánicos.",
        address="Avenida Norte # 45-10",
        latitude=5.54000,
        longitude=-73.35000,
        rating=4.7,
        image_url="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop",
        price_range="$$",
        cuisine_type="Campestre"
    )

    db.add_all([r1, r2, r3])
    db.commit()
    
    # Refresh to get IDs
    db.refresh(r1)
    db.refresh(r2)
    db.refresh(r3)

    # Create Dishes
    d1 = Dish(
        restaurant_id=r1.id,
        name="Cuchuco de Trigo con Espinazo",
        description="Sopa espesa de trigo con espinazo de cerdo, habas y papas.",
        price=25000.0,
        image_url="https://images.unsplash.com/photo-1547592166-23acbe346499?q=80&w=800&auto=format&fit=crop",
        calories=600,
        is_regional=True,
        ingredients="Trigo, Espinazo de cerdo, Habas, Papa sabanera, Papa criolla",
        cultural_desc="Plato insignia de Boyacá, consumido tradicionalmente para recuperar fuerzas.",
        rating=4.9
    )

    d2 = Dish(
        restaurant_id=r2.id,
        name="Fritanga Boyacense",
        description="Picada con longaniza, morcilla, papa criolla y plátano maduro.",
        price=35000.0,
        image_url="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
        calories=850,
        is_regional=True,
        ingredients="Longaniza, Morcilla, Papa criolla, Plátano maduro, Arepa",
        cultural_desc="Comida festiva ideal para compartir en familia.",
        rating=4.7
    )

    d3 = Dish(
        restaurant_id=r3.id,
        name="Cocido Boyacense",
        description="Guiso con cubios, ibias, chuguas y diferentes tipos de carne.",
        price=30000.0,
        image_url="https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
        calories=500,
        is_regional=True,
        ingredients="Cubios, Ibias, Chuguas, Carne de res, Carne de cerdo, Pollo",
        cultural_desc="Herencia muisca que combina tubérculos andinos con carnes españolas.",
        rating=4.8
    )

    db.add_all([d1, d2, d3])
    db.commit()

    print("Data seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed_data()
