from data_loader import load_artworks
from embedding_service import embed_text, embed_artworks
from search_engine import find_similar_artworks

if __name__ == "__main__":
    artworks = load_artworks("GoghDB/Paintings.csv")
    embed_fields = ["title", "year", "season", "medium", "hue", "place"]

    print("🔵 Embedding artworks with local model...")
    artwork_embeddings = embed_artworks(artworks, embed_fields)

    query = input("見たい作品を日本語または英語で入力してください: ")
    print(f"\n🔍 Searching for: {query}\n")

    results = find_similar_artworks(query, embed_text, artworks, artwork_embeddings, top_k=5)

    print("🎨 検索結果:")
    for art in results:
        print(f"- {art['title']} ({art['year']}, {art['catalogF']}) "
              f"[類似度: {art['similarity']:.3f}]")
