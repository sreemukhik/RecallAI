from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import database, security
from app.core.config import settings
from app.models.user import User
from app.schemas.document import SearchQuery, SearchResult, AugmentedQueryResponse
from app.services.embedding import EmbeddingService
from app.services.vector_store import VectorStore

router = APIRouter()

@router.post("/", response_model=AugmentedQueryResponse)
async def search_memory(
    query: SearchQuery,
    current_user: User = Depends(security.get_current_user),
):
    """
    Semantic search over the user's private memory.
    Strictly isolated to 'current_user' data.
    """
    # 1. Embed Query
    print(f"QUERY RECEIVED: {query.query}")
    query_vector = EmbeddingService.embed_query(query.query)
    
    # 2. Search Vector DB (Restricted to user_id)
    results = VectorStore.search(
        user_id=current_user.id,
        query_vector=query_vector,
        k=query.k
    )
    
    # 3. Format Response
    # Chroma returns lists of lists (batch format). We sent 1 query, so take index 0.
    formatted_results = []
    
    # Handle empty results gracefully
    if results['ids'] and len(results['ids'][0]) > 0:
        ids = results['ids'][0]
        distances = results['distances'][0]
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]

        for i in range(len(ids)):
            formatted_results.append(SearchResult(
                document_id=metadatas[i]['doc_id'],
                score=distances[i], 
                content_snippet=documents[i],
                metadata=metadatas[i]
            ))
            
    # 4. Generate Answer with Groq
    # Check if API key is set
    if not settings.GROQ_API_KEY:
         return AugmentedQueryResponse(
             answer="Groq API Key not set. Returning search results only.",
             sources=formatted_results
         )

    # Prepare Context
    if not formatted_results:
        return AugmentedQueryResponse(
            answer="I couldn't find any relevant memories matching your query.",
            sources=[]
        )
        
    context_str = "\n\n".join([f"Memory {i+1}:\n{res.content_snippet}" for i, res in enumerate(formatted_results)])
    
    system_prompt = """You are RecallAI, a helpful memory assistant. 
Answer the user's question based ONLY on the provided Context from their memories. 
If the answer is not in the context, strictly say "I don't recall that information based on your stored memories." and do not hallucinate.
Keep answers concise and friendly."""
    
    user_prompt = f"""Context:
{context_str}

User Question: {query.query}
"""

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=500
        )
        answer = chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        import traceback
        traceback.print_exc()
        answer = f"I found some memories, but I couldn't generate a summary right now. Error: {str(e)}"

    return AugmentedQueryResponse(
        answer=answer,
        sources=formatted_results
    )
