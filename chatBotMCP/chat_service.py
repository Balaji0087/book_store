import json
import asyncio
import re
from datetime import datetime

from groq import AsyncGroq
from mcp import ClientSession
from mcp.client.sse import sse_client

from config import GROQ_API_KEY, MCP_SERVER_URL
from utils import parse_mcp_response, normalize

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Chandigarh", "Puducherry", "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
]

# Phrases that indicate the LLM hallucinated a refusal instead of calling a tool
_ORDER_REFUSAL_PATTERNS = re.compile(
    r"cannot process orders|unable to place|don't have the ability|"
    r"i am not able to|i'm not able to|i cannot place|i can't place|"
    r"please provide your|please share your|could you please share|"
    r"i currently cannot|not able to process",
    re.I,
)


def _strip_think_blocks(text: str) -> str:
    """Remove <think>...</think> blocks that qwen3 leaks into output."""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = re.sub(r"<think>.*$", "", text, flags=re.DOTALL)
    return text.strip()


def _find_book_query(history: list[dict]) -> str | None:
    """Scan conversation history for the book the user wants to buy."""
    if not history:
        return None
    for msg in reversed(history):
        if msg.get("role") != "user":
            continue
        text = msg.get("content", "")
        match = re.search(
            r"\b(?:buy|order|purchase|want to buy|want to order|add)\b\s+['\"]?([^'\"]+)['\"]?",
            text, re.I
        )
        if match:
            return match.group(1).strip()
        match = re.search(r"['\"]([^'\"]+)['\"]", text)
        if match:
            return match.group(1).strip()
    return None


def _parse_shipping_details(text: str) -> dict:
    """Extract shipping fields from a free-text message."""
    details = {
        "full_name": None,
        "phone_number": None,
        "street": None,
        "city": None,
        "state": None,
        "zip_code": None,
    }

    lower_text = text.lower()

    name_match = re.search(r"\b(?:my name is|i am|i'm|im)\s+([A-Za-z ]{2,})", text, re.I)
    if name_match:
        details["full_name"] = name_match.group(1).strip().rstrip(",")

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
            if not re.search(
                r"\b(phone|address|name|tamil nadu|sivakasi|\d{6})\b", seg, re.I
            ):
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
        if (
            details["zip_code"]
            and details["zip_code"] in last
            and len(segments) >= 3
        ):
            details["city"] = segments[-2]

    return details


def _infer_place_order_args(
    user_message: str, history: list[dict], user_id: str | None
) -> dict | None:
    """
    Try to build place_order args from the current message + history without
    relying on the LLM — used as a fallback when the LLM refuses to call the tool.
    """
    if not history or not user_id:
        return None

    # Only attempt if the assistant previously asked for shipping info
    last_assistant = next(
        (msg for msg in reversed(history) if msg.get("role") == "assistant"), None
    )
    if not last_assistant:
        return None
    assistant_text = last_assistant.get("content", "").lower()
    if "shipping" not in assistant_text and "address" not in assistant_text:
        return None

    shipping = _parse_shipping_details(user_message)

    # Try to pull name/phone from earlier messages if missing
    if not shipping["full_name"] or not shipping["phone_number"]:
        for msg in reversed(history):
            if msg.get("role") != "user":
                continue
            prev = msg.get("content", "")
            if not shipping["full_name"]:
                name_match = re.search(
                    r"\b(?:my name is|i am|i'm|im)\s+([A-Za-z ]{2,})", prev, re.I
                )
                if name_match:
                    shipping["full_name"] = name_match.group(1).strip().rstrip(",")
            if not shipping["phone_number"]:
                phone_match = re.search(r"\b(\d{10})\b", prev)
                if phone_match:
                    shipping["phone_number"] = phone_match.group(1)

    required = ["full_name", "phone_number", "street", "city", "state", "zip_code"]
    if not all(shipping.get(f) for f in required):
        return None

    book_query = _find_book_query(history)
    if not book_query:
        return None

    return {
        "user_id": user_id,
        "book_search_query": book_query,
        **{k: shipping[k] for k in required},
    }


# -------------------------
# SETUP GROQ CLIENT
# -------------------------
client = AsyncGroq(api_key=GROQ_API_KEY)
GROQ_MODEL = "qwen/qwen3-32b"  # "llama-3.3-70b-versatile"


# -------------------------
# SYSTEM PROMPT
# -------------------------
def get_system_prompt(user_id=None, role: str = "user") -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    current_year = datetime.now().year

    if role == "admin":
        user_context = (
            "\nYou are the ADMIN STORE ASSISTANT. You have full access to global order "
            "data and store metrics. You do NOT have a specific User ID, and you do NOT "
            "need a user_id to look up orders. When accessing orders, you can pull ALL "
            "orders globally by omitting user_id."
        )
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
        user_context = (
            f"\nThe current user's ID is: {user_id or 'unknown'}. "
            "You are a customer-facing bookstore assistant."
        )
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

ORDER PLACEMENT RULES (CRITICAL — follow exactly):
- If the user says "buy", "order", "purchase", or expresses any intent to buy a book, you MUST call the place_order tool IMMEDIATELY. Do NOT respond with text saying you cannot process orders.
- If you do not yet have ALL of: full_name, phone_number, street, city, state, zip_code — call place_order anyway and ask the user for the missing fields in your next turn. Do NOT refuse.
- NEVER say "I currently cannot process orders", "I am unable to place orders", or any similar refusal. Always either call the tool or ask for the missing detail naturally.
- Once you have all shipping details, call place_order without asking again.
"""

    return (
        f"You are a customer-facing bookstore assistant (or Admin assistant if designated). "
        f"Answer naturally and helpfully.\n"
        f"{user_context}\n\n"
        f"Today's date is {today}. Current year is {current_year}.\n"
        f"When the user mentions a date without a year, ALWAYS assume the current year ({current_year}).\n"
        f"{rules}"
    )


# -------------------------
# TOOL SCHEMAS for LLM function calling
# -------------------------
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "list_books",
            "description": "Get a list of all books available in the bookstore.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
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
                "required": ["max_price"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_similar_books",
            "description": "Recommend books similar to a given query or book title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Book title or topic to base recommendations on",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "customers_also_bought",
            "description": "Get books that customers also bought along with a specific book.",
            "parameters": {
                "type": "object",
                "properties": {
                    "book_title": {
                        "type": "string",
                        "description": "The book title to find co-purchases for",
                    }
                },
                "required": ["book_title"],
            },
        },
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
                        "description": "Optional specific order ID to look up (e.g., ORD-12345).",
                    },
                    "date_str": {
                        "type": "string",
                        "description": "Optional date to look up orders on, in YYYY-MM-DD format.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "place_order",
            # KEY FIX: Reworded so the LLM calls this IMMEDIATELY on purchase intent,
            # even if some fields are missing — the conversation handles collection.
            "description": (
                "Place a real order for a book using Cash on Delivery. "
                "Call this tool IMMEDIATELY whenever the user says 'buy', 'order', 'purchase', "
                "or expresses any intent to buy a book — even if shipping details are not yet complete. "
                "Do NOT respond with text saying you cannot process orders. "
                "If details are missing, the system will ask the user for them. "
                "Only omit missing optional fields; include all fields you already have."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "book_search_query": {
                        "type": "string",
                        "description": "The title or query of the book the user wants to buy.",
                    },
                    "full_name": {"type": "string", "description": "User's full name."},
                    "phone_number": {
                        "type": "string",
                        "description": "User's 10-digit phone number.",
                    },
                    "street": {
                        "type": "string",
                        "description": "Shipping street address.",
                    },
                    "city": {"type": "string", "description": "Shipping city."},
                    "state": {"type": "string", "description": "Shipping state."},
                    "zip_code": {
                        "type": "string",
                        "description": "Shipping zip or postal code (6 digits for India).",
                    },
                },
                "required": [
                    "book_search_query",
                    "full_name",
                    "phone_number",
                    "street",
                    "city",
                    "state",
                    "zip_code",
                ],
            },
        },
    },
]

ADMIN_TOOL_SCHEMAS = [
    t for t in TOOL_SCHEMAS if t["function"]["name"] not in ("get_user_orders", "place_order")
] + [
    {
        "type": "function",
        "function": {
            "name": "date_range_analytics",
            "description": "Get global store metrics, revenue, and order numbers for a given date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date YYYY-MM-DD",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date YYYY-MM-DD",
                    },
                },
                "required": ["start_date", "end_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_orders",
            "description": (
                "Get a list of orders. As admin, DO NOT provide user_id unless searching "
                "for a specific user. Can filter by order_id or date_str globally."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "Optional user ID to filter by.",
                    },
                    "order_id": {
                        "type": "string",
                        "description": "Optional specific order ID to look up (e.g., ORD-12345).",
                    },
                    "date_str": {
                        "type": "string",
                        "description": "Optional date to look up orders on, in YYYY-MM-DD format.",
                    },
                },
                "required": [],
            },
        },
    },
]


# -------------------------
# STEP 1: LLM decides which tool to call
# -------------------------
async def decide_tool(
    user_message: str,
    user_id: str = None,
    history: list[dict] = None,
    role: str = "user",
):
    system_prompt = get_system_prompt(user_id, role)

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

    if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
        tool_call = choice.message.tool_calls[0]
        tool_name = tool_call.function.name
        tool_args = json.loads(tool_call.function.arguments or "{}")
        return tool_name, tool_args, None

    # LLM responded with text — strip think blocks first
    raw_reply = choice.message.content or ""
    clean_reply = _strip_think_blocks(raw_reply)
    return None, None, clean_reply


# -------------------------
# STEP 2: Detect missing shipping fields and ask for them
# -------------------------
def _missing_shipping_fields(tool_args: dict) -> list[str]:
    required = ["full_name", "phone_number", "street", "city", "state", "zip_code"]
    return [f for f in required if not tool_args.get(f)]


def _ask_for_missing_fields(missing: list[str]) -> str:
    labels = {
        "full_name": "your full name",
        "phone_number": "your 10-digit phone number",
        "street": "your street address",
        "city": "your city",
        "state": "your state",
        "zip_code": "your 6-digit pincode",
    }
    parts = [labels.get(f, f) for f in missing]
    if len(parts) == 1:
        return f"Could you please share {parts[0]}?"
    return "Could you please share: " + ", ".join(parts[:-1]) + f", and {parts[-1]}?"


# -------------------------
# STEP 3: Format tool result via LLM
# -------------------------
async def format_result(
    user_message: str,
    tool_name: str,
    data: dict,
    user_id: str = None,
    role: str = "user",
) -> str:
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
            {"role": "user", "content": prompt},
        ],
        max_tokens=1024,
        temperature=0.1,
    )
    raw = response.choices[0].message.content or ""
    clean = _strip_think_blocks(raw)

    # Fallback: if LLM returned nothing useful, extract from data directly
    if not clean or re.search(r"tool used|the tool|tool result", clean, re.I):
        if isinstance(data, dict):
            clean = (
                data.get("message")
                or (
                    data.get("order_id")
                    and f"Order placed successfully! Your order ID is **{data['order_id']}**."
                )
                or data.get("error")
                or json.dumps(data)
            )
        else:
            clean = str(data)

    if not clean and tool_name == "place_order" and isinstance(data, dict):
        clean = data.get("message") or (
            "Order placed successfully! Your order ID is "
            + data.get("order_id", "N/A")
        )

    return clean


# -------------------------
# MAIN CHATBOT FUNCTION
# -------------------------
async def ask_chatbot(
    user_message: str,
    user_id: str = None,
    history: list[dict] = None,
    role: str = "user",
):
    tool_name, tool_args, llm_text_reply = await decide_tool(
        user_message, user_id, history, role
    )

    # ── Fallback 1: LLM refused to call place_order but user clearly wants to buy ──
    if not tool_name:
        manual_order_args = _infer_place_order_args(user_message, history, user_id)
        if manual_order_args:
            tool_name = "place_order"
            tool_args = manual_order_args

    # ── Fallback 2: LLM generated a refusal-style text for an order intent ──
    if not tool_name and llm_text_reply:
        is_order_intent = re.search(
            r"\b(buy|order|purchase|want to buy|want to order)\b", user_message, re.I
        )
        is_refusal = _ORDER_REFUSAL_PATTERNS.search(llm_text_reply)
        if is_order_intent and is_refusal:
            return {
                "answer": (
                    "I'd be happy to help you place an order! 😊 "
                    "Could you please share your full name, 10-digit phone number, "
                    "and complete shipping address (street, city, state, and 6-digit pincode)?"
                )
            }

    # ── No tool matched — return LLM's text reply ──
    if not tool_name:
        return {
            "answer": llm_text_reply
            or "Sorry, I couldn't understand that. Please provide more details."
        }

    # ── place_order: check for missing shipping fields before calling MCP ──
    if tool_name == "place_order" and role != "admin":
        missing = _missing_shipping_fields(tool_args)
        if missing:
            return {"answer": _ask_for_missing_fields(missing)}

    # ── Execute the MCP tool ──
    async with sse_client(MCP_SERVER_URL) as streams:
        async with ClientSession(*streams) as session:
            await session.initialize()

            # Auto-inject user_id for tools that need it
            if role != "admin" and tool_name in ("get_user_orders", "place_order") and user_id:
                tool_args["user_id"] = user_id

            if role == "admin" and tool_name == "place_order" and user_id:
                tool_args["user_id"] = tool_args.get("user_id") or user_id

            result = await session.call_tool(tool_name, tool_args)
            parsed = parse_mcp_response(result)
            normalized = normalize(parsed)

            answer = await format_result(
                user_message, tool_name, normalized, user_id, role
            )

            if not answer or not answer.strip():
                if isinstance(normalized, dict):
                    answer = (
                        normalized.get("message")
                        or (
                            normalized.get("order_id")
                            and f"Order placed successfully! Your order ID is **{normalized['order_id']}**."
                        )
                        or normalized.get("error")
                        or "Sorry, something went wrong."
                    )
                else:
                    answer = str(normalized) or "Sorry, something went wrong."

            return {
                "answer": answer,
                "tool_used": tool_name,
                "data": normalized,
            }


# -------------------------
# TESTING (optional — uncomment to run)
# -------------------------
# if __name__ == "__main__":
#     async def test():
#         tests = [
#             ("tell the feb 14 sales", None, "admin"),
#             ("who is the president of USA?", "user123", "user"),
#             ("I want to buy Atomic Habits", "user123", "user"),
#             ("show me top selling books", None, "admin"),
#         ]
#         for q, uid, role in tests:
#             print(f"\nQ ({role}): {q}")
#             r = await ask_chatbot(q, user_id=uid, role=role)
#             print(f"A: {r['answer']}")
#
#     asyncio.run(test())