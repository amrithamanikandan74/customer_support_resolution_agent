"""
Build the ChromaDB vector store from knowledge_base.json.

Run this once (or after updating the knowledge base):
    python data/build_vector_store.py
"""

import json
import shutil
import sys
from pathlib import Path

# Add the backend directory to the path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sentence_transformers import SentenceTransformer
import chromadb

from app.config import KNOWLEDGE_BASE_FILE, CHROMA_DB_DIR, EMBEDDING_MODEL


def build_vector_store():
    print(f"[+] Loading knowledge base from {KNOWLEDGE_BASE_FILE}")
    with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
        articles = json.load(f)
    print(f"   Found {len(articles)} articles")

    print(f"[+] Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    print("[+] Connecting to ChromaDB persistent store...")
    client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))

    # Reset existing collection if present
    try:
        client.delete_collection(name="knowledge_base")
        print("[+] Reset existing 'knowledge_base' collection")
    except Exception:
        pass

    collection = client.create_collection(
        name="knowledge_base",
        metadata={"hnsw:space": "cosine"}
    )

    # Prepare data
    ids = []
    documents = []
    metadatas = []

    for article in articles:
        text = f"{article['title']}. {article['content']}"
        ids.append(article["id"])
        documents.append(text)
        metadatas.append({
            "title": article["title"],
            "category": article["category"],
            "content": article["content"]
        })

    print(f"[+] Generating embeddings for {len(articles)} articles...")
    embeddings = model.encode(documents, show_progress_bar=True).tolist()

    print("[+] Storing in ChromaDB...")
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )

    print(f"\n[SUCCESS] Vector store built successfully!")
    print(f"   Location: {CHROMA_DB_DIR}")
    print(f"   Articles indexed: {collection.count()}")

    # Test a sample query
    print("\n[+] Testing with sample query: 'I cannot log in to my account'")
    query_embedding = model.encode(["I cannot log in to my account"]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=3,
        include=["metadatas", "distances"]
    )

    print("   Top 3 results:")
    for i in range(len(results["ids"][0])):
        title = results["metadatas"][0][i]["title"]
        distance = results["distances"][0][i]
        similarity = 1 - distance
        print(f"   {i+1}. {title} (similarity: {similarity:.2%})")


if __name__ == "__main__":
    build_vector_store()
