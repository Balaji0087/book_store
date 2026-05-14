import json
import asyncio
import re
from datetime import datetime

from groq import AsyncGroq
from mcp import ClientSession
from mcp.client.sse import sse_client

from config import GROQ_API_KEY
from utils import parse_mcp_response, normalize

MCP_SERVER_URL = "http://localhost:8000/sse"

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Chandigarh", "Puducherry", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep"
]

def _find_book_query(history: list[dict]) -> str | None:
    if not history:
        return None
    for msg in reversed(history):
        if msg.get("role") != "user":
            continue
        text = msg.get("content", "")
        match = re.search(r"\b(?:buy|order|purchase|want to buy|want to order|add)\b\s+['\"]?([^'\"]+)['\"]?", text, re.I)
        if match:
            return match.group(1).strip()
        match = re.search(r"['\"]([^'\"]+)['\"]", text)
        if match:
            return match.group(1).strip()
    return None


def _parse_shipping_details(text: str) -> dict:
    details = {
        "full_name": None,
        "phone_number": None,
        "street": None,
        "city": None,
        "state": None,
        "zip_code": None
    }

    lower_text = text.lower()
    name_match = re.search(r"\b(?:my name is|i am|i'm|im)\s+([A-Za-z ]{2,})", text, re.I)
    if name_match:
        details["full_name"] = name_match.group(1).strip().rstrip(',')

    phone_match = re.search(r"\b(\d{10})\b", text)
    if phone_match:
        details["phone_number"] = phone_match.group(1)

    zip_match = re.search(r"\b(\d{6})\b", text)
    if zip_match:
        details["zip_code"] = zip_match.group(1)

    for state in INDIAN_STATES:
        if state.lower() in lower_text:
            details["state"] = state
            break

    segments = [seg.strip() for seg in re.split(r"[;,]", text) if seg.strip()]
    if not details["street"]:
        for seg in segments:
            if "address" in seg.lower():
                street_part = re.sub(r".*address[:]?", "", seg, flags=re.I).strip()
                if street_part:
                    details["street"] = street_part
                    break
    if not details["street"] and segments:
        for seg in segments:
            if not re.search(r"\b(phone|address|name|tamil nadu|sivakasi|\d{6})\b", seg, re.I):
                details["street"] = seg
                break

    if not details["city"] or not details["street"]:
        for i, seg in enumerate(segments):
            if details["state"] and details["state"].lower() in seg.lower():
                if i > 0:
                    details["city"] = segments[i - 1]
            if details["zip_code"] and details["zip_code"] in seg:
                if i > 0 and not details["city"]:
                    details["city"] = segments[i - 1]

    if not details["city"] and len(segments) >= 2:
        last = segments[-1]
        if details["zip_code"] and details["zip_code"] in last and len(segments) >= 3:
            details["city"] = segments[-2]

    return details


def _infer_place_order_args(user_message: str, history: list[dict], user_id: str | None):
    if not history or not user_id:
        return None
    last_assistant = next((msg for msg in reversed(history) if msg.get("role") == "assistant"), None)
    if not last_assistant:
        return None
    if "shipping" not in last_assistant.get("content", "").lower() and "address" not in last_assistant.get("content", "").lower():
        return None

    shipping = _parse_shipping_details(user_message)
    if not (shipping["street"] and shipping["city"] and shipping["state"] and shipping["zip_code"] and shipping["phone_number"]):
        return None

    if not shipping["full_name"]:
        for msg in reversed(history):
            if msg.get("role") == "user":
                name_match = re.search(r"\b(?:my name is|i am|i'm|im)\s+([A-Za-z ]{2,})", msg.get("content", ""), re.I)
                if name_match:
                    shipping["full_name"] = name_match.group(1).strip().rstrip(',')
                    break

    if not shipping["full_name"]:
        return None

    book_query = _find_book_query(history)
    if not book_query:
        return None

    return {
        "user_id": user_id,
        "book_search_query": book_query,
        "full_name": shipping["full_name"],
        "phone_number": shipping["phone_number"],
        "street": shipping["street"],
        "city": shipping["city"],
        "state": shipping["state"],
        "zip_code": shipping["zip_code"]
    }

# -------------------------
# SETUP GROQ CLIENT
# -------------------------
client = AsyncGroq(api_key=GROQ_API_KEY)
GROQ_MODEL ="qwen/qwen3-32b" #"llama-3.3-70b-versatile"

# -------------------------
# SYSTEM PROMPT — injected with today's date at runtime
# -------------------------
def get_system_prompt(user_id=None, role: str = "user") -> str:
    today = datetime.now().strftime("%Y-%m-%d")  # e.g. 2026-03-22
    current_year = datetime.now().year
    
    if role == "admin":
        user_context = f"\nYou are the ADMIN STORE ASSISTANT. You have full access to global order data and store metrics. You do NOT have a specific User ID, and you do NOT need a user_id to look up orders. When accessing orders, you can pull ALL orders globally by omitting user_id."
    else:
        user_context = f"\nBefore calling place_order, you MUST ask the user for their full name, phone number, and complete address (street, city, state, zip code). Only call place_order ONCE you have all these details gathered from the conversation."

    if role == "admin":
        rules = """
STRICT RULES:
- You ONLY use data returned from the available tools (db).
- You have full access to answer questions about total store revenue, general store statistics, global orders, and books catalog.
- If the user is just saying hello or thank you, respond casually and DO NOT call any tool.
- Never answer from your own knowledge about store data. Always call the right tool first.
- Keep all answers short and concise.
- Show price details in Indian Rupees (INR ₹).
"""
    else:
        rules = """
STRICT RULES:
- You ONLY use data returned from the available tools (db).
- You DO NOT answer questions about total store revenue, general store statistics, or other customers' orders.
- If the user asks ANYTHING outside books and their own orders, reply EXACTLY: "I only assist with books, and your personal order details."
- If the user is just saying hello or thank you, respond casually and DO NOT call any tool.
- Never answer from your own knowledge about store data. Always call the right tool first.
- Keep all answers short and concise.
- Show price details in Indian Rupees (INR ₹).
- If no tool matches the question, say: "I don't have data on that. I can help with finding books, recommendations, and your orders."
- If the user provides complete shipping details in one message, parse it into street, city, state, and zip code without asking again.
- If name and phone number are already present in previous messages, do not ask for them again.
"""

    return f"""You are a customer-facing bookstore assistant (or Admin assistant if designated). If you need to ask for details, ask naturally. Otherwise, answer using the data given.
{user_context}

Today's date is {today}. Current year is {current_year}.
When the user mentions a date without a year, ALWAYS assume the current year ({current_year}).
{rules}
"""

# -------------------------
# TOOL SCHEMAS for LLM function calling
# -------------------------
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "list_books",
            "description": "Get a list of all books available in the bookstore.",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "books_under_price",
            "description": "Get books that cost less than a given price.",
            "parameters": {
                "type": "object",
                "properties": {
                    "max_price": {"type": "number", "description": "Maximum price limit"}
                },
                "required": ["max_price"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_similar_books",
            "description": "Recommend books similar to a given query or book title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Book title or topic to base recommendations on"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "customers_also_bought",
            "description": "Get books that customers also bought along with a specific book.",
            "parameters": {
                "type": "object",
                "properties": {
                    "book_title": {"type": "string", "description": "The book title to find co-purchases for"}
                },
                "required": ["book_title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_orders",
            "description": "Get the user's past orders and order details. Can filter by order ID or date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "Optional specific order ID to look up (e.g., ORD-12345)."
                    },
                    "date_str": {
                        "type": "string",
                        "description": "Optional date to look up orders on, in YYYY-MM-DD format."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "place_order",
            "description": "Place a real order for a book using Cash on Delivery for a user. ALWAYS use this if the user says 'buy', 'order' or wants to purchase a book AFTER collecting all shipping details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "book_search_query": {
                        "type": "string",
                        "description": "The title or query of the book the user wants to buy."
                    },
                    "full_name": {"type": "string", "description": "User's full name."},
                    "phone_number": {"type": "string", "description": "User's phone number."},
                    "street": {"type": "string", "description": "Shipping street address."},
                    "city": {"type": "string", "description": "Shipping city."},
                    "state": {"type": "string", "description": "Shipping state."},
                    "zip_code": {"type": "string", "description": "Shipping zip or postal code."}
                },
                "required": ["book_search_query", "full_name", "phone_number", "street", "city", "state", "zip_code"]
            }
        }
    }
]

ADMIN_TOOL_SCHEMAS = [t for t in TOOL_SCHEMAS if t["function"]["name"] not in ("get_user_orders", "place_order")] + [
    {
        "type": "function",
        "function": {
            "name": "date_range_analytics",
            "description": "Get global store metrics, revenue, and order numbers for a given date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "Start date YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "End date YYYY-MM-DD"}
                },
                "required": ["start_date", "end_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_orders",
            "description": "Get a list of orders. As admin, DO NOT provide user_id unless searching for a specific user. Can filter by order_id or date_str globally.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string", 
                        "description": "Optional user ID to filter by."
                    },
                    "order_id": {
                        "type": "string",
                        "description": "Optional specific order ID to look up (e.g., ORD-12345)."
                    },
                    "date_str": {
                        "type": "string",
                        "description": "Optional date to look up orders on, in YYYY-MM-DD format."
                    }
                },
                "required": []
            }
        }
    }
]

# -------------------------
# STEP 1: LLM decides which tool to call (or refuses out-of-scope)
# -------------------------
async def decide_tool(user_message: str, user_id: str = None, history: list[dict] = None, role: str = "user"):
    system_prompt = get_system_prompt(user_id, role)  # fresh prompt with today's date

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for item in history:
            if item.get("role") in ("user", "assistant") and item.get("content"):
                messages.append({"role": item["role"], "content": item["content"]})

    messages.append({"role": "user", "content": user_message})

    schemas = ADMIN_TOOL_SCHEMAS if role == "admin" else TOOL_SCHEMAS

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        tools=schemas,
        tool_choice="auto",
        max_tokens=1024,
        temperature=0.2,
    )

    choice = response.choices[0]

    # LLM chose to call a tool
    if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
        tool_call = choice.message.tool_calls[0]
        tool_name = tool_call.function.name
        tool_args = json.loads(tool_call.function.arguments or "{}")
        return tool_name, tool_args, None

    # LLM responded with text (out-of-scope or no matching tool)
    return None, None, choice.message.content

# -------------------------
# STEP 2: Format tool result via LLM
# -------------------------
async def format_result(user_message: str, tool_name: str, data: dict, user_id: str = None, role: str = "user") -> str:
    system_prompt = get_system_prompt(user_id, role)

    prompt = f"""
You are a customer-facing bookstore assistant.
Use the tool result to answer the user naturally and beautifully formatted in markdown.

SPECIAL FORMATTING RULES:
If the tool used is "get_user_orders" and it returns a list of multiple orders, DO NOT simply dump the raw JSON or a boring list. Summarize the orders gracefully. Example format:
"You have **12 total orders**. Here's the breakdown: 
- **7 pending** 
- **2 shipped** 
- **3 delivered**
Total amount spent: **₹25,410**. 
Let me know if you need details on a specific order."

If the tool result contains a 'message' or 'order_id', respond exactly with that message or confirmation.
If the tool was successful, confirm it clearly and do not invent extra details.

User asked: "{user_message}"
Tool used: {tool_name}
Tool result: {json.dumps(data)}
"""

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1024,
        temperature=0.1,
    )
    raw = response.choices[0].message.content or ""

    # Strip <think>...</think> blocks that qwen3 leaks into output
    clean = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL).strip()
    clean = re.sub(r"<think>.*$", "", clean, flags=re.DOTALL).strip()

    if not clean or re.search(r"tool used|the tool|tool result", clean, re.I):
        if isinstance(data, dict):
            clean = data.get("message") or data.get("order_id") or data.get("error")
            if not clean:
                if tool_name == "place_order" and isinstance(data, dict):
                    clean = data.get("message") or ("Order placed successfully. Your order ID is " + data.get("order_id", "N/A"))
                else:
                    clean = json.dumps(data)
        else:
            clean = str(data)

    if not clean and tool_name == "place_order" and isinstance(data, dict):
        clean = data.get("message") or ("Order placed successfully. Your order ID is " + data.get("order_id", "N/A"))

    return clean

# -------------------------
# MAIN CHATBOT FUNCTION
# -------------------------
async def ask_chatbot(user_message: str, user_id: str = None, history: list[dict] = None, role: str = "user"):
    tool_name, tool_args, llm_text_reply = await decide_tool(user_message, user_id, history, role)

    manual_order_args = None
    if not tool_name:
        manual_order_args = _infer_place_order_args(user_message, history, user_id)
        if manual_order_args:
            tool_name = "place_order"
            tool_args = manual_order_args

    # Out-of-scope or no tool matched — return LLM's refusal/fallback text
    if not tool_name:
        return {"answer": llm_text_reply or "Sorry, I couldn't understand that. Please provide more details."}

    # Execute the MCP tool
    async with sse_client(MCP_SERVER_URL) as streams:
        async with ClientSession(*streams) as session:
            await session.initialize()

            # Auto-inject user_id for tools that require it behind the scenes
            if role != "admin" and tool_name in ["get_user_orders", "place_order"] and user_id:
                tool_args["user_id"] = user_id
            # Also inject user_id for admin if it was placed in tool_args but fell back
            if role == "admin" and tool_name == "place_order" and user_id:
                tool_args["user_id"] = tool_args.get("user_id") or user_id

            result = await session.call_tool(tool_name, tool_args)
            parsed = parse_mcp_response(result)
            normalized = normalize(parsed)

            # Format the result
            answer = await format_result(user_message, tool_name, normalized, user_id, role)
            if not answer or not answer.strip():
                if isinstance(normalized, dict):
                    answer = normalized.get("message") or normalized.get("order_id") and f"Order placed successfully. Your order ID is {normalized.get('order_id')}" or normalized.get("error") or "Sorry, something went wrong while placing your order."
                else:
                    answer = str(normalized) or "Sorry, something went wrong while placing your order."

            return {
                "answer": answer,
                "tool_used": tool_name,
                "data": normalized
            }

# # -------------------------
# # TESTING (optional)
# # -------------------------
# if __name__ == "__main__":
#     async def test():
#         tests = [
#             "tell the feb 14 sales",               # should use 2026
#             "predict the revenue of the next month",
#             "who is the president of USA?",         # should refuse
#             "show me top selling books",
#         ]
#         for q in tests:
#             print(f"\nQ: {q}")
#             r = await ask_chatbot(q)
#             print(f"A: {r['answer']}")
#
#     asyncio.run(test())