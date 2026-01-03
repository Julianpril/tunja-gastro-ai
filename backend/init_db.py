import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import os

# Add the parent directory to sys.path to allow imports from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.session import engine, Base
from backend.models import User, Restaurant, Dish, Review, Itinerary, ItineraryItem, ChatMessage

def create_database():
    # Connect to default postgres database to create new db
    try:
        # User: postgres, Password: 2502
        con = psycopg2.connect(user="postgres", password="2502", host="localhost", port="5432", dbname="postgres")
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = con.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'gastronomicAI'")
        exists = cursor.fetchone()
        
        if not exists:
            print("Creating database gastronomicAI...")
            cursor.execute("CREATE DATABASE \"gastronomicAI\"")
            print("Database created.")
        else:
            print("Database gastronomicAI already exists.")
            
        cursor.close()
        con.close()
    except Exception as e:
        print(f"Error creating database: {e}")

def create_tables():
    print("Creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    create_database()
    create_tables()
