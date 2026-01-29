import hashlib
import numpy as np
from typing import List

class EmbeddingService:
    """
    Simple hash-based embedding service as fallback.
    Generates consistent 384-dimensional vectors from text.
    """
    
    @staticmethod
    def _text_to_embedding(text: str) -> List[float]:
        """Convert text to a 384-dim embedding using multiple hash functions"""
        # Use multiple hash seeds to create a 384-dimensional vector
        embedding = []
        for seed in range(12):  # 12 seeds * 32 values = 384 dimensions
            hash_input = f"{seed}:{text}".encode('utf-8')
            hash_bytes = hashlib.sha256(hash_input).digest()
            # Convert bytes to 32 float values between -1 and 1
            for i in range(0, 32):
                val = (hash_bytes[i % len(hash_bytes)] / 255.0) * 2 - 1
                embedding.append(val)
        
        # Normalize to unit vector
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = [x / norm for x in embedding]
        
        return embedding

    @staticmethod
    def embed_query(text: str) -> List[float]:
        """Single text embedding"""
        return EmbeddingService._text_to_embedding(text)

    @staticmethod
    def embed_documents(texts: List[str]) -> List[List[float]]:
        """Batch embedding"""
        return [EmbeddingService._text_to_embedding(text) for text in texts]
