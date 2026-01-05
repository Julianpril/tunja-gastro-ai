from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import ml_routes, auth_routes, restaurants, dishes, recommendations, users, chat, itinerary
from backend.db.session import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:19006", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
app.include_router(dishes.router, prefix="/api/dishes", tags=["dishes"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(ml_routes.router, prefix="/api/ml", tags=["machine-learning"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(itinerary.router, prefix="/api/itinerary", tags=["itinerary"])

@app.get("/")
def read_root():
    return {"Hello": "Tunja Gastro AI"}
