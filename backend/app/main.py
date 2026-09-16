from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import IncidentRequest, ResolutionResponse
from app.services.resolution_orchestrator import ResolutionOrchestrator

app = FastAPI(
    title="Customer Support Resolution Agent",
    description="Provide a customer incident as input. Example inputs are shown below for testing.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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