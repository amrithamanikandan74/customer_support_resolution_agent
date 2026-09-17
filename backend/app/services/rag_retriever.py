import json
import sys

import chromadb
from sentence_transformers import SentenceTransformer

from app.config import KNOWLEDGE_BASE_FILE, CHROMA_DB_DIR, EMBEDDING_MODEL, RAG_TOP_K


class RAGRetriever:
    """Semantic retriever using sentence-transformers + ChromaDB."""

    def __init__(self):
        try:
            self.embedding_model = SentenceTransformer(EMBEDDING_MODEL)
        except Exception as e:
            # The first run downloads ~80MB from huggingface.co. Without
            # internet access (or on a locked-down network) that download
            # fails with a long, unreadable transformers traceback — this
            # turns it into something you can actually act on.
            print(
                f"\n[!] Couldn't load the embedding model '{EMBEDDING_MODEL}'.\n"
                f"    This downloads from huggingface.co the first time it runs, "
                f"so it needs an internet connection once.\n"
                f"    Underlying error: {e}\n",
                file=sys.stderr,
            )
            raise RuntimeError(
                f"Embedding model '{EMBEDDING_MODEL}' unavailable — see the network "
                f"note above. The app can't retrieve knowledge articles without it."
            ) from e

        self.top_k = RAG_TOP_K

        # Load or build the ChromaDB collection
        self.client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
        self.collection = self._get_or_build_collection()

    def _get_or_build_collection(self):
        """Get existing collection or build it from the knowledge base."""
        collection_name = "knowledge_base"

        # Check if collection already exists with data
        try:
            collection = self.client.get_collection(name=collection_name)
            if collection.count() > 0:
                return collection
        except Exception:
            pass

        # Build from scratch
        # Delete if exists (empty or corrupt)
        try:
            self.client.delete_collection(name=collection_name)
        except Exception:
            pass

        collection = self.client.create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

        # Load knowledge base
        with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
            articles = json.load(f)

        # Embed and insert
        ids = []
        documents = []
        metadatas = []

        for article in articles:
            # Combine title + content for richer embedding
            text = f"{article['title']}. {article['content']}"
            ids.append(article["id"])
            documents.append(text)
            metadatas.append({
                "title": article["title"],
                "category": article["category"],
                "content": article["content"]
            })

        # Generate embeddings
        embeddings = self.embedding_model.encode(documents).tolist()

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        print(f"[+] Built vector store with {len(articles)} articles")
        return collection

    def retrieve(self, query: str, top_k: int = None) -> list[dict]:
        """
        Retrieve the top-K most semantically similar knowledge articles.

        Returns a list of dicts with keys: id, title, category, content, similarity
        """
        k = top_k or self.top_k

        # Embed the query
        query_embedding = self.embedding_model.encode([query]).tolist()

        # Search ChromaDB
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=k,
            include=["metadatas", "distances"]
        )

        # Format results
        retrieved = []
        for i in range(len(results["ids"][0])):
            metadata = results["metadatas"][0][i]
            distance = results["distances"][0][i]

            # ChromaDB cosine distance → similarity (1 - distance)
            similarity = round(1 - distance, 4)

            retrieved.append({
                "id": results["ids"][0][i],
                "title": metadata["title"],
                "category": metadata["category"],
                "content": metadata["content"],
                "similarity": similarity
            })

        return retrieved
