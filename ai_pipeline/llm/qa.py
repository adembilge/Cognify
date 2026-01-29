from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

class QuestionAnswering:
    def __init__(self, model_name="deepset/roberta-base-squad2"):
        self.model_name = model_name
        self.qa_pipeline = None

    def _load_model(self):
        if not self.qa_pipeline:
            try:
                print(f"⏳ Loading QA Model ({self.model_name})...")
                self.qa_pipeline = pipeline("question-answering", model=self.model_name)
                print("✅ QA Model Loaded.")
            except Exception as e:
                logger.error(f"Failed to load QA model: {e}")
                return None
        return self.qa_pipeline

    def answer_question(self, question, context):
        if not question or not context:
            return "Please provide both question and context."
        
        pipe = self._load_model()
        if not pipe:
            return "QA model unavailable."

        # Truncate context if needed, but extractive QA handles long contexts better than Summarization
        # Still good to limit to ~2000 chars for speed in this demo
        truncated_context = context[:5000]

        try:
            result = pipe(question=question, context=truncated_context)
            return {
                "answer": result['answer'],
                "score": round(result['score'], 4),
                "model": self.model_name
            }
        except Exception as e:
            logger.error(f"QA failed: {e}")
            return "Error answering question."
