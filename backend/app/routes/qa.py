"""Q/A Assistant API routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from app.qa import process_query, get_sample_queries
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class QAQueryRequest(BaseModel):
    """Request model for Q/A queries."""
    query: str = Field(..., min_length=1, max_length=500, description="Natural language query about cryptocurrencies")


class QAResponse(BaseModel):
    """Response model for Q/A queries."""
    answer: str = Field(..., description="Generated answer to the query")
    intent: str = Field(..., description="Detected intent from the query")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score for intent detection")
    entities: Dict[str, Any] = Field(..., description="Extracted entities from the query")
    query: str = Field(..., description="Original query")


class SampleQueriesResponse(BaseModel):
    """Response model for sample queries."""
    samples: Dict[str, List[str]] = Field(..., description="Sample queries organized by intent type")


@router.post("/ask", response_model=QAResponse)
async def ask_question(request: QAQueryRequest) -> QAResponse:
    """
    Process a natural language query about cryptocurrencies.
    
    Args:
        request: QAQueryRequest containing the user's query
        
    Returns:
        QAResponse: Processed answer with metadata
        
    Raises:
        HTTPException: If query processing fails
    """
    try:
        logger.info(f"Processing Q/A query: {request.query}")
        
        # Process the query through the Q/A pipeline
        result = await process_query(request.query)
        
        # Create response
        response = QAResponse(
            answer=result["answer"],
            intent=result["intent"],
            confidence=result["confidence"],
            entities=result["entities"],
            query=request.query
        )
        
        logger.info(f"Q/A query processed successfully. Intent: {result['intent']}, Confidence: {result['confidence']:.2f}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing Q/A query: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your question. Please try again."
        )


@router.get("/samples", response_model=SampleQueriesResponse)
async def get_sample_queries_endpoint() -> SampleQueriesResponse:
    """
    Get sample queries for different intent types.
    
    Returns:
        SampleQueriesResponse: Sample queries organized by intent
    """
    try:
        samples = get_sample_queries()
        return SampleQueriesResponse(samples=samples)
    except Exception as e:
        logger.error(f"Error fetching sample queries: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching sample queries."
        )


@router.get("/health")
async def qa_health_check():
    """
    Health check endpoint for Q/A Assistant.
    
    Returns:
        dict: Health status
    """
    return {
        "status": "healthy",
        "service": "qa-assistant",
        "message": "Q/A Assistant is ready to process queries"
    }