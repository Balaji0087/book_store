from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from config import MONGO_URI, DB_NAME

# -------------------------
# SETUP
# -------------------------
mongo = MongoClient(MONGO_URI)
db = mongo[DB_NAME]

# Runs fully locally — no API key, no rate limits, no cost
# Downloads model once (~90MB), cached after that
model = SentenceTransformer("all-MiniLM-L6-v2")  # 384-dim

# -------------------------
# GENERATE & STORE EMBEDDINGS
# -------------------------
books = list(db.books.find())
print(f"Generating embeddings for {len(books)} books...")

for i, book in enumerate(books):
    text = f"{book['title']} {book['author']} {book['category']}"

    embedding = model.encode(text).tolist()  # numpy -> plain list for MongoDB

    db.books.update_one(
        {"_id": book["_id"]},
        {"$set": {"embedding": embedding}}
    )

    print(f"[{i+1}/{len(books)}] Done: {book['title']}")

print("All embeddings created successfully.")