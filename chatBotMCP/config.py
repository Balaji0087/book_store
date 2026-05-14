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
ADMIN_URL = os.getenv("ADMIN_URL", "http://localhost:5174")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:8000/sse")
