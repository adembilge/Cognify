from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

class Summarizer:
    def __init__(self, model_name="sshleifer/distilbart-cnn-12-6"):
        self.model_name = model_name
        self.summarizer_pipeline = None

    def _load_model(self):
        if not self.summarizer_pipeline:
            try:
                print(f"⏳ Loading Summarization Model ({self.model_name})...")
                self.summarizer_pipeline = pipeline("summarization", model=self.model_name)
                print("✅ Summarization Model Loaded.")
            except Exception as e:
                logger.error(f"Failed to load summarizer: {e}")
                return None
        return self.summarizer_pipeline

    def summarize(self, text, max_length=150, min_length=40):
        if not text or len(text) < 100:
            return "Text too short for meaningful summarization."
        
        pipe = self._load_model()
        if not pipe:
            return "Summarization model unavailable."

        # Truncate to reasonably safe input length for BART (approx 1024 tokens)
        # 1 token ~= 4 chars, so ~4000 chars is safe-ish limit without tokenizing
        input_text = text[:4000]

        try:
            summary_output = pipe(input_text, max_length=max_length, min_length=min_length, do_sample=False)
            return summary_output[0]['summary_text']
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            return "Error generating summary."

    def generate_tags(self, text):
        # We delegate tagging to the zero-shot classifier now, or keep a fallback here
        return []
