from fastapi import FastAPI
from app.schemas import IncidentRequest, ResolutionResponse
from app.services.resolution_orchestrator import ResolutionOrchestrator

app = FastAPI(
    title="Customer Support Resolution Agent",
    description="Intent Classifier + Knowledge Retriever + Response Generator",
    version="1.0.0"
)

orchestrator = ResolutionOrchestrator()


@app.get("/")
def root():
    return {"message": "Customer Support Resolution Agent is running"}


@app.post("/resolve", response_model=ResolutionResponse)
def resolve_incident(request: IncidentRequest):
    result = orchestrator.resolve(
        request.incident_text,
        request.user_name
    )
    return result