import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "Book_Store"
VECTOR_INDEX_NAME = "book_vector_index"
ANTHROPIC_API_KEY=os.getenv("ANTHROPIC_API_KEY")
GROQ_API_KEY=os.getenv("GROQ_API_KEY")
HF_API_KEY='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'