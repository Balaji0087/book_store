from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chat_service import ask_chatbot
from config import FRONTEND_URL, ADMIN_URL

app = FastAPI()

# CORS configuration
origins = [
    FRONTEND_URL,
    ADMIN_URL,
    "http://localhost:5173",   # React default for development
    "http://127.0.0.1:5173",
    "*"  # allow all (for development only)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat")
async def chat(body: dict):
    user_message = body["message"]
    user_id = body.get("user_id")
    role = body.get("role", "user")
    history = body.get("history")
    reply = await ask_chatbot(user_message, user_id, history, role)
    return {"response": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)