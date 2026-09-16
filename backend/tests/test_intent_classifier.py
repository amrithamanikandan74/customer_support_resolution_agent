import pytest
from app.services.intent_classifier import IntentClassifier


@pytest.fixture(scope="module")
def classifier():
    return IntentClassifier()


def test_predict_login_issue(classifier):
    result = classifier.predict("I cannot log in to my account")
    assert result["intent"] == "login_issue"
    assert result["confidence"] >= 0.25


def test_predict_payment_failed(classifier):
    result = classifier.predict("My payment failed but card was charged")
    assert result["intent"] == "payment_failed"
    assert result["confidence"] >= 0.25


def test_predict_refund_request(classifier):
    result = classifier.predict("I want a refund for my order")
    assert result["intent"] == "refund_request"
    assert result["confidence"] >= 0.25


def test_predict_order_delay(classifier):
    result = classifier.predict("My order has not arrived yet")
    assert result["intent"] == "order_delay"
    assert result["confidence"] >= 0.25
