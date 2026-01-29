from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

class ContentClassifier:
    def __init__(self):
        self.classifier = None
        self.labels = ["Finance", "Legal", "Research", "Technical", "Creative", "Personal", "Medical"]

    def _load_model(self):
        if not self.classifier:
            try:
                # Using a very lightweight zero-shot classifier to save resources
                # 'valhalla/distilbart-mnli-12-1' is a good balance
                print("⏳ Loading Classification Model...")
                self.classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-1")
                print("✅ Classification Model Loaded.")
            except Exception as e:
                logger.error(f"Failed to load classifier: {e}")
                return None
        return self.classifier

    def classify(self, text, multi_label=True):
        clf = self._load_model()
        if not clf or not text:
            return ["Unclassified"]

        # Truncate text for speed and model limits
        truncated_text = text[:1024] 
        
        try:
            result = clf(truncated_text, self.labels, multi_label=multi_label)
            # Filter labels with score > 0.4
            tags = [label for label, score in zip(result['labels'], result['scores']) if score > 0.4]
            return tags[:3] # Return top 3
        except Exception as e:
            logger.error(f"Classification error: {e}")
            return ["Unclassified"]
