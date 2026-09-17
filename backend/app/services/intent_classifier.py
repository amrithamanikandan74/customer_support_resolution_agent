import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.config import INCIDENTS_FILE, MODEL_FILE, MODEL_DIR


class IntentClassifier:
    def __init__(self):
        self.model = None
        self._load_or_train()

    def train(self):
        """Public entry point — regenerate the model from backend/data/incidents.csv."""
        self._train_model()

    def _train_model(self):
        df = pd.read_csv(INCIDENTS_FILE)

        X = df["text"]
        y = df["intent"]

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("clf", LogisticRegression(max_iter=1000))
        ])

        pipeline.fit(X, y)

        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(pipeline, MODEL_FILE)

        self.model = pipeline

    def _load_or_train(self):
        if MODEL_FILE.exists():
            self.model = joblib.load(MODEL_FILE)
        else:
            self._train_model()

    def predict(self, text: str) -> dict:
        prediction = self.model.predict([text])[0]
        probabilities = self.model.predict_proba([text])[0]
        confidence = float(max(probabilities))

        return {
            "intent": prediction,
            "confidence": round(confidence, 2)
        }