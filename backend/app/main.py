from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import engine, Base

# In a real production setup, we would use Alembic for migrations.
# For this setup, we auto-create tables on startup.
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS - Allow all for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    with open("routes.txt", "w") as f:
        for route in app.routes:
            f.write(f"{route.methods} {route.path}\n")

@app.get("/")
def root():
    return {
        "message": "Recall AI API is running",
        "docs": f"{settings.API_V1_STR}/docs"
    }
