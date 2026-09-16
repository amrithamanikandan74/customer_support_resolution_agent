from app.services.intent_classifier import IntentClassifier

if __name__ == "__main__":
    classifier = IntentClassifier()
    classifier._train_model()
    print("Model trained successfully and saved.")