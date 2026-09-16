import pytest
from app.services.rag_retriever import RAGRetriever


@pytest.fixture(scope="module")
def retriever():
    return RAGRetriever()


def test_retrieve_articles(retriever):
    articles = retriever.retrieve("I can't log in to my account", top_k=3)
    assert len(articles) == 3
    assert "title" in articles[0]
    assert "category" in articles[0]
    assert "similarity" in articles[0]
    assert articles[0]["similarity"] > 0.4


def test_retrieve_payment_article(retriever):
    articles = retriever.retrieve("payment charged twice on my card", top_k=2)
    assert len(articles) == 2
    assert "payment" in articles[0]["category"] or "billing" in articles[0]["content"].lower()
