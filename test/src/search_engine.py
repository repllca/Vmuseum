import numpy as np
from scipy.spatial.distance import cosine
from typing import List, Dict

def find_similar_artworks(query: str, embed_func, artworks: List[Dict],
                          artwork_embeddings: Dict[int, np.ndarray],
                          top_k: int = 5) -> List[Dict]:
    """入力クエリと各作品の類似度を計算し、上位作品を返す"""
    query_vec = embed_func(query)
    scores = []
    for idx, art_vec in artwork_embeddings.items():
        similarity = 1 - cosine(query_vec, art_vec)
        scores.append((idx, similarity))
    scores.sort(key=lambda x: x[1], reverse=True)

    results = []
    for idx, sim in scores[:top_k]:
        art = artworks[idx].copy()
        art["similarity"] = sim
        results.append(art)
    return results
