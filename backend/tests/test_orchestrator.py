import pytest
from app.services.resolution_orchestrator import ResolutionOrchestrator


@pytest.fixture(scope="module")
def orchestrator():
    return ResolutionOrchestrator()


def test_validate_intent_success(orchestrator):
    assert orchestrator.validate_intent("login_issue", "I cannot log in") is True
    assert orchestrator.validate_intent("refund_request", "I need a refund") is True


def test_resolve_known_issue(orchestrator):
    res = orchestrator.resolve("I cannot log in to my account", "Alice")
    assert res["status"] in ["resolved", "escalated"]
    assert res["user_name"] == "Alice"
    assert "retrieved_articles" in res
    assert len(res["retrieved_articles"]) > 0


def test_resolve_escalation_case(orchestrator):
    # Unclear query should trigger escalation or valid handling
    res = orchestrator.resolve("xyz random gibberish phrase 12345", "Bob")
    assert res["status"] in ["resolved", "escalated"]
    assert res["user_name"] == "Bob"
