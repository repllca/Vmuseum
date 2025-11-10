import csv
from typing import List, Dict

def load_artworks(csv_path: str) -> List[Dict]:
    """CSVを読み込んで作品リストを返す"""
    artworks = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            artworks.append(row)
    return artworks
