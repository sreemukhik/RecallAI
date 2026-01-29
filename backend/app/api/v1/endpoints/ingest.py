from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import database, security
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.embedding import EmbeddingService
from app.services.vector_store import VectorStore

router = APIRouter()

def simple_chunker(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Splits text into chunks of roughly 'chunk_size' characters.
    Includes 'overlap' characters from the previous chunk to maintain context.
    """
    if not text:
        return []
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        # Move forward, but step back by overlap amount
        start += chunk_size - overlap
    return chunks

@router.post("/", response_model=DocumentResponse)
async def ingest_document(
    doc_in: DocumentCreate,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Ingest a document: Store metadata in SQL, Embed content, Store vectors in Chroma.
    """
    # 1. Save Metadata & Raw Content to SQL
    doc_title = doc_in.title
    if not doc_title:
        # Generate title from first 50 chars of content
        doc_title = doc_in.content[:50].strip()
        if len(doc_in.content) > 50:
            doc_title += "..."

    db_doc = Document(
        title=doc_title,
        content=doc_in.content,
        user_id=current_user.id
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # 2. Chunk Text
    chunks = simple_chunker(doc_in.content)
    
    # 3. Generate Embeddings (CPU intensive, in prod offload to Celery)
    embeddings = EmbeddingService.embed_documents(chunks)
    
    
    # 4. Store in Vector DB with Isolation
    VectorStore.add_vectors(
        user_id=current_user.id,
        doc_id=db_doc.id,
        texts=chunks,
        embeddings=embeddings
    )
    
    return db_doc

@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Get all documents for the current user.
    """
    return db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()

@router.get("/stats")
def get_stats(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Get usage statistics for the user.
    """
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    
    total_memories = len(docs)
    last_upload = None
    if docs:
        # Sort by creation time to find the latest
        last_upload = max(doc.created_at for doc in docs)
        
    # Calculate storage size (approximate characters)
    # in a real app, you might track this in a separate column or table
    storage_bytes = sum(len(doc.content) for doc in docs)
    
    return {
        "stats": {
            "totalMemories": total_memories,
            "lastUpload": last_upload,
            "storageBytes": storage_bytes
        }
    }

@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Delete a document and its vectors.
    """
    db_doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete vectors first (or after, doesn't matter much)
    # Note: VectorStore.delete_document implementation needs to be checked
    VectorStore.delete_document(user_id=current_user.id, doc_id=doc_id)
    
    db.delete(db_doc)
    db.commit()
    return {"status": "success"}

@router.delete("/")
def delete_all_documents(
    current_user: User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Delete ALL documents and vectors for the current user.
    """
    # 1. Delete all vectors for this user
    VectorStore.delete_user_vectors(user_id=current_user.id)
    
    # 2. Delete all documents from SQL
    db.query(Document).filter(Document.user_id == current_user.id).delete()
    db.commit()
    
    return {"status": "success", "message": "All data deleted"}

