from sentence_transformers import SentenceTransformer
import logging
import numpy as np

logger = logging.getLogger(__name__)

class SemanticSearch:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None

    def _load_model(self):
        if not self.model:
            try:
                print(f"⏳ Loading Embedding Model ({self.model_name})...")
                self.model = SentenceTransformer(self.model_name)
                print("✅ Embedding Model Loaded.")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                return None
        return self.model

    def generate_embedding(self, text):
        if not text:
            return []
        
        model = self._load_model()
        if not model:
            return []
            
        try:
            # Generate embedding
            embedding = model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return []

    def compute_similarity(self, query_embedding, docs_embeddings):
        """
        Compute cosine similarity between query and list of doc embeddings.
        docs_embeddings: list of (doc_id, embedding_vector)
        """
        if not query_embedding or not docs_embeddings:
            return []
            
        from sklearn.metrics.pairwise import cosine_similarity
        
        doc_ids = [d[0] for d in docs_embeddings]
        vectors = [d[1] for d in docs_embeddings]
        
        if not vectors:
            return []

        # Calculate similarity
        # query_embedding is 1D, reshape to (1, -1)
        # vectors is (N, D)
        query_vec = np.array(query_embedding).reshape(1, -1)
        doc_vecs = np.array(vectors)
        
        scores = cosine_similarity(query_vec, doc_vecs)[0]
        
        # Zip IDs and scores, sort by score desc
        results = sorted(zip(doc_ids, scores), key=lambda x: x[1], reverse=True)
        return results
