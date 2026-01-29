from fastapi import APIRouter
from app.api.v1.endpoints import auth, ingest, query

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# Ingest and Query endpoints are protected, handled inside them via Depends
api_router.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(query.router, prefix="/query", tags=["query"])
