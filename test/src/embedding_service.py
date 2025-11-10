import numpy as np
from sentence_transformers import SentenceTransformer

# ============================================================
# ローカル埋め込みモデル設定
# ============================================================
# 軽量で高速な英語多言語モデル
# （より高精度にしたい場合は intfloat/multilingual-e5-base に変更）
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
print(f"🔵 Loading local model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)

# ============================================================
# テキスト埋め込み関数
# ============================================================
def embed_text(text: str) -> np.ndarray:
    """ローカルモデルでテキストをベクトル化"""
    return model.encode(text, normalize_embeddings=True)

# ============================================================
# 作品群の埋め込み生成
# ============================================================
def embed_artworks(artworks, fields):
    """
    artworks: List[Dict]
    fields: 埋め込みに使うCSV列（title, hue, seasonなど）
    """
    embeddings = {}
    for idx, art in enumerate(artworks):
        # 対象フィールドを結合して1つのテキストに
        concat_text = " ".join([art.get(f, "") for f in fields if art.get(f)])
        embeddings[idx] = embed_text(concat_text)
    return embeddings
