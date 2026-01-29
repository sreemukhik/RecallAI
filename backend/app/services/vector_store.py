import chromadb
import uuid
from typing import List, Dict, Any
from app.core.config import settings

class VectorStore:
    _client = None
    _collection = None

    @classmethod
    def get_collection(cls):
        if cls._client is None:
            # Persistent storage for production/dev
            cls._client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            cls._collection = cls._client.get_or_create_collection(
                name="user_memories",
                metadata={"hnsw:space": "cosine"}
            )
        return cls._collection
        
    @staticmethod
    def add_vectors(
        user_id: int, 
        doc_id: int, 
        texts: List[str], 
        embeddings: List[List[float]]
    ):
        collection = VectorStore.get_collection()
        
        count = len(texts)
        if count == 0:
            return

        # Generate unique IDs for chunks: user_doc_chunkUUID
        ids = [f"{user_id}_{doc_id}_{uuid.uuid4()}" for _ in range(count)]
        
        # KEY: Metadata contains user_id for filtering
        metadatas = [
            {"user_id": user_id, "doc_id": doc_id, "chunk_index": i} 
            for i in range(count)
        ]
        
        collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
    @staticmethod
    def search(user_id: int, query_vector: List[float], k: int = 5) -> Dict[str, Any]:
        """
        Search with STRICT user_id filtering.
        """
        collection = VectorStore.get_collection()
        
        # ChromaDB syntax for filtering: where={"metadata_field": value}
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=k,
            where={"user_id": user_id}, # <--- PRIVACY ENFORCEMENT
            include=["documents", "metadatas", "distances"]
        )
        return results

    @staticmethod
    def delete_document(user_id: int, doc_id: int):
        collection = VectorStore.get_collection()
        # Delete where user_id AND doc_id match
        collection.delete(
            where={"$and": [{"user_id": user_id}, {"doc_id": doc_id}]}
        )

    @staticmethod
    def delete_user_vectors(user_id: int):
        """
        Delete ALL vectors for a specific user.
        """
        collection = VectorStore.get_collection()
        collection.delete(
            where={"user_id": user_id}
        )
