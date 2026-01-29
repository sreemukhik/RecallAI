import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Recall AI"
    API_V1_STR: str = "/api/v1"
    
    # SECURITY - Change these in production!
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # DATABASE
    # Using SQLite for generic file-based approach as requested by "free constraints" and easy deployment
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./sql_app.db"
    
    # VECTOR STORE
    # Path where ChromaDB will persist data locally
    CHROMA_PERSIST_DIR: str = os.path.join(os.getcwd(), "chroma_db")
    
    # EMBEDDING MODEL
    # MiniLM is efficient and free
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    
    # LLM
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
