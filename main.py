from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pdfplumber
import os
from typing import Optional
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import LangChain components
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException

# Initialize FastAPI app
app = FastAPI(title="Fact-Checking Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM
llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.getenv("OPENAI_API_KEY"),
    temperature=0.7
)

# Response model for fact-check results
class FactCheckResult(BaseModel):
    claim: str
    status: str  # Verified, Inaccurate, False
    explanation: str
    correct_value: Optional[str] = None
    source: str


def extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from uploaded PDF file."""
    try:
        with pdfplumber.open(file.file) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting PDF: {str(e)}")


def extract_claims(text: str) -> list[str]:
    """Use LangChain to extract verifiable claims from text."""
    extraction_prompt = PromptTemplate(
        input_variables=["text"],
        template="""Analyze the following text and extract ONLY verifiable factual claims.
        
Verifiable claims include:
- Statistics and numerical data
- Dates and historical facts
- Financial figures
- Technical specifications
- Named entities with concrete facts

DO NOT include:
- Opinions
- Predictions
- Subjective statements
- General descriptions

Return a JSON array of claims. Each claim should be a single, concise statement with exact numbers/dates.
Format: {{"claims": ["claim1", "claim2", ...]}}

Text:
{text}

Return ONLY valid JSON, no additional text."""
    )

    chain = extraction_prompt | llm | JsonOutputParser()
    
    try:
        result = chain.invoke({"text": text[:3000]})  # Limit text to avoid token issues
        return result.get("claims", [])
    except Exception as e:
        print(f"Error extracting claims: {str(e)}")
        return []


async def verify_claim_with_tavily(claim: str) -> dict:
    """Verify a claim using Tavily API for live web search."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        raise HTTPException(status_code=500, detail="TAVILY_API_KEY not configured")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": tavily_api_key,
                    "query": claim,
                    "include_answer": True,
                    "max_results": 5
                },
                timeout=10.0
            )
            search_results = response.json()
    except Exception as e:
        print(f"Tavily search error: {str(e)}")
        return {
            "status": "False",
            "explanation": "Unable to verify - search service unavailable",
            "source": "N/A"
        }

    verification_prompt = PromptTemplate(
        input_variables=["claim", "search_results"],
        template="""You are a fact-checking expert. Analyze this claim against the provided search results.

Claim: {claim}

Search Results:
{search_results}

Based on the search results, determine:
1. Status: Is the claim "Verified" (matches authoritative data), "Inaccurate" (outdated or partially wrong), or "False" (no credible evidence)?
2. Explanation: Brief explanation of your reasoning
3. Correct Value: If inaccurate, provide the correct/current value. Otherwise null.
4. Source: A brief citation from the search results

Return ONLY this JSON format:
{{
  "status": "Verified|Inaccurate|False",
  "explanation": "explanation here",
  "correct_value": "value or null",
  "source": "source citation"
}}"""
    )

    search_text = "\n".join([f"- {r.get('title', '')}: {r.get('snippet', '')}" for r in search_results.get("results", [])])
    if search_results.get("answer"):
        search_text = f"Direct Answer: {search_results['answer']}\n\n{search_text}"

    chain = verification_prompt | llm | JsonOutputParser()
    
    try:
        verification = chain.invoke({
            "claim": claim,
            "search_results": search_text
        })
        return verification
    except Exception as e:
        print(f"Verification error: {str(e)}")
        return {
            "status": "False",
            "explanation": "Unable to verify claim",
            "source": "Error during verification"
        }


@app.post("/fact-check", response_model=list[FactCheckResult])
async def fact_check(file: UploadFile = File(...)):
    """
    Main endpoint: Accept PDF, extract claims, verify against live web data.
    
    Returns: List of fact-check results with status, explanation, and sources.
    """
    
    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    # Extract text from PDF
    text = extract_text_from_pdf(file)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text found in PDF")

    # Extract verifiable claims
    claims = extract_claims(text)
    if not claims:
        return []

    # Verify each claim
    results = []
    for claim in claims:
        verification = await verify_claim_with_tavily(claim)
        result = FactCheckResult(
            claim=claim,
            status=verification.get("status", "False"),
            explanation=verification.get("explanation", ""),
            correct_value=verification.get("correct_value"),
            source=verification.get("source", "")
        )
        results.append(result)

    return results


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "fact-checking-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
