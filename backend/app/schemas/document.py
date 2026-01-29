from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentCreate(BaseModel):
    title: Optional[str] = None
    content: str 

class DocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True

class SearchQuery(BaseModel):
    query: str
    k: int = 5

class SearchResult(BaseModel):
    document_id: int
    score: float
    content_snippet: str
    metadata: dict

class AugmentedQueryResponse(BaseModel):
    answer: str
    sources: List[SearchResult]
